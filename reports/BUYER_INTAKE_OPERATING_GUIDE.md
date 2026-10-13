# 买家意向接入与验证工作台

这是接入与接待产品，不是免费买家数据库；功能验证与获客效果分开。

## 已实现的两条入口

1. `/interest`：买家主动提交城市、总预算、用途、意向、购买期限、联系偏好和本次联系同意。可不选择本站车辆。提交保存为new，不是预约、融资申请、卖家确认或qualified。预算工具和普通问题仍可不提供联系方式。
2. `/admin/intake`：管理员登录后生成带来源/媒介/活动标签的入口；将本人有权使用的平台导出或自有询盘，整理成CSV模板后预览、授权导入。没有原生Meta/AutoTrader API或账号连接，不得标注“平台已接通”。

## CSV字段

`external_id,source,consent,consent_recorded_at,evidence_url,contact_method,contact_value,city,budget_cad,timeframe,question`

- 每批1–25条；复制到私密后台，不发到聊天或公开仓库。
- source支持facebook/google/autotrader/cargurus/kijiji/51/yorkbbs/partner/offline/website。
- consent必须为字符串`true`，并提供原始联系许可时间（ISO8601带时区）以及来源/同意记录的HTTPS URL。URL不允许用户名/密码，不超过600字符。记录无许可就不导入；不能用临时填写的“true”替代真实同意。
- 联系方式Email或Phone；城市、预算、timeframe可留空，但question必须说明实际请求。
- timeframe支持within_30_days/within_90_days/later/researching。
- evidence_url是管理员提供的记录，不自动访问，也不是平台签名或独立核验证据。运营者必须确认许可的范围与有效性，产品不会重新取得许可。
- CSV重复按source+external_id识别；同一人跨平台或多个原始询盘可能仍有多条记录，报表明确不是独立买家人数。
- 可先勾选Controlled TEST，用合成记录验证接入；测试记录排除统计且不能标为qualified。测试与真实导入使用不同稳定ID，不会把同编号真实记录误当测试覆盖。
- 整批格式/同意字段先验证，再入库；数据库中途失败可能已有部分写入，同source+external_id重试会跳过已入库记录。不要把部分失败当整批成功。

## 跟进

先确认来源/联系许可和用户实际需求，再由运营者人工联系。不得把点选contacted当作系统已发消息。只有确认真实购车需求且同意联系、非测试，才标qualified。进口记录默认new，有预算/时间也不自动qualified。

没有自动短信/邮件、销售代理、贷款办理、车行转交或预约系统。不得宣称任何这些能力已接通。若真实渠道提供原生导出不同字段，需要先映射到模板，而非直接假定兼容。

## 下一次业务实验

选一个符合我们经营身份与权限的真实渠道，使用其实际发布/导出记录核对来源。看收到的真实询盘、可联系数、人工确认需求、接待结果，不看“页面数量”或GitHub stars。成本必须是实际费用；零有效需求时不计算出虚假的$0获客成本。

独立信息站无法默认以别人的车商身份申请库存平台、车辆广告或地图商家资料。官网只作读取资料的途径，原官网与客户后台不修改不读取。
