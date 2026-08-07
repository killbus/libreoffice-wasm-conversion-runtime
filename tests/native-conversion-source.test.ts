import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const patch = readFileSync(
  new URL('../build/patches/wasm-native-conversion-bridge.patch', import.meta.url),
  'utf8'
);
const buildScript = readFileSync(
  new URL('../build/build-wasm.sh', import.meta.url),
  'utf8'
);

describe('native conversion source and build gates', () => {
  it('keeps the bridge patch limited to the four reviewed LibreOffice files', () => {
    const touchedFiles = [...patch.matchAll(
      /^diff --git a\/(\S+) b\/(\S+)$/gm
    )].map((match) => {
      expect(match[2]).toBe(match[1]);
      return match[1];
    });

    expect(touchedFiles).toEqual([
      'desktop/Executable_soffice_bin.mk',
      'desktop/source/lib/init.cxx',
      'include/sfx2/sfxbasecontroller.hxx',
      'sfx2/source/view/sfxbasecontroller.cxx',
    ]);
  });

  it('exports bridge and legacy symbols together in the first bridge artifact', () => {
    const exportLine = patch.split(/\r?\n/).find(
      (line) => line.startsWith('+') && line.includes('EXPORTED_FUNCTIONS=')
    );

    expect(exportLine).toBeDefined();
    for (const symbol of [
      '_main',
      '_lok_convertDocument',
      '_lok_convertFree',
      '_lok_documentLoad',
      '_lok_documentLoadWithOptions',
      '_lok_documentSaveAs',
      '_lok_documentDestroy',
      '_malloc',
      '_free',
    ]) {
      expect(exportLine).toContain(`"${symbol}"`);
    }
  });

  it('matches the official hidden load and explicit export property sets', () => {
    for (const property of ['ReadOnly', 'OpenNewView', 'Hidden', 'Silent']) {
      expect(patch).toContain(
        `comphelper::makePropertyValue(u"${property}"_ustr, true)`
      );
    }
    expect(patch).toMatch(
      /loadComponentFromURL\([\s\S]*aRequest\.maInputURL, u"_blank"_ustr, 0,/
    );
    expect(patch).toContain(
      'u"ConversionRequestOrigin"_ustr, u"CommandLine"_ustr'
    );
    expect(patch).toContain(
      'comphelper::makePropertyValue(u"Overwrite"_ustr, true)'
    );
    expect(patch).toContain(
      'u"FilterName"_ustr, aRequest.maOutputFilter'
    );
  });

  it('falls back from close to dispose and marks cleanup uncertain', () => {
    expect(patch).toMatch(
      /xCloseable->close\(true\);[\s\S]*?catch \(\.\.\.\)[\s\S]*?xComponent->dispose\(\);[\s\S]*?return "uncertain";/
    );
    expect(patch).toContain(
      'Document cleanup is uncertain; runtime must be terminated'
    );
  });

  it('contains an outer exception barrier and matching native allocator', () => {
    expect(patch).toMatch(
      /int lok_convertDocument\([\s\S]*?try[\s\S]*?nativeConvertDocumentImpl\([\s\S]*?catch \(\.\.\.\)[\s\S]*?nativeConversionWriteBoundaryFailure/
    );
    expect(patch).toMatch(
      /void lok_convertFree\(char\* pAllocation\) noexcept[\s\S]*?free\(pAllocation\);/
    );
    expect(patch).toContain(
      'char* pAllocation = static_cast<char*>(malloc(aEncoded.getLength() + 1))'
    );
  });

  it('strictly validates request JSON before adapting filter data', () => {
    expect(patch).toContain('class NativeConversionJSONParser');
    expect(patch).toContain('Unknown request field');
    expect(patch).toContain('Duplicate request field');
    expect(patch).toMatch(
      /case FIELD_SCHEMA_VERSION:[\s\S]*?parseNumber\(aNumber\)[\s\S]*?aNumber != "1"/
    );
    expect(patch).not.toContain('aSchemaVersion->data()');

    expect(patch).toMatch(
      /if \(aName == "type"\)[\s\S]*?parseString\(rType\)/
    );
    expect(patch).toMatch(
      /else if \(aName == "value"\)[\s\S]*?parseString\(rValue\)/
    );
    for (const diagnostic of [
      'Duplicate filterData entry',
      'Duplicate filterData type field',
      'Duplicate filterData value field',
      'Unknown filterData entry field',
    ]) {
      expect(patch).toContain(diagnostic);
    }
    expect(patch).toMatch(
      /Property tree is[\s\S]{0,100}?used only to adapt those validated scalars to PropertyValue\./
    );
  });

  it('derives visible-frame evidence from the non-hidden ConnectSfxFrame branch', () => {
    expect(patch).toMatch(
      /ConnectSfxFrame_Impl[\s\S]*?if \( !rFrame\.IsMarkedHidden_Impl\(\) \)[\s\S]*?gWasmVisibleFrameSetupEntered\.store\(true, std::memory_order_relaxed\);/
    );
    expect(patch).toContain(
      'SfxBaseController::WasWasmVisibleFrameSetupEntered()'
    );
    expect(patch).toMatch(
      /nativeConversionHiddenLoadConfirmed\([\s\S]*?xModel->getArgs\(\)[\s\S]*?u"Hidden"_ustr/
    );
  });

  it('applies exactly exports, shims, then bridge without later trim atoms', () => {
    const atomNames = [...buildScript.matchAll(
      /apply_conversion_atom\s+\\\s*\r?\n\s*"([^"]+)"/g
    )].map((match) => match[1]);

    expect(atomNames).toEqual([
      'wasm-trim-lok-exports-conversion-only.patch',
      'wasm-trim-lok-shims-conversion-only.patch',
      'wasm-native-conversion-bridge.patch',
    ]);
  });
});
