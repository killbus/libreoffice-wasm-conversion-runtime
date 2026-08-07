import { describe, expect, it, vi } from 'vitest';
import { LOKBindings } from '../src/lok-bindings.js';
import {
  NativeConversionError,
  createNativeConversionRequest,
} from '../src/native-conversion-bridge.js';
import type { NativeConversionResult } from '../src/native-conversion-bridge.js';
import type { EmscriptenFS, EmscriptenModule } from '../src/types.js';

const KIT_POINTER = 0x1234;
const RESULT_POINTER = 0x1000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const successResult: NativeConversionResult = {
  schemaVersion: 1,
  ok: true,
  stage: 'complete',
  cleanup: 'clean',
  hiddenLoad: true,
  visibleFrameSetupEntered: false,
};

const request = createNativeConversionRequest({
  inputPath: '/tmp/input/document.docx',
  outputPath: '/tmp/output/document.pdf',
  inputFormat: 'docx',
  outputFormat: 'pdf',
});

type NativeConvert = NonNullable<EmscriptenModule['_lok_convertDocument']>;
type NativeFree = NonNullable<EmscriptenModule['_lok_convertFree']>;
type TestModule = EmscriptenModule & {
  _lok_convertDocument: NativeConvert;
  _lok_convertFree: NativeFree;
  _libreofficekit_hook: NonNullable<EmscriptenModule['_libreofficekit_hook']>;
};

interface BindingHarness {
  bindings: LOKBindings;
  module: TestModule;
  freed: number[];
  nativeFreed: number[];
  nativeConvert: ReturnType<typeof vi.fn<NativeConvert>>;
  resetAccounting: () => void;
  failMallocAt: (call: number) => void;
  throwOnFree: Set<number>;
  setNativeFreeFailure: (enabled: boolean) => void;
  writeResult: (slotPointer: number, value: string, pointer?: number) => number;
  readString: (pointer: number) => string;
  growMemory: (byteLength: number) => void;
}

function createBindingHarness(): BindingHarness {
  let buffer = new ArrayBuffer(8192);
  let nextPointer = 64;
  let mallocCalls = 0;
  let mallocFailureCall: number | null = null;
  let nativeFreeFailure = false;
  const freed: number[] = [];
  const nativeFreed: number[] = [];
  const throwOnFree = new Set<number>();
  const nativeConvert = vi.fn<NativeConvert>(() => 0);

  let module: TestModule;

  const installMemory = (nextBuffer: ArrayBuffer): void => {
    buffer = nextBuffer;
    module.HEAPU8 = new Uint8Array(buffer);
    module.HEAPU32 = new Uint32Array(buffer);
    module.HEAP32 = new Int32Array(buffer);
  };

  const growMemory = (byteLength: number): void => {
    if (byteLength <= buffer.byteLength) return;
    const nextBuffer = new ArrayBuffer(byteLength);
    new Uint8Array(nextBuffer).set(new Uint8Array(buffer));
    installMemory(nextBuffer);
  };

  module = {
    ccall: vi.fn(),
    cwrap: vi.fn(),
    _malloc: (size: number): number => {
      mallocCalls += 1;
      if (mallocFailureCall === mallocCalls) return 0;

      const pointer = (nextPointer + 3) & ~3;
      nextPointer = pointer + size;
      if (nextPointer > buffer.byteLength) {
        growMemory(Math.max(buffer.byteLength * 2, nextPointer + 1024));
      }
      return pointer;
    },
    _free: (pointer: number): void => {
      freed.push(pointer);
      if (throwOnFree.has(pointer)) {
        throw new Error(`free failed for ${pointer}`);
      }
    },
    HEAPU8: new Uint8Array(buffer),
    HEAPU32: new Uint32Array(buffer),
    HEAP32: new Int32Array(buffer),
    FS: {} as EmscriptenFS,
    _libreofficekit_hook: vi.fn(() => KIT_POINTER),
    _lok_convertDocument: nativeConvert,
    _lok_convertFree: (pointer: number): void => {
      nativeFreed.push(pointer);
      if (nativeFreeFailure) {
        throw new Error(`native free failed for ${pointer}`);
      }
    },
  } as TestModule;

  const writeResult = (
    slotPointer: number,
    value: string,
    pointer = RESULT_POINTER
  ): number => {
    const bytes = encoder.encode(`${value}\0`);
    growMemory(pointer + bytes.length + 64);
    module.HEAPU8.set(bytes, pointer);
    module.HEAPU32[slotPointer / Uint32Array.BYTES_PER_ELEMENT] = pointer;
    return pointer;
  };

  const readString = (pointer: number): string => {
    const end = module.HEAPU8.indexOf(0, pointer);
    return decoder.decode(module.HEAPU8.slice(pointer, end));
  };

  const bindings = new LOKBindings(module);
  bindings.initialize();

  const resetAccounting = (): void => {
    freed.length = 0;
    nativeFreed.length = 0;
    nativeConvert.mockClear();
    mallocCalls = 0;
    mallocFailureCall = null;
    nativeFreeFailure = false;
    throwOnFree.clear();
  };
  resetAccounting();

  return {
    bindings,
    module,
    freed,
    nativeFreed,
    nativeConvert,
    resetAccounting,
    failMallocAt: (call: number) => {
      mallocFailureCall = call;
    },
    throwOnFree,
    setNativeFreeFailure: (enabled: boolean) => {
      nativeFreeFailure = enabled;
    },
    writeResult,
    readString,
    growMemory,
  };
}

function expectNonReusableAbiError(action: () => unknown, message: RegExp): NativeConversionError {
  try {
    action();
    throw new Error('Expected native ABI failure');
  } catch (error) {
    expect(error).toBeInstanceOf(NativeConversionError);
    expect(error).toMatchObject({ kind: 'abi', runtimeReusable: false });
    expect((error as Error).message).toMatch(message);
    return error as NativeConversionError;
  }
}

