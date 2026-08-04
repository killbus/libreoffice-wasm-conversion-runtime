# Implement: Conversion-only native bridge

执行顺序按 PRD 的 Phase 1→4。本轮(本机)做 Phase 1–3,Phase 4 需手动触发 GHA。

## Phase 1 — 门禁基线(本机,纯文件/代码)

- [x] 1.1 新增 `tests/converter-gate.test.ts`
  - 读根目录 `test.docx` 为 Buffer。
  - 调 `convertDocument(docx, { outputFormat: 'pdf' })`。
  - 断言:`data` 非空、前 4 字节 `%PDF`、`mimeType === 'application/pdf'`、`filename` 以 `.pdf` 结尾。
  - 5 min 超时(SubprocessConverter init + 首次转换慢)。
  - **基线已验证通过**:本机 `npx vitest run tests/converter-gate.test.ts`,3 tests passed,~166s。
  - 现有 `wasm/soffice.wasm`(LFS)在本机能加载并转换;`convertDocument`→SubprocessConverter→LOK bridge 链路完好。

- [x] 1.2 CI exclude 覆盖:文件命名 `converter-gate.test.ts` 复用 `tests/*converter*.test.ts` 模式,零改 CI。已确认 `ci.yml`/`publish.yml` 的 exclude 命中。

## Phase 2 — 裁剪设计落地(纯文件,不改 src)

> **顺序调整(已确认)**:JS 侧 src 裁剪推迟到 Phase 4 裁剪 wasm 验证 OK 后再做。
> 本轮只产出不改 src 的文件,仓库 src 保持现状(基线绿)。

- [x] 2.1 产出 `build/autogen.conversion-only.input`(裁剪后 autogen 草案,独立文件,不覆盖现行 `autogen.input`)。基于 baseline 追加 `--disable-avmedia/gio/extensions/report-builder/lpsolve/coinmp/opencl/xmlhelp/lotuswordpro/community-flavor` + `--enable-lto`,每项标 `# PENDING-VERIFY`。全格式项(`--with-main-module=all`/pdfimport/pdfium)不变。
- [x] 2.2 产出 `build/patches/CONVERSION-ONLY-TRIM.md`(patch 裁剪策略文档,不直接改 4034 行 patch)。列出 KEEP/CUT/PENDING-VERIFY 的 archive 补丁,以及 Phase 4 二分裁剪流程。
- [x] 2.3 JS 侧裁剪清单已写入 `design.md` §3.2(方法级),执行推迟到 Phase 4 后。

## Phase 3 — 构建管道(纯文件)

- [x] 3.1 新增 `.github/workflows/build-wasm.yml`
  - `workflow_dispatch`,输入 `mode`(baseline | conversion-only)+ `clean_build`。
  - `runs-on: ubuntu-latest`,`timeout-minutes: 350`。
  - checkout lfs → setup-node 22 → npm ci → npm run build → configure mode(conversion-only 时 cp autogen.conversion-only.input)→ cache LO 源码+emsdk → free disk → run build-wasm.sh → ls artifacts → **跑 converter-gate 测试** → upload artifact(14d)→ report sizes。
  - 产物只存 artifact,不推 LFS,不 commit。
  - YAML 结构已验证(12 步,trigger/inputs/cache/upload/gate-test 齐全)。
- [x] 3.2 workflow 语法已验证(pyyaml 解析结构 OK;`on`→True 是 YAML 1.1 特性,GHA 解析正确)。actionlint 待 GHA 首次触发时由平台校验。

## Phase 4 — 构建验证(GHA,手动触发)

### Baseline ✅ 已完成
- [x] 4.1 触发 baseline 构建(mode=baseline, clean_build=true)
  - **Run 30832043019: success(3h33m)**,完整 H 组(EXT=.html + 无 EXPORT_ES6 + packaging aux js→cjs)
  - artifact 全部新编(wasm/data/cjs hash ≠ LFS);cjs bootstrap **1 行**
  - 本地 LOK init OK(`HOOK OK, lok=58826664`);门禁 `sample_large.docx→pdf` **3 tests passed**
  - **baseline 体积**:wasm 148,067,113 B(~141.4 MiB)、data 99,735,790 B(~95.1 MiB)、cjs/js 各 444,500 B
  - 仓库 wasm 已恢复 LFS,树干净;新编产物存 `/d/tmp/lo-artifacts-08-04/`(本地参考)

### Conversion-only 裁剪(进行中)

#### 4.1.x 回退 382ad12 并按原子边界重产 (本轮)
- [x] soft reset `382ad12` → `6280880`(baseline 绿点文档 commit)。
- [x] 删除巨型 reverse-diff `wasm-trim-conversion-only.patch`(1116 行,混 exports+shims)。
- [x] 按 archive 014/015 边界重产两个原子(从本地 LO A=`946c5d226` → B=`f33576ec3`):
  - `wasm-trim-lok-exports-conversion-only.patch` — 仅 `Executable_soffice_bin.mk`
  - `wasm-trim-lok-shims-conversion-only.patch` — 仅 `desktop/source/lib/init.cxx`
- [x] 独立验证:atom1 alone / atom2 alone / both → 分别对齐 B 的对应文件。
- [x] `build-wasm.sh` 以 `apply_conversion_atom` 顺序应用 exports→shims(`CONVERSION_ONLY=1`)。
- [x] workflow 传 `CONVERSION_ONLY`;`CONVERSION-ONLY-TRIM.md` 重写为原子策略。
- [x] workflow 加 `use_conversion_autogen`(default false):conversion-only 默认只打原子、不叠 PENDING-VERIFY autogen(4.2a 隔离)。
- [ ] commit + force-with-lease 替换 origin 上的 382ad12(需确认)。
- [ ] 触发 GHA 4.2a。

#### 4.2 隔离构建(一次一杠杆)
- [ ] 4.2a **exports+shims + baseline autogen**  
  `mode=conversion-only` + `use_conversion_autogen=false`(默认)+ `clean_build=true`。  
  验证:LOK init + gate + 体积(不期望大幅小于 baseline;shim 裁的是 ABI 不是 UI 模块)。
- [ ] 4.2b 若 4.2a 绿:同 mode + `use_conversion_autogen=true`,再引入 autogen `# PENDING-VERIFY`(LTO 可再单独)。
- [ ] 4.2c 若需更小体积:`.mk` 条件编译挡 UI 子模块(design §3.1 杠杆 ②),与 shim 原子无关。
- 回退:门禁挂→只回退上一个原子/开关。

- [ ] 4.3 裁剪 wasm 验证 OK 后,执行 JS 侧 src 裁剪(design §3.2),用门禁测试立即验证。
- [ ] 4.4 (人工)下载 artifact,复核 `test.docx → pdf` 产物可正常打开。验证 OK 后人工回推 LFS。

## 验证命令汇总
- 本机基线测试:`npx vitest run tests/converter-gate.test.ts`
- 类型检查:`npm run typecheck`
- lint:`npm run lint`(只查 src/)
- 构建 TS:`npm run build`
- workflow 语法:GitHub UI / actionlint(GHA 触发时校验)

## 回退点
- Phase 1 基线跑不通→记录,不阻塞文件编写;Phase 4 前解决。
- Phase 4 裁剪构建挂→二分回退裁剪项(design 4.3)。
- Phase 4 超时→升级 runner。
- 任一阶段发现 design 前提错→回 Phase 2 修 design,再继续。
