# DD_REPORT — Ultimate Motors Free Vehicle Discovery Gateway

报告日期：2026-10-08（America/New_York）。库存最后成功观察时间：`2026-10-08T22:54:34.975Z`（UTC）。本报告区分本地功能、原站可读取性、环境配置保存和外部平台实际分发。

## Confirmed

**现有库存可以转换成标准、机器可读、可追踪、可咨询的独立数据层。** 本地生产应用已运行；公开搜索系统的真实展现尚未证明。

| 验证项 | 实际结果 | 证据 |
| --- | --- | --- |
| 原站库存导入 | 原站公开 scoped search 返回 21 / 21 台 visible、Instock、未删除车辆；全量导入，无虚构车辆 | `data/inventory.snapshot.json`、`reports/source-inventory.md` |
| 数据交叉核对 | 每台原站 VDP 的 Car JSON-LD 核对 CAD 价格、KM 和 VIN；不一致则拒绝整轮更新 | `lib/sync.ts`、成功 sync 日志 |
| 本地 SQLite | 21 台车辆、同步记录、匿名咨询和匿名来源记录实际保存 | 当前 `data/inventory.sqlite` |
| Unit tests | 34 passed、0 failed、0 skipped；解析、price/mileage/stock/VIN、搜索、Feed、Schema、sitemap、inquiry、missing、鉴权、限流与请求边界 | `reports/unit-tests.txt` |
| 构建和 TypeScript | frozen-lockfile 安装、type check 和 production build 成功 | `package-lock.json`、`reports/build.txt` |
| 验收 A–F | 六项全部通过，另含 robots/sitemap 检查；HTTP 初始响应已有真实核心信息 | `reports/acceptance.json`、`reports/acceptance-output.txt` |
| HTTP integration | 10 / 10 passed；crawler、数据库咨询、来源保持、Feed、搜索、admin、跨域拒绝、登录限流 | `reports/integration.json` |
| 真实匿名 inquiry | 对实际库存提交 “Has this vehicle been in an accident?”，成功保存 vehicle、source、question、timestamp；没有编造事故答案 | 验收 F、inquiry 表 |
| 管理同步按钮 | 登录后 POST admin sync，HTTP 303，success，21 台真实库存；数据库保留且重新核验 | `reports/admin-sync.json` |
| 原站 crawler 请求 | 对一台当前真实 VDP 分别模拟 Googlebot、Bingbot、OAI-SearchBot；均 HTTP 200，含 Car JSON-LD / VIN / CAD price | `reports/source-crawler.json` |
| 快照恢复 | 新建另一 SQLite 数据库，恢复 21 台真实车辆，原来的 last_seen / updated 时间不被改写 | 已执行 init + SQLite 断言 |
| 环境重启 | 源码、数据库、依赖、构建仍保留；实时进程未保留，已按 npm start 重新启动 | 当前实例实际验证 |
| 可复用配置 | 已保存 install_script、start_skill 和必要网络域名草稿 | 环境 draft 保存结果；requires_publish=true |

本站有首页、完整 SSR 库存、独立 stock URL、规格/图片/公开 CARFAX/source link、JSON / CSV / read-only API、动态 sitemap、明确 crawler robots、匿名咨询、UTM/source 记录及密码保护管理页。事故结论保留 Unknown / Not provided；CARFAX 链接不等于已经读过报告或证明没有事故。

本地初始响应抽样：首页 147 ms、库存 38 ms、单车 27 ms、JSON Feed 16 ms。这是本地 HTTP 测量，**不是移动网络、图片加载或所有地区两秒性能保证**。没有宣称做过真实手机设备或外部 Rich Results 验证。

## Failed

1. 最初 curl 请求原站和默认隔离网络请求外部 search / mapper 时，出口代理返回 CONNECT 403。该响应没有到达原站，不能解释成原站禁止 crawler。保存域名配置、使用平台代理和经批准的读取权限后取得实际数据；环境重启后普通本地 app 的 admin sync 也成功。未设置直连绕过、关闭 TLS 或扩大 public scoped key 权限。
2. 最初沿完整 sitemap 逐台读取的路径效率低，遇到历史车辆 404；该轮主动取消，记录 cancelled，随后换成网站自然公开的结构化库存 endpoint。没有继续把失效历史页面当作在售库存。
3. 第一轮端到端 POST 同源判断把 Next 监听地址 `0.0.0.0` 当成访问 Host，导致合法 inquiry / admin 请求 403；tracking 也曾因 URL origin 判断而 400。已修正为实际 Host / origin 检查，并通过回归与十项集成测试。
4. CLI 官方环境加载包的 CommonJS/ESM named import 曾失败，已采用支持的 default import，初始化、快照恢复和应用重启均已验证。

最终必需检查没有未解释的失败。源站读取与测试曾失败，以上保留诊断；没有用跳过断言、样例库存或零测试来取得通过。

## Uncertain

