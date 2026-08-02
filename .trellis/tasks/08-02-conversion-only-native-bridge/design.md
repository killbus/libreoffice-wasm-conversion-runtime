# Design: Conversion-only native bridge

## 1. 问题定义

把 `libreoffice-wasm-conversion-runtime` 裁剪为 conversion-only:
- **WASM 二进制层**:通过 `build/autogen.input` + `build/patches/wasm-build-fixes.patch` 裁掉非转换模块/shim。
- **JS 桥接层**:`src/lok-bindings.ts`(`LOKBindings`)+ `src/converter*.ts` 收窄到 conversion。

第一门禁:`test.docx → pdf` 跑通。裁剪档位(已定):**全格式保留(`--with-main-module=all`)+ 裁 editor/渲染/交互/a11y**。不取 minimal(`--with-main-module=writer`)路线,因为它牺牲 xlsx/pptx 等格式,而全格式是 README 宣传的核心能力。

## 2. 现状分层

### 2.1 WASM 二进制构建链
- `build/build-wasm.sh`:clone `libreoffice-24-8` + emsdk 3.1.74 → 打 `wasm-build-fixes.patch` → `cp autogen.input` → `autogen.sh` → `make` → 产物到 `wasm/`。
- `build/autogen.input`(现行):`--with-main-module=all` + `--disable-gui` + 禁 GUI toolkit/scripting/database/nss + `--enable-pdfimport/pdfium`。已是 headless 全格式配置。
- `build/patches/wasm-build-fixes.patch`:4034 行,合并了 archive/ 下 001–018 系列补丁。含 LOK shim 导出与实现。
- archive 里有 `autogen.minimal.input`(`--with-main-module=writer`,前人 ultra-minimal 尝试)——**不采用**,仅作参考。

### 2.2 LOK shim 清单(来自 patch 012/013/014)

**conversion 必需 shim**(012/013 基础集,保留):
| shim | 用途 |
|---|---|
| `_libreofficekit_hook` / `_libreofficekit_hook_2` | LOK 实例初始化(`LOKBindings.initialize`) |
| `_lok_preinit` / `_lok_preinit_2` | 预初始化(可选) |
| `_lok_documentLoad` | 加载文档 |
| `_lok_documentLoadWithOptions` | 带选项加载(CSV/密码) |
| `_lok_documentSaveAs` | 另存为目标格式(**转换核心**) |
| `_lok_documentDestroy` | 销毁文档 |
| `_lok_destroy` | 销毁 LOK 实例 |
| `_lok_getError` | 取错误信息 |
| `_malloc` / `_free` | 内存分配 |

**editor/渲染/交互/a11y shim**(014 扩展集,裁掉):
| 类别 | shim | JS 侧对应方法 |
|---|---|---|
| 渲染 | `GetParts`/`GetPart`/`SetPart`/`GetDocumentType`/`GetDocumentSize`/`InitializeForRendering`/`PaintTile`/`GetTileMode` | `renderPage`/`renderPageFullQuality`/`documentGetParts` 等 |
| 文本选择 | `GetTextSelection`/`SetTextSelection`/`GetSelectionType`/`ResetSelection` | `getTextSelection`/`getAllText` 等 |
| 交互事件 | `PostMouseEvent`/`PostKeyEvent` | `postMouseEvent`/`postKeyEvent` |
| UNO 编辑 | `PostUnoCommand`/`GetCommandValues` | `postUnoCommand`/`executeUnoCommand` |
| 页面信息 | `GetPartPageRectangles`/`GetPartInfo`/`GetPartName` | `getPartPageRectangles`/`getPageNames` |
| 剪贴板 | `Paste` | `paste` |
| 视图缩放 | `SetClientZoom`/`SetClientVisibleArea` | `setClientZoom` 等 |
| 无障碍 | `GetA11yFocusedParagraph`/`GetA11yCaretPosition`/`SetAccessibilityState` | `getA11y*` |
| 表格 | `GetDataArea` | `getSpreadsheetDataArea` |
| 编辑模式 | `GetEditMode`/`SetEditMode` | `getEditMode`/`setEditMode` |
| 视图管理 | `CreateView`/`DestroyView`/`SetView`/`GetView`/`GetViewsCount` | `createView` 等 |
| 回调队列 | `RegisterCallback`/`PollCallback`/`FlushCallbacks` 等 | `pollCallback` 等 |

> 注意:`_lok_enableSyncEvents`/`_lok_disableSyncEvents`/`_lok_runLoop` 属事件循环,conversion 不需要(无交互事件),裁掉。
>
> 边界判断:`018-graphicexportfilter-fix.patch`(PNG/SVG/JPG 图像导出)——**保留**。图像导出(`exportAsImage`/`convert` 输出 png/jpg/svg)属于转换职能,非编辑,且是 README 核心功能。PDF 导出走 `writer_pdf_Export`,不依赖 018;但 png/jpg/svg 走 `GraphicExportFilter`,依赖 018。

