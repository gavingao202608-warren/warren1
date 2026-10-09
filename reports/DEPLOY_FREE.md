# 独立站免费公网部署

方案：Render Free 运行站点，Neon Free 保存独立站的客户咨询和访问记录。原车商官网只作只读资料来源。

已查证：Render 免费实例的本地文件会在重启、重新部署、休眠时丢失，且不能挂持久盘；Neon 官方 Plans 页面提供 Free 方案。项目新增 PostgreSQL 客户存储，因此客户记录不会随 Render 本地 SQLite 文件消失。公开库存可从来源重新同步，启动时和每 6 小时检查一次；主机休眠期间不会执行定时同步。

## 用户必须完成的账号操作

1. 在 https://neon.com 注册/登录，创建 **Free** PostgreSQL 项目。在 Connect 页面复制连接串，只粘贴到托管平台的私密环境变量字段，不要发聊天。
2. 在 https://render.com 注册/登录并连接自己的 GitHub，授权仓库 `gavingao202608-warren/warren1`。创建 Blueprint，选择仓库中的 `render.yaml`。保持 Free，不主动升级或添加付费服务。
3. 只需填写一个私密字段：DATABASE_URL 填 Neon 连接串。站点自动使用 Render 生成的 HTTPS 地址，实验起点首次存入数据库并跨重启保留。ADMIN_PASSWORD 由 Blueprint 随机生成，在 Render 私密环境变量页查看，禁止公开。

我没有这两个账号的可用授权，因此不能替用户完成登录、注册或私密字段填写。不要用原官网账号，也不要发送密码到聊天。

## 验收

打开实际网址，检查首页独立品牌、车辆来源标注，访问 `/api/health`：status 应为 ok，customer_storage 应为 postgresql。用手机提交明确注明 TEST 的咨询，记录参考编号；登录 `/admin` 查看，再重启 Render 服务，确认记录仍在。删除测试咨询，不算客户。

源码测试覆盖本地真实 PostgreSQL 的表单、后台管理、测试排除以及服务重启后保留记录；只有实际 Neon/Render 上完成上述步骤，才能宣称云端上线通过。

## 免费服务限制

Render Free 在 15 分钟无流量后休眠，首次访问可能等待约一分钟；官方同时规定每月免费运行小时上限。Neon Free 有计算、存储和流量额度。以注册时平台显示的最新额度和费用为准，始终选择 Free。免费方案适合初步验证，不能承诺永久免费、无休眠或持续高可用。

## 获客

由独立站运营者用自己有权使用的渠道发布真实车辆信息及站点链接，不冒用车商身份。咨询只归独立站运营者处理，不会自动发送给车商。每天查看后台、跟进同意留下联系方式的访客，只有实际确认购车需求的非测试咨询才标记 qualified。

资料：
- https://render.com/docs/free
- https://neon.com/docs/introduction/plans