- 没有公开部署本 gateway、注册域名、提交 Search Console / Bing Webmaster Tools 或观察实际索引。当前默认 canonical / sitemap base 是本地地址；公开上线必须设置真实 HTTPS PUBLIC_BASE_URL。
- 没有确认 Google、Bing、ChatGPT Search、Copilot 或其他 AI 会展现任何车辆；没有真实 lead、广告 ROI 或免费转化率数据。测试咨询和访问记录不是客户流量。
- ChatGPT Search 是否选择本站，以及展示频率，不能由 robots / Schema / Feed 单独证明。不能把“技术可读”改写成“已进入候选池并被推荐”。
- 原站 public search key、collection、字段和 URLs 可能改变；严格验证会停止同步并保留最后有效库存。一个时点的 21 台全量成功不等于永久稳定的数据 SLA。
- 原站是库存事实来源；没有独立验证事故、车辆条件、finance approval、最终费用、销售状态或卖方描述。所有价格以原站当时公开值为准。
- UI 的 responsive CSS 和初始 HTML 已实现；未声称完整浏览器矩阵/实际慢速手机测试。限流是单进程内存实现，生产多实例需要共享服务或 reverse proxy。
- 配置草稿保存并非环境发布；文件在当前实例重启后保留，不代表已证明未来独立任务能恢复已发布快照。

## Current Free Distribution Paths

1. 原站当前 VDP 已有公开 Car JSON-LD，robots 的通配规则不阻止 Googlebot / Bingbot / OAI-SearchBot，本次三个模拟请求均成功。这是现在已经存在的免费 Web discovery 基础。
2. 独立 gateway 的 SSR `/inventory` 与 `/v/[stock]`、动态 sitemap、公开 robots 和 Schema，可在实际 HTTPS 部署之后供免费自然搜索 crawler 读取。
3. 免费 Google Search Console / Bing Webmaster Tools 的 sitemap 提交和诊断是上线后的合理路径，需要实际域名所有权；本任务未提交。
4. 公开 JSON / CSV / API 可以让能够读取公开 Web 的系统、合作方和后续 adapters 使用，无需付费 AI 调用；不存在“生成 Feed 就自动被所有平台接收”的机制。
5. 车辆链接加 source / UTM 可用于人工分享和追踪，咨询无需账户或 API key。未实际对外分享或发送消息。

代码层没有广告或 paid API 依赖。部署机器/域名可能有运营成本；没有假称整个外部托管永久免费。

## Paid / Approval-required Paths

- Google Vehicle Ads 是后续付费广告渠道，Merchant / account / policy 要求需要单独确认。
- OpenAI product feed、商家直连接入或其他 deeper integrations 可能需要 partner approval；本次没有批准证明、账号接入或 product feed upload。
- Meta / Facebook Marketplace、AutoTrader、平台商家 feed 和其他 channels 的发布权限、费用、政策均需分别确认，不能当作已接入。
- OpenAI API 不参与当前运行；未来 AI answering 会有 credential、调用成本和事实边界约束。
- CRM / email / SMS 通知只预留 adapter 方向；当前 inquiry 仅保存，不代表 dealer 收到消息或承诺客户回复。

## Crawlability Findings

- 原站 WordPress / ZopDealer 页面公开 robots 与 sitemap；robots 禁止若干特定第三方 bots，例如 AhrefsBot / SemrushBot，而 `User-agent: *` 的 Disallow 为空。不能把针对其他 bots 的规则推广成禁止 Google / Bing / OpenAI Search。
- `/inventory/` 初始 HTML 主要是搜索/结果模板，`#inventory_table` 为空；公开 `globalZDProperties()` 提供 scoped Typesense 浏览器搜索配置。列表核心展示依赖 JavaScript。
- 当前 VDP 的初始响应已有 Car JSON-LD，包含 brand/model/year/VIN、mileage KMT、Offer CAD/InStock、transmission、images。**原站并非完全不能被 crawler 读取。**
- 公开车辆 sitemap 发现 129 个车辆 URL，包含历史条目；部分详情已 404。URL 被 sitemap 列出不足以确认当前在售。
- 当前公开 search 接口返回 21 台；原样使用其可见/未删除/Instock scope，完整分页并逐台核对 VDP。没有猜测隐藏库存，没有登录或反机器人绕过。
- Gateway 的增量价值是 server-rendered 可搜索列表、稳定格式 Feed/API、统一观察时间、匿名询问和来源记录；不是声称“修复了原站完全缺失的 Schema”。

原始 robots / sitemap 证据在 `reports/source-robots.txt`、`reports/source-sitemap.xml`、`reports/source-vehicle-sitemap.xml`。原站 HTML 诊断缓存已移除，避免把公开 search key/nonce 复制到最终交付；最终快照只有所需公开车辆字段。

## Recommendation

**值得继续一个范围有限的公开验证阶段。** 本版已证明可把现有真实库存转换为机器可读、可追踪、可咨询的本地独立层。部署到公开 HTTPS 域名并保持当前数据后，具备供这些系统抓取/理解的基础技术条件；平台是否收录或推荐仍未证明。

最大的工程风险是原站数据接口变化、全量一致性及持续同步；最大的业务风险是公开可读并不自动产生搜索展现和 leads。原站已经有单车 Schema，因此预期改善应集中在 SSR inventory、Feed 稳定性、更新时间和咨询路径，不能承诺巨大 SEO 增益。

优先下一步：真实域名/HTTPS + 持久 SQLite（规模扩大再迁移 PostgreSQL）；每天调度同步并监控失败/陈旧；提交 sitemap；观察实际 crawl/index、来源与咨询数据；再决定是否投入 CRM 或 approval-required adapters。先保持低成本、测量真实展现和转化，不先加付费 AI。

**免费 discovery 在技术上现实，在获客效果上尚无证据。** 现有测试既没有证明它强，也没有证明它弱；缺少公网曝光与外部平台数据时，不能为了判断项目值得做而编造结论。
