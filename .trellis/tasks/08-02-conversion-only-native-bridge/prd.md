# Conversion-only native bridge

## Goal

把 `libreoffice-wasm-conversion-runtime` 的 LibreOffice WASM 构建裁剪为 **conversion-only**(仅文档格式转换),产出更小的 `soffice.wasm`,并以 `test.docx → pdf` 集成测试作为第一门禁。

"native bridge" 在本仓库指 JS ↔ LibreOfficeKit 的桥接层(`src/lok-bindings.ts` 通过 `_lok_*` shim / vtable 遍历调用 WASM 里的 C 函数)。conversion-only 裁剪同时作用于两层:
- **WASM 二进制层**:通过 `build/autogen.input` 的 `--disable-*`/`--without-*` 开关 + `build/patches/wasm-build-fixes.patch`,裁掉非转换模块。
- **JS 桥接层**:`LOKBindings` 收窄到 conversion 必需的 shim 子集;`converter` 剥离渲染/编辑/交互路径。

## Background

- 本仓库 fork 自 `matbeedotcom/libreoffice-document-converter`,自带完整 LO WASM 构建系统:`build/build-wasm.sh` clone `libreoffice-24-8` + emsdk 3.1.74,打 patch,`autogen.sh` + `make`,产出 `wasm/soffice.{wasm,data,js}`。
- 现有 `autogen.input` 已是 headless 转换配置(`--disable-gui`、禁 GUI toolkit/scripting/database/nss,`--enable-pdfimport/pdfium`),但仍有可裁空间(editor 后端交互路径、a11y、UNO 编辑命令、callback 队列等)。
- 现有 `wasm/soffice.wasm` 147MB、`soffice.data` 100MB,走 Git LFS(`.gitattributes`)。
- `tests/converter.test.ts` 的集成测试是 `describe.skip`,且 CI(`ci.yml`/`publish.yml`)用 `--exclude 'tests/*converter*.test.ts'` 排除转换测试——转换链路从未在 CI 验证过。

## Constraints

- **构建方式**:LO WASM 构建通过 GitHub Actions 跑(本机无 Docker/WSL,4 核/16GB,无法本地构建)。先免费 `ubuntu-latest` runner(4 核/16GB/6h 上限),若超时再考虑 larger runner。
- **构建触发**:`workflow_dispatch` 手动触发,**不挂 push/PR**,避免每次提交烧 6h。
- **产物回推**:构建产物只存 GHA artifact 供下载验证,**不自动推 LFS、不自动 commit**。验证 OK 后人工回推。
- **门禁**:`test.docx → pdf` 集成测试。先用现有 wasm 跑通基线,再做裁剪。
- 本轮纯写代码/文件 + 设计;实际构建在 GHA 手动触发。

## Phasing

### Phase 1 — 门禁基线(本机,纯文件/代码)
- 写 `test.docx → pdf` 集成测试,用现有 `wasm/soffice.wasm` 跑通基线,验证转换链路在本机能跑。
- 若基线跑不通,先修环境(不在本轮硬限制外)。

### Phase 2 — 裁剪设计(纯文件)
- 通读 `autogen.input` 全部开关 + `wasm-build-fixes.patch` + `LOKBindings` 非转换 shim 清单。
- 产出 conversion-only 裁剪清单(哪些 `--disable-*` 更激进、哪些 shim 从 patch 去掉、JS 侧删哪些),写 `design.md`。

### Phase 3 — 构建管道(纯文件)
- 写 `build-wasm.yml` workflow(`workflow_dispatch`,带 cache/timeout/artifact/内嵌门禁测试)。
- 不触发构建。

### Phase 4 — 构建验证(GHA,手动触发)
- 先用未裁剪 `autogen.input` 跑一次基线构建,验证管道本身能跑通、门禁测试在 GHA 上能过。
- 再改 `autogen.input`/patch 为 conversion-only,触发裁剪构建,门禁验证裁剪后转换链路完好。
- 产物存 artifact,人工回推 LFS。

## Acceptance Criteria

- [ ] `test.docx → pdf` 集成测试存在,且在现有 wasm 上跑通(基线)。
- [ ] `design.md` 含 conversion-only 裁剪清单(autogen.input 开关 + patch shim + JS 侧收窄)。
- [ ] `build-wasm.yml` workflow 存在,`workflow_dispatch` 触发,带 cache/timeout/artifact/门禁测试。
- [ ] 基线构建(未裁剪)在 GHA 跑通,门禁测试过。
- [ ] 裁剪构建在 GHA 跑通,门禁测试过,产物小于现有 wasm。
- [ ] (人工)裁剪产物验证 OK 后回推 LFS。

## Out of Scope

- 改 C++ 源码(裁剪只通过 autogen.input 开关 + patch)。
- 本机本地构建(无 Docker/WSL)。
- 自动回推 LFS / 自动 commit wasm 产物。
- 编辑/渲染/交互职能的保留(本任务就是要裁掉它们)。
