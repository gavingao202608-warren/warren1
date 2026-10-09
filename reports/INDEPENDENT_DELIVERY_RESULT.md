# 独立版本验证结果

- 独立品牌 Warren Vehicle Finder；官网只读，无官网修改或账号操作。
- 咨询接收人和联系同意明确为独立站运营者。原车商名称仅用于资料来源/卖家标注；JSON-LD 报价指向原始来源页面。
- 表单、认证后台、线索状态、删除、测试隔离、联系方式格式校验完成。
- 37 项单元测试通过；SQLite 与真实 PostgreSQL 两种配置的 10 项端到端检查通过，PostgreSQL 配置的 7 项验收检查通过。
- 真实 PostgreSQL 和生产站点进程重启后，全部测试咨询及统计起点仍保留，见 postgres-restart.json。
- 手机浏览器独立品牌与咨询接收人说明检查通过，见 independent-mobile.png、independent-inquiry-mobile.png、independent-browser.json。
- 免费云部署 Blueprint 和 PostgreSQL 适配完成：Render Free + 用户自己的 Neon Free。无需使用官网的主机、域名、账号或客户数据。
- 实际 Render/Neon 账号尚未授权，尚未进行实际云端部署、外部 TLS 数据库连接、云端重启验收；没有公开网址，真实获客仍未验证。

用户所需操作仅为独立平台账号登录/授权与私密 DATABASE_URL 填写，步骤见 DEPLOY_FREE.md；不要把密码、数据库 URI 或令牌发到聊天。

免费主机上的公开库存缓存可在重启时恢复并重新同步；本方案重点持久保存客户咨询、访问记录和实验起点，不声称本地库存状态历史永久保留。
