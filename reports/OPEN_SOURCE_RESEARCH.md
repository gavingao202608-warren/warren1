# GitHub 开源复用调研 — 2026-10-09

范围：独立站获客所需的搜索、询盘校验、CRM、归因、通知和搜索发现。已查询公开 GitHub 仓库、维护状态、许可证和所用模块源码；不是对所有 GitHub 仓库的穷尽调查。

| 项目 | 核实的许可 | 当前决定及原因 |
|---|---|---|
| krisk/Fuse | Apache-2.0 | 已接入。拼写错误能找到相似车型，预算/年份/里程/驱动要求不因模糊匹配放宽。 |
| colinhacks/zod | MIT | 已接入。统一询盘字段、联系格式和明确同意校验，拒绝伪造测试标记。 |
| TanStack/table | MIT（安装包核对） | 已接入 React v8。后台可搜索排序、逐行跟进和删除，不必手动复制咨询 ID。 |
| bojieyang/indexnow-action | MIT | 阅读请求构造及处理源码，保留许可并改编请求构造。现有主机执行 IndexNow，核实公网 key 后只提交独立站 URL；不把源码车商 URL 作为我们的 URL。 |
| umami-software/umami | MIT | 已核实，暂不增加独立服务。现有 PostgreSQL 已保存来源/询盘，额外部署会增加免费主机和数据库负担；有流量后可再采用。 |
| krayin/laravel-crm | MIT | 已核实，是 Laravel 独立 CRM，需要另一套 PHP/服务部署；初期用嵌入式线索管理，不额外部署。 |
| twentyhq/twenty | AGPLv3 为主，部分 MIT/企业商业许可 | 已阅读 LICENSE。暂不引入大型 CRM 和企业许可代码；未来通过已许可的 API 连接，而非复制整个项目。 |
| novuhq/novu | 仓库分列 LICENSE-MIT、LICENSE-ENTERPRISE、EE-PACKAGES-LICENSE | 不能把整个仓库当作统一 MIT。暂不部署通知平台，也不在没有运营者接收配置时发送客户数据。 |
| web-push-libs/web-push | GitHub 元数据未识别统一 SPDX | 候选通知库，尚未完成许可与设备接收配置核实，不声称已接入。 |
| luckyshot/CRMx | MIT | 查询到，最后更新 2022；相较当前功能收益有限，暂不采用。 |
| mxmzb/indexnow-indexing-script | GPL-2.0 | 查询到；本期选择许可明确且已核实源码的 MIT 请求构造。 |
| jdevalk/seo-graph | MIT | 查询到；当前站点已有真实车辆 JSON-LD，不重复引入图构造系统。 |

不新增付费服务。客户数据仍归独立站的 PostgreSQL，原官网只读。使用开源不等于已有真实客户；自动提交只证明搜索引擎接收 URL，不代表收录、展示或推荐。

GitHub secrets API 写入因绑定权限返回 403。没有要求用户再配置 secret；改用站点本来就公开的 IndexNow 验证文件和现有运行服务提交。不会使用或绕过任何受限账号凭据。