### 2.3 JS 桥接层现状
- `LOKBindings`(`src/lok-bindings.ts`):conversion 方法 + 一大堆 editor/渲染/交互/a11y/callback 方法混在一起。`useShims` 探测 `_lok_documentLoad` 是否存在。
- `converter.ts`/`converter-node.ts`:`convert`(核心)+ `renderPage*`/`getDocumentText`/`getPageNames`/`executeUnoCommand`/`getSpreadsheetDataArea`/`getPageRectangles` 等非转换方法。`converter-node.ts` 是 Node 变体(差异在 module 加载/进程清理,转换逻辑相同)。
- `src/editor/`、`src/browser.ts`、`src/browser.worker.ts`、`src/node.worker*.ts`、`src/subprocess*`:editor/worker 路径。
- `src/index.ts`:导出 `convertDocument`/`exportAsImage`(conversion)+ 大段 Editor API。

### 2.4 测试现状
- `tests/converter.test.ts`:集成测试 `describe.skip`,CI 用 `--exclude 'tests/*converter*.test.ts'` 排除。转换链路从未在 CI 验证。
- 根目录 `test.docx`(6.6MB,合法 DOCX)——门禁输入。

## 3. 裁剪设计

### 3.1 WASM 二进制层裁剪

**`autogen.input` 改动**(在现行基础上追加,不删全格式相关项):
- 现行已禁:gui/GUI toolkit/scripting/database/nss/online-update/crashdump。
- 追加可禁(经确认不影响全格式转换):
  - `--disable-avmedia`(媒体播放,conversion 不需要)
  - `--disable-gio`(GLib IO,conversion 不需要)
  - `--disable-sdremote`/`--disable-sdremote-bluetooth`(已禁,确认)
  - `--disable-extensions`/`--disable-extension-integration`/`--disable-extension-update`(扩展,conversion 不需要——**需验证**不影响 filter 注册)
  - `--disable-report-builder`(Base 报表,conversion 不需要)
  - `--disable-lpsolve`/`--disable-coinmp`(Solver,Calc 转换不需要——**需验证**不影响 xlsx 导入)
  - `--disable-opencl`(GPU 计算,不需要)
  - `--disable-xmlhelp`(帮助系统,不需要)
  - `--disable-lotuswordpro`(Lotus Word Pro 导入过滤器,冷门,可禁)
  - `--enable-lto`(链接时优化,减小体积,但增加构建时间)
- **不动的项**:`--with-main-module=all`(全格式必需)、`--enable-pdfimport`/`--enable-pdfium`(PDF 支持)、`--enable-wasm-strip`、cairo-canvas/skia(注释明示 PDF/SVG 渲染需要)。

> 风险:部分 `--disable-*` 可能在 WASM 构建里联动失败或影响 filter。每个开关在 Phase 4 构建验证时单独确认;失败则回退该开关。

**`wasm-build-fixes.patch` 改动**:
- 裁掉 014 扩展集 shim 的 EXPORTED_FUNCTIONS 声明(014-lok-exported-functions.patch 对应段),只保留 012/013 基础集 + `_lok_destroy`。
- 裁掉 015-lok-shim-functions-extended.patch(扩展 shim 的 C++ 实现)。
- 裁掉 a11y 相关 patch(005/007/008,修 accessibility 的,conversion 不需要)。
- **保留**:001(xmlsecurity headless)、002(emscripten exports 基础)、003(skip preload)、004(remove xmlsec UI)、006(impress/draw/math fs image——**需验证**, Impress/Draw 转换可能需要其 fs 资源)、009/010-fix-writerperfect、010-emscripten-fs-image-ui-files(可能含转换必需资源,**需验证**)、014-emscripten-unipoll-fix(事件循环,若裁掉 sync events 可能可去——**需验证**)、016/017(fs image/platform)、018(graphic export)、pdfium-emscripten。

> patch 改动有连锁风险(017 fs image 可能引用 a11y 文件)。Phase 4 构建验证时增量裁剪,失败回退。

### 3.2 JS 桥接层裁剪

**`LOKBindings`**:拆分或收窄。两条路线:
- **路线 A(推荐,低风险)**:保留 `LOKBindings` 类不变,但裁掉非 conversion 方法的实现(方法体改为抛"conversion-only 不支持"或直接删除)。优点:不破坏 `converter` 对它的引用面;缺点:类仍大。
- **路线 B(激进)**:新建 `ConversionLOKBindings`(只含 conversion shim 方法),`converter` 改用它。优点:干净;缺点:要改 `converter` 引用,工作量大。

→ 采用路线 A 的变体:**保留 conversion 方法,删除 editor/渲染/交互/a11y/callback 方法**。同步删 `LOK_*` 事件/选择/callback 常量与 `getCallbackTypeName`。保留 vtable 回退偏移常量(`LOK_CLASS`/`DOC_CLASS`)中 conversion 用到的。

