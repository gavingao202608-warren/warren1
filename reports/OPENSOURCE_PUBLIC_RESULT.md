# 开源改进的实际公开验证

2026-10-09，独立站 https://warren-vehicle-finder.onrender.com 已发布并运行新版本。

- Fuse.js、Zod、TanStack Table 已实际接入，许可证保留；IndexNow 请求构造参考已核实的 MIT 项目并注明改编。
- 40 项单元测试、10 项生产模式集成检查通过；本机真实 PostgreSQL 的浏览器后台筛选、逐行跟进、测试排除和删除检查通过。
- 公网拼写错误查询 `mercedez under 50000` 能返回真实匹配车辆，价格筛选仍生效。
- 公网伪造 consent 字符串、错误邮箱和客户端伪造 is_test 请求均返回 400，未创建线上假线索。
- 实际公网验证文件可读取，23 个独立站页面已提交 Bing/IndexNow，HTTP 200 RECEIVED；证据见 indexnow-submission.json。再检查时内容未变，SKIPPED_UNCHANGED，未重复提交。
- 网站运行时会在成功库存同步后提交变更过的 sitemap，签名保存在独立 PostgreSQL。客户资料不会发送给搜索引擎。

尚未取得独立站管理员凭据，线上成功写入测试、重启后记录核验以及真实客户线索检查尚未完成。没有真实有效客户的确认记录；不能把平台接收 URL 或自动化测试作为获客成功。

需要的唯一后台访问条件：在当前云环境的安全 secret 设置中填写 WARREN_SITE_ADMIN_PASSWORD，值为 Render 站点自己的 ADMIN_PASSWORD，目标仅限 warren-vehicle-finder.onrender.com；不要在聊天或 GitHub 中填写秘密值。原官网凭据完全不需要。
