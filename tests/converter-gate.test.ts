/**
 * Conversion Gate Test — Phase 1 baseline
 *
 * First gate for the "conversion-only native bridge" task:
 *   test.docx → pdf must succeed end-to-end through the public API.
 *
 * This test uses the EXISTING shipped wasm/soffice.wasm (Git LFS) to
 * establish a baseline BEFORE any conversion-only trimming is applied.
 * The trimmed wasm (produced by the GHA build workflow) must also pass
 * this same gate.
 *
 * Runs through `convertDocument`, which in Node uses SubprocessConverter
 * (forks dist/subprocess.worker.cjs). Requires `npm run build` first so
 * that dist/ is present.
 *
 * Excluded from PR CI via the `tests/*converter*.test.ts` glob in
 * ci.yml / publish.yml. Run manually:
 *   npx vitest run tests/converter-gate.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { convertDocument, ConversionError } from '../src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// test.docx lives at the repo root (real 6.6MB DOCX, the gate input).
const ROOT = path.resolve(__dirname, '..');
const DOCX_PATH = path.join(ROOT, 'test.docx');

// PDF magic bytes
const PDF_SIGNATURE = Buffer.from('%PDF', 'ascii');

describe('Conversion gate: test.docx → pdf', () => {
  let docxBytes: Buffer;

  beforeAll(() => {
    expect(fs.existsSync(DOCX_PATH)).toBe(true);
    docxBytes = fs.readFileSync(DOCX_PATH);
    expect(docxBytes.length).toBeGreaterThan(0);
  });

  it(
    'converts test.docx to a valid PDF via convertDocument',
    async () => {
      const result = await convertDocument(docxBytes, {
        outputFormat: 'pdf',
        inputFormat: 'docx',
      });

      // Non-empty output
      expect(result.data).toBeInstanceOf(Uint8Array);
      expect(result.data.length).toBeGreaterThan(0);

      // PDF signature at the head
      const head = Buffer.from(result.data.buffer, result.data.byteOffset, 4);
      expect(head.equals(PDF_SIGNATURE)).toBe(true);

      // MIME + filename
      expect(result.mimeType).toBe('application/pdf');
      expect(result.filename.endsWith('.pdf')).toBe(true);
    },
    300000 // 5 min: SubprocessConverter init + first conversion is slow
  );

  it(
    'a second conversion reuses the converter and still produces a valid PDF',
    async () => {
      const result = await convertDocument(docxBytes, {
        outputFormat: 'pdf',
        inputFormat: 'docx',
      });

      expect(result.data.length).toBeGreaterThan(0);
      const head = Buffer.from(result.data.buffer, result.data.byteOffset, 4);
      expect(head.equals(PDF_SIGNATURE)).toBe(true);
      expect(result.mimeType).toBe('application/pdf');
    },
    300000
  );
});

describe('Conversion gate: error path', () => {
  it('rejects an unsupported output format with ConversionError', async () => {
    const docxBytes = fs.readFileSync(DOCX_PATH);
    await expect(
      convertDocument(docxBytes, {
        // 'mp3' is not a supported output format
        outputFormat: 'mp3' as never,
        inputFormat: 'docx',
      })
    ).rejects.toThrow(ConversionError);
  });
});