**`converter.ts`/`converter-node.ts`**:删除 `renderPage`/`renderPagePreviews`/`renderPageFullQuality`/`getDocumentText`/`getPageNames`/`getPageRectangles`/`getSpreadsheetDataArea`/`executeUnoCommand`/`getDocumentInfo`/`getPageCount` 中**非 conversion** 的方法。保留:`convert`、`initialize`/`initializeWithModule`/`destroy`/`reinitialize`、`getLokBindings`/`getModule`、静态格式方法。`getDocumentInfo`/`getPageCount` 边界判断:属"文档元数据"非转换,但轻量——**先保留**,标记为可选,若要极简再裁。

**`src/index.ts`**:保留 `convertDocument`/`createConverter`/`exportAsImage`/格式校验导出;删除 Editor API 整段导出(`createEditor`/`allTools`/editor 类型等)。

**`src/editor/`**:整个目录移除(或 git rm)。`src/browser*.ts`/`src/node.worker*.ts`/`src/subprocess*`:评估——`subprocess`/`worker-converter` 是 conversion 的 Node 运行时入口(`convertDocument` 在 Node 走 `createSubprocessConverter`),**保留**;`browser.worker`/editor worker 移除。

### 3.3 门禁测试

新增 `tests/conversion-gate.test.ts`:
- 输入:根目录 `test.docx`(真实文件,非合成)。
- 调 `convertDocument(docx, { outputFormat: 'pdf' })`。
- 断言:`result.data` 非空、`%PDF` 头、`application/pdf` MIME、`filename` 以 `.pdf` 结尾。
- 用现有 `wasm/soffice.wasm` 跑(基线),不依赖裁剪后产物。
- 不 `describe.skip`;但默认仍被 CI `--exclude` 排除(转换测试不在 PR CI 跑,只在 GHA 构建 workflow 里跑)。

## 4. 构建策略(GHA)

### 4.1 workflow 设计(`build-wasm.yml`)
- 触发:`workflow_dispatch`(手动),带输入 `mode`(baseline | conversion-only)选择用哪份 `autogen.input`/patch。
- runner:先 `ubuntu-latest`(免费,4核/16GB/6h)。`timeout-minutes: 350`。若超时,文档标注升级 larger runner。
- cache:`actions/cache` 缓存 `~/libreoffice-wasm-build/libreoffice`(LO 源码,含已 apply 的 patch 与增量构建产物)+ `~/libreoffice-wasm-build/emsdk`。key 含 `LIBREOFFICE_VERSION` + `EMSDK_VERSION` + patch 文件 hash。
- 步骤:checkout(lfs:true)→ setup-node → install deps → run `build/build-wasm.sh`(本地模式,BUILD_DIR 设为 runner 上路径)→ 跑门禁测试(用刚产出的 wasm)→ 上传 `wasm/soffice.*` 为 artifact。
- 产物:**只存 artifact**,不推 LFS,不 commit。

### 4.2 分阶段构建验证
1. **基线构建**(mode=baseline):用现行未裁剪 `autogen.input` + 完整 patch。验证:workflow 管道能跑通、产物产出、门禁测试在 GHA 过。这是验证"管道",不验证"裁剪"。
2. **裁剪构建**(mode=conversion-only):用裁剪后 `autogen.input` + 裁剪后 patch。验证:门禁测试过 + 产物体积 < 基线。
3. 失败定位:若裁剪构建门禁挂,回退到上一次能过的裁剪子集,增量加 `--disable-*`/裁 shim,二分定位。

### 4.3 风险与回退
| 风险 | 回退 |
|---|---|
| 4 核超 6h | 升级 larger runner(8/16 核),或拆 `make` 阶段 |
| 裁剪后 docx→pdf 挂 | 回退该 `--disable-*`/shim 裁剪项 |
| patch 连锁失败(017 引用 a11y) | 保留被引用的 a11y patch,只裁无依赖的 |
| cache 失效致全量构建 | 接受一次全量,后续命中 |
| LFS 配额 | 不自动推,人工评估 |

## 5. 不做的事
- 不改 C++ 源码(只动 autogen.input 开关 + patch 选择)。
- 不本地构建(本机无 Docker/WSL)。
- 不自动回推 LFS / 不自动 commit wasm。
- 不走 minimal(writer-only)路线。
- 不保留 editor/渲染/交互/a11y 职能(本任务目的就是裁掉)。

## 6. 待验证项(Phase 4 构建)
- 3.1 每个 `--disable-*` 是否真不影响全格式转换(filter 注册、fs 资源)。
- 3.1 patch 裁剪的连锁依赖(017 fs image 是否引用 a11y/impress-draw 文件)。
- 3.2 JS 裁剪后 `convertDocument`/`exportAsImage` 在现有 wasm 上仍跑通(基线测试覆盖)。
- `getDocumentInfo`/`getPageCount` 是否保留(先保留)。
