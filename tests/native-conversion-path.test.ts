import { describe, expect, it, vi } from 'vitest';
import { LibreOfficeConverter } from '../src/converter-node.js';
import type {
  NativeConversionRequest,
  NativeConversionResult,
} from '../src/native-conversion-bridge.js';
import {
  ConversionErrorCode,
  type EmscriptenFS,
  type EmscriptenModule,
} from '../src/types.js';

const OUTPUT_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

const SUCCESS_RESULT: NativeConversionResult = {
  schemaVersion: 1,
  ok: true,
  stage: 'complete',
  cleanup: 'clean',
  hiddenLoad: true,
  visibleFrameSetupEntered: false,
};

function createHarness() {
  const fs = {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(() => OUTPUT_BYTES.slice()),
    unlink: vi.fn(),
    readdir: vi.fn(() => []),
    stat: vi.fn(() => ({ size: 1, isDirectory: () => false })),
    rmdir: vi.fn(),
    rename: vi.fn(),
    open: vi.fn(),
  } as unknown as EmscriptenFS;

  const runningWorker = {
    unref: vi.fn<() => void>(),
    terminate: vi.fn<() => void>(),
  };
  const terminateAllThreads = vi.fn<() => void>();
  const module = {
    FS: fs,
    PThread: {
      terminateAllThreads,
      runningWorkers: [runningWorker],
      unusedWorkers: [],
    },
  } as unknown as EmscriptenModule;

  const nativeConvert = vi.fn<
    (request: NativeConversionRequest) => NativeConversionResult
  >(() => SUCCESS_RESULT);
  const documentLoad = vi.fn<(path: string) => number>(() => 77);
  const documentLoadWithOptions = vi.fn<
    (path: string, options: string) => number
  >(() => 77);
  const documentSaveAs = vi.fn<
    (document: number, outputPath: string, format: string, options: string) => void
  >();
  const documentDestroy = vi.fn<(document: number) => void>();
  const bindings = {
    convertDocument: nativeConvert,
    documentLoad,
    documentLoadWithOptions,
    documentSaveAs,
    documentDestroy,
  };

  const converter = new LibreOfficeConverter();
  Object.assign(converter as unknown as Record<string, unknown>, {
    module,
    lokBindings: bindings,
    initialized: true,
    corrupted: false,
  });

  return {
    converter,
    module,
    nativeConvert,
    documentLoad,
    documentLoadWithOptions,
    documentSaveAs,
    documentDestroy,
    terminateAllThreads,
    runningWorker,
  };
}

async function convertDocxToPdf(converter: LibreOfficeConverter): Promise<void> {
  await converter.convert(
    new Uint8Array([1, 2, 3]),
    { inputFormat: 'docx', outputFormat: 'pdf' },
    'report.docx'
  );
}

describe('native basic conversion path', () => {
  it('sends DOCX -> PDF through the explicit native filter without raw document calls', async () => {
    const harness = createHarness();

    const result = await harness.converter.convert(
      new Uint8Array([1, 2, 3]),
      { inputFormat: 'docx', outputFormat: 'pdf' },
      'report.docx'
    );

    expect(result.data).toEqual(OUTPUT_BYTES);
    expect(harness.nativeConvert).toHaveBeenCalledWith(expect.objectContaining({
      schemaVersion: 1,
      inputUrl: 'file:///tmp/input/doc.docx',
      outputUrl: 'file:///tmp/output/doc.pdf',
      outputFilter: 'writer_pdf_Export',
    }));
    expect(harness.documentLoad).not.toHaveBeenCalled();
    expect(harness.documentLoadWithOptions).not.toHaveBeenCalled();
    expect(harness.documentSaveAs).not.toHaveBeenCalled();
    expect(harness.documentDestroy).not.toHaveBeenCalled();
  });

  it('reuses the same runtime for two clean native conversions', async () => {
    const harness = createHarness();

    await convertDocxToPdf(harness.converter);
    await convertDocxToPdf(harness.converter);

    expect(harness.nativeConvert).toHaveBeenCalledTimes(2);
    expect(harness.converter.isReady()).toBe(true);
    expect(harness.converter.getModule()).toBe(harness.module);
  });

  it.each([
    ['validate', {
      schemaVersion: 1,
      ok: false,
      stage: 'validate',
      cleanup: 'not-needed',
      hiddenLoad: false,
      visibleFrameSetupEntered: false,
      message: 'request rejected',
    }],
    ['load', {
      schemaVersion: 1,
      ok: false,
      stage: 'load',
      cleanup: 'not-needed',
      hiddenLoad: false,
      visibleFrameSetupEntered: false,
      message: 'document could not be loaded',
    }],
    ['export', {
      schemaVersion: 1,
      ok: false,
      stage: 'export',
      cleanup: 'clean',
      hiddenLoad: true,
      visibleFrameSetupEntered: false,
      message: 'export failed',
    }],
  ] as Array<[string, NativeConversionResult]>) (
    'keeps the runtime reusable after a clean %s failure',
    async (stage, failure) => {
      const harness = createHarness();
      harness.nativeConvert.mockReturnValueOnce(failure).mockReturnValue(SUCCESS_RESULT);

      await expect(convertDocxToPdf(harness.converter)).rejects.toMatchObject({
        code: stage === 'load'
          ? ConversionErrorCode.LOAD_FAILED
          : ConversionErrorCode.CONVERSION_FAILED,
      });
      expect(harness.converter.isReady()).toBe(true);
      expect(harness.converter.getModule()).toBe(harness.module);

      await expect(convertDocxToPdf(harness.converter)).resolves.toBeUndefined();
      expect(harness.nativeConvert).toHaveBeenCalledTimes(2);
    }
  );

  it('quarantines an uncertain-cleanup runtime and terminates its PThreads', async () => {
    const harness = createHarness();
    harness.nativeConvert.mockReturnValue({
      schemaVersion: 1,
      ok: false,
      stage: 'cleanup',
      cleanup: 'uncertain',
      hiddenLoad: true,
      visibleFrameSetupEntered: false,
      message: 'close was vetoed',
    });

    await expect(convertDocxToPdf(harness.converter)).rejects.toMatchObject({
      code: ConversionErrorCode.CONVERSION_FAILED,
    });

    expect(harness.converter.isReady()).toBe(false);
    expect(harness.converter.getModule()).toBeNull();
    expect(harness.converter.getLokBindings()).toBeNull();
    expect(harness.terminateAllThreads).toHaveBeenCalledOnce();
    expect(harness.runningWorker.unref).toHaveBeenCalledOnce();
    expect(harness.runningWorker.terminate).toHaveBeenCalledOnce();
  });

  it('keeps PNG conversion on the legacy raw document-pointer path', async () => {
    const harness = createHarness();

    await harness.converter.convert(
      new Uint8Array([1, 2, 3]),
      { inputFormat: 'docx', outputFormat: 'png' },
      'report.docx'
    );

    expect(harness.nativeConvert).not.toHaveBeenCalled();
    expect(harness.documentLoad).toHaveBeenCalledWith('/tmp/input/doc.docx');
    expect(harness.documentSaveAs).toHaveBeenCalledWith(
      77,
      '/tmp/output/doc.png',
      'png',
      expect.any(String)
    );
    expect(harness.documentDestroy).toHaveBeenCalledWith(77);
  });
});