describe('LOKBindings native conversion ABI ownership', () => {
  it('uses the matching allocator for every successful-path allocation', () => {
    const harness = createBindingHarness();
    let requestPointer = 0;
    let slotPointer = 0;
    harness.nativeConvert.mockImplementation((kit, encodedRequest, resultSlot) => {
      expect(kit).toBe(KIT_POINTER);
      requestPointer = encodedRequest;
      slotPointer = resultSlot;
      expect(JSON.parse(harness.readString(encodedRequest))).toMatchObject({
        schemaVersion: 1,
        outputFilter: 'writer_pdf_Export',
      });
      harness.writeResult(resultSlot, JSON.stringify(successResult));
      return 0;
    });

    expect(harness.bindings.convertDocument(request)).toEqual(successResult);
    expect(harness.nativeFreed).toEqual([RESULT_POINTER]);
    expect(harness.freed).toEqual([requestPointer, slotPointer]);
    expect(harness.freed).not.toContain(RESULT_POINTER);
    expect(harness.nativeFreed).not.toContain(requestPointer);
    expect(harness.nativeFreed).not.toContain(slotPointer);
  });

  it('recovers and frees a result pointer populated immediately before an ABI trap', () => {
    const harness = createBindingHarness();
    let requestPointer = 0;
    let slotPointer = 0;
    harness.nativeConvert.mockImplementation((_kit, encodedRequest, resultSlot) => {
      requestPointer = encodedRequest;
      slotPointer = resultSlot;
      harness.writeResult(resultSlot, JSON.stringify(successResult));
      throw new WebAssembly.RuntimeError('unreachable');
    });

    expectNonReusableAbiError(
      () => harness.bindings.convertDocument(request),
      /bridge trapped/
    );
    expect(harness.nativeFreed).toEqual([RESULT_POINTER]);
    expect(harness.freed).toEqual([requestPointer, slotPointer]);
  });

  it('uses fresh heap views when native conversion grows WASM memory', () => {
    const harness = createBindingHarness();
    harness.nativeConvert.mockImplementation((_kit, _requestPointer, resultSlot) => {
      harness.growMemory(32768);
      harness.writeResult(resultSlot, JSON.stringify(successResult), 0x3000);
      return 0;
    });

    expect(harness.bindings.convertDocument(request)).toEqual(successResult);
    expect(harness.nativeFreed).toEqual([0x3000]);
  });

  it.each([
    ['non-zero ABI status', 7, JSON.stringify(successResult), /ABI status 7/],
    ['null result', 0, null, /returned no result/],
    ['malformed JSON', 0, '{not-json', /malformed JSON/],
    ['invalid result contract', 0, JSON.stringify({
      ...successResult,
      schemaVersion: 2,
    }), /invalid result contract/],
  ])('frees all available allocations for %s', (_name, status, resultJson, message) => {
    const harness = createBindingHarness();
    let requestPointer = 0;
    let slotPointer = 0;
    harness.nativeConvert.mockImplementation((_kit, encodedRequest, resultSlot) => {
      requestPointer = encodedRequest;
      slotPointer = resultSlot;
      if (resultJson !== null) {
        harness.writeResult(resultSlot, resultJson);
      }
      return status;
    });

    expectNonReusableAbiError(
      () => harness.bindings.convertDocument(request),
      message
    );
    expect(harness.freed).toEqual([requestPointer, slotPointer]);
    expect(harness.nativeFreed).toEqual(resultJson === null ? [] : [RESULT_POINTER]);
  });

  it('frees the request when result-slot allocation fails before the native call', () => {
    const harness = createBindingHarness();
    harness.failMallocAt(2);

    expectNonReusableAbiError(
      () => harness.bindings.convertDocument(request),
      /result slot/
    );
    expect(harness.nativeConvert).not.toHaveBeenCalled();
    expect(harness.freed).toHaveLength(1);
    expect(harness.nativeFreed).toEqual([]);
  });

  it('continues every cleanup attempt and quarantines when frees throw', () => {
    const harness = createBindingHarness();
    let requestPointer = 0;
    let slotPointer = 0;
    harness.nativeConvert.mockImplementation((_kit, encodedRequest, resultSlot) => {
      requestPointer = encodedRequest;
      slotPointer = resultSlot;
      harness.throwOnFree.add(encodedRequest);
      harness.setNativeFreeFailure(true);
      harness.writeResult(resultSlot, JSON.stringify(successResult));
      return 0;
    });

    const error = expectNonReusableAbiError(
      () => harness.bindings.convertDocument(request),
      /allocation cleanup failed/
    );
    expect(error.boundaryCause).toBeInstanceOf(AggregateError);
    expect(harness.nativeFreed).toEqual([RESULT_POINTER]);
    expect(harness.freed).toEqual([requestPointer, slotPointer]);
  });

  it('returns a decoded uncertain-cleanup result after releasing all allocations', () => {
    const harness = createBindingHarness();
    const uncertain: NativeConversionResult = {
      schemaVersion: 1,
      ok: false,
      stage: 'cleanup',
      cleanup: 'uncertain',
      hiddenLoad: true,
      visibleFrameSetupEntered: false,
      message: 'close was vetoed',
    };
    harness.nativeConvert.mockImplementation((_kit, _requestPointer, resultSlot) => {
      harness.writeResult(resultSlot, JSON.stringify(uncertain));
      return 0;
    });

    expect(harness.bindings.convertDocument(request)).toEqual(uncertain);
    expect(harness.nativeFreed).toEqual([RESULT_POINTER]);
    expect(harness.freed).toHaveLength(2);
  });
});