

# Claude Code 工具列表

> 共 27 个原生工具，按功能分为 7 大类。  
> 所有工具遵循 JSON Schema 2020-12 规范。

---

## 总览

| 类别           | 数量 | 工具                                                         |
| -------------- | :--: | ------------------------------------------------------------ |
| 文件操作       |  3   | `Read` `Write` `Edit`                                        |
| 搜索与信息获取 |  4   | `Glob` `Grep` `WebFetch` `WebSearch`                         |
| 命令与任务管理 |  9   | `Bash` `TaskCreate` `TaskGet` `TaskList` `TaskUpdate` `TaskOutput` `TaskStop` `CronCreate` `CronDelete` `CronList` |
| 规划与模式控制 |  4   | `EnterPlanMode` `ExitPlanMode` `EnterWorktree` `ExitWorktree` |
| 子代理与编排   |  3   | `Agent` `Workflow` `Skill`                                   |
| 用户交互       |  1   | `AskUserQuestion`                                            |
| 其他           |  3   | `ScheduleWakeup` `NotebookEdit`                              |

---

## 一、文件操作

| 工具      | 功能                              | 关键参数                                               | 约束                                  |
| --------- | --------------------------------- | ------------------------------------------------------ | ------------------------------------- |
| **Read**  | 读取文件（文本/PDF/图片/Jupyter） | `file_path`(必填), `offset`, `limit`, `pages`          | 默认 2000 行；目录/不存在文件返回错误 |
| **Write** | 创建或覆盖文件                    | `file_path`(必填), `content`(必填)                     | 覆盖已有文件必须先 Read               |
| **Edit**  | 精确字符串替换                    | `file_path`, `old_string`, `new_string`, `replace_all` | 必须先 Read；old_string 需唯一匹配    |

---

## 二、搜索与信息获取

| 工具          | 功能                    | 关键参数                                                     | 约束                                         |
| ------------- | ----------------------- | ------------------------------------------------------------ | -------------------------------------------- |
| **Glob**      | 文件名模式匹配          | `pattern`(必填), `path`                                      | 支持 `**/*.js`；按修改时间排序               |
| **Grep**      | 基于 ripgrep 的内容搜索 | `pattern`(必填), `path`, `glob`, `output_mode`, `-A/B/C`, `multiline` | 完整正则语法；默认 `files_with_matches` 模式 |
| **WebFetch**  | 获取网页并分析          | `url`(必填), `prompt`(必填)                                  | HTTP→HTTPS；缓存 15 分钟                     |
| **WebSearch** | 网络搜索                | `query`(必填), `allowed_domains`, `blocked_domains`          | 返回标题+URL；仅美国                         |

---

## 三、命令与任务管理

### 3.1 命令执行

| 工具     | 功能           | 关键参数                                                     |
| -------- | -------------- | ------------------------------------------------------------ |
| **Bash** | 执行 bash 命令 | `command`(必填), `description`, `timeout`(默认120s), `run_in_background`, `dangerouslyDisableSandbox` |

> 避免用 Bash 执行 `find`/`grep`/`cat` 等——优先使用专用工具。

### 3.2 任务管理

| 工具           | 功能              | 状态流转                                        |
| -------------- | ----------------- | ----------------------------------------------- |
| **TaskCreate** | 创建任务项        | `subject`, `description`, `activeForm`          |
| **TaskGet**    | 获取任务详情      | `taskId`                                        |
| **TaskList**   | 列出所有任务      | 无参数                                          |
| **TaskUpdate** | 更新任务状态/依赖 | `taskId`, `status`, `addBlocks`, `addBlockedBy` |
| **TaskOutput** | ⚠️ 已弃用          | 改用 Read 工具                                  |
| **TaskStop**   | 停止后台任务      | `task_id`                                       |

状态：`pending` → `in_progress` → `completed`（或 `deleted`）

### 3.3 定时任务

| 工具           | 功能             | 关键参数                                        |
| -------------- | ---------------- | ----------------------------------------------- |
| **CronCreate** | 创建定时任务     | `cron`(5字段), `prompt`, `recurring`, `durable` |
| **CronDelete** | 删除定时任务     | `id`                                            |
| **CronList**   | 列出所有定时任务 | 无参数                                          |

---

## 四、规划与模式控制

| 工具              | 功能                       | 触发条件                             |
| ----------------- | -------------------------- | ------------------------------------ |
| **EnterPlanMode** | 进入规划模式               | 新功能、多方案、架构决策、多文件修改 |
| **ExitPlanMode**  | 退出并提交审批             | 方案完成，需用户批准                 |
| **EnterWorktree** | 创建 git worktree 隔离环境 | 用户明确要求 worktree                |
| **ExitWorktree**  | 退出 worktree              | `action`: `keep` 或 `remove`         |

---

## 五、子代理与编排

### 5.1 Agent

| 参数                | 说明                                                         |
| ------------------- | ------------------------------------------------------------ |
| `description`       | 3-5 词任务简述（必填）                                       |
| `prompt`            | 任务详情（必填）                                             |
| `subagent_type`     | `claude` / `Explore` / `Plan` / `general-purpose` / `claude-code-guide` |
| `model`             | 模型覆盖：`sonnet` / `opus` / `haiku`                        |
| `run_in_background` | 后台异步运行                                                 |
| `isolation`         | `worktree` 隔离模式                                          |

### 5.2 Workflow

- 执行多代理编排脚本
- 支持 `pipeline()`（默认）和 `parallel()`（屏障）模式
- 脚本为纯 JavaScript，最大 512KB
- 仅用户明确要求时使用（或 `ultracode` 模式）

### 5.3 Skill

- 调用预定义技能/斜杠命令
- 如 `/review`、`/init`、`/code-review` 等

---

## 六、用户交互

| 工具                | 功能                 | 关键参数                                                     |
| ------------------- | -------------------- | ------------------------------------------------------------ |
| **AskUserQuestion** | 向用户提问（1-4 题） | `questions[]`: `question`, `header`, `options[2-4]`, `multiSelect` |

支持预览功能（仅单选）和用户自定义输入（"其他"选项）。

---

## 七、其他

| 工具               | 功能                                                  |
| ------------------ | ----------------------------------------------------- |
| **ScheduleWakeup** | `/loop` 动态模式定时唤醒（60-3600s）                  |
| **NotebookEdit**   | 编辑 Jupyter Notebook 单元格（replace/insert/delete） |

---

## 工具决策流程

```text
用户输入
│
├─ 匹配到 Skill? ─── 是 → Skill()
├─ 需要设计方案? ─── 是 → EnterPlanMode → ExitPlanMode
├─ 执行命令? ─── 是 → Bash()
├─ 文件操作? → Read() / Write() / Edit()
├─ 搜索? → Glob() / Grep() / WebSearch() / WebFetch()
├─ 需要用户决策? → AskUserQuestion()
├─ 复杂多步骤? → TaskCreate() → TaskUpdate()
├─ 多代理? → Agent() / Workflow()
└─ 定时任务? → CronCreate()
```

