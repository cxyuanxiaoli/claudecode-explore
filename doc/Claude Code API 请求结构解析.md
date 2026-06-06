# Claude Code API 请求结构解析

> 基于对 Claude Code 与 Anthropic API 通信的实际抓包分析。  
> Claude Code 版本：`2.1.167`  

---

## 一、请求体顶层结构

```json
{
  "model": "claude-opus-4-8",
  "messages": [ ... ],
  "system": [ ... ],
  "tools": [ ... ],
  "metadata": { ... },
  "max_tokens": 64000,
  "thinking": { "type": "adaptive" },
  "context_management": { ... },
  "output_config": { "effort": "high" },
  "stream": true
}
```

| 字段                 | 类型    | 说明                                                         |
| :------------------- | :------ | :----------------------------------------------------------- |
| `model`              | string  | 指定模型，支持 `claude-opus-4-8`、`claude-sonnet-4-6`、`claude-haiku-4-5` |
| `messages`           | array   | 对话历史，包含 user / assistant / system 角色                |
| `system`             | array   | 顶层系统提示词，可包含多个文本块和缓存控制                   |
| `tools`              | array   | 工具定义列表（27 个），遵循 JSON Schema 2020-12              |
| `metadata`           | object  | 用户/设备/会话标识                                           |
| `max_tokens`         | number  | 最大输出 token 数，默认 64000                                |
| `thinking`           | object  | 扩展思考配置：`adaptive`（自适应）/ `enabled` / `disabled`   |
| `context_management` | object  | 上下文编辑策略（如清除旧思考块）                             |
| `output_config`      | object  | 输出质量：`effort: high/medium/low`                          |
| `stream`             | boolean | 是否启用 SSE 流式响应                                        |

------

## 二、`messages` 结构

### 2.1 用户消息 (role: "user")

```json
{
  "role": "user",
  "content": [
    {
      "type": "text",
      "text": "<system-reminder>\n# currentDate\nToday's date is 2026/06/06.\n</system-reminder>"
    },
    {
      "type": "text",
      "text": "你好",
      "cache_control": { "type": "ephemeral" }
    }
  ]
}
```

| 块                     | 说明                                                   |
| :--------------------- | :----------------------------------------------------- |
| `<system-reminder>` 块 | Claude Code 运行时注入，包含日期、计划模式状态等上下文 |
| 实际用户输入块         | 可携带 `cache_control: ephemeral` 标记缓存断点         |

### 2.2 助手消息 (role: "assistant")

```json
{
  "role": "assistant",
  "content": [
    { "type": "text", "text": "你好！有什么我可以帮你的吗？" }
  ]
}
```

或包含工具调用：

```json
{
  "role": "assistant",
  "content": [
    {
      "type": "tool_use",
      "id": "call_00_xxx",
      "name": "Write",
      "input": { "file_path": "/path/to/file", "content": "..." }
    }
  ]
}
```

### 2.3 系统消息 (role: "system")

```json
{
  "role": "system",
  "content": "The following skills are available for use with the Skill tool:\n\n- deep-research: ...\n- code-    			review: ...\n..."
}
```

技能列表作为 `role: "system"` 消息注入，与顶层 `system` 参数不同。

### 2.4 工具结果消息 (role: "user")

```json
{
  "role": "user",
  "content": [
    {
      "tool_use_id": "call_00_xxx",
      "type": "tool_result",
      "content": "File created successfully at: ..."
    }
  ]
}
```

------

## 三、`system` 结构（顶层系统提示词）

```json
"system": [
  {
    "type": "text",
    "text": "x-anthropic-billing-header: cc_version=2.1.167.b60; cc_entrypoint=cli; cch=<hash>;"
  },
  {
    "type": "text",
    "text": "You are Claude Code, Anthropic's official CLI for Claude.",
    "cache_control": { "type": "ephemeral" }
  },
  {
    "type": "text",
    "text": "\nYou are an interactive agent that helps users with software engineering tasks...\n\n# Harness\n...\n# Memory\n...\n# Environment\n...\n# Context management\n..."
  }
]
```

| 块   | 内容                             | 作用                                   |
| :--- | :------------------------------- | :------------------------------------- |
| 块 1 | 遥测头（版本号、入口、会话哈希） | Anthropic 计费/追踪                    |
| 块 2 | 身份声明                         | 模型身份认知                           |
| 块 3 | 核心系统提示词                   | 行为规范、运行框架、记忆系统、环境信息 |

### 核心系统提示词章节

| 章节               | 内容概要                                           |
| :----------------- | :------------------------------------------------- |
| 角色定义           | 软件工程助手；安全测试授权；拒绝恶意请求           |
| Harness            | Markdown 输出、权限模式、工具优先级、并行调用      |
| 编码风格           | 匹配周边代码风格                                   |
| 操作原则           | 不可逆操作需确认、如实报告结果                     |
| 会话指导           | `!` 前缀执行本地命令、`/skill` 调用技能            |
| Memory             | 文件式持久记忆系统，支持 frontmatter 和 `[[link]]` |
| Environment        | 工作目录、平台、Shell、OS 版本、模型信息           |
| Context management | 长对话自动摘要                                     |

------

## 四、`tools` 结构

每个工具包含：

```json
{
  "name": "ToolName",
  "description": "详细的工具描述，包含使用场景和注意事项...",
  "input_schema": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": { ... },
    "required": [ ... ],
    "additionalProperties": false
  }
}
```

完整工具列表见 **Claude Code 完整工具列表**。

------

## 五、`metadata` 结构

```json
{
  "user_id": "{\"device_id\":\"<hash>\",\"account_uuid\":\"\",\"session_id\":\"<uuid>\"}"
}
```

| 字段           | 说明                      |
| :------------- | :------------------------ |
| `device_id`    | 设备指纹（SHA-256）       |
| `account_uuid` | 账户 UUID（未登录时为空） |
| `session_id`   | 会话唯一标识              |

------

## 六、其他参数

### 6.1 `thinking`

```json
{ "type": "adaptive" }
```

| 值         | 说明                       |
| :--------- | :------------------------- |
| `adaptive` | 自适应思考深度             |
| `enabled`  | 始终扩展思考               |
| `disabled` | 关闭思考（如会话标题生成） |

### 6.2 `context_management`

```json
{
  "edits": [
    { "type": "clear_thinking_20251015", "keep": "all" }
  ]
}
```

控制上下文编辑行为，`keep: "all"` 表示保留所有思考内容。

### 6.3 `output_config`

```json
{ "effort": "high" }
```

| 值       | 说明                   |
| :------- | :--------------------- |
| `high`   | 高推理深度（编程任务） |
| `medium` | 中等                   |
| `low`    | 低（如标题生成）       |

------

## 七、完整请求流程

```
用户输入
    │
    ▼
Claude Code 组装请求体
    ├── 注入 system-reminder (日期等)
    ├── 注入 技能列表 (role: system)
    ├── 注入 系统提示词 (顶层 system[])
    ├── 注入 工具定义 (27个)
    ├── 携带 对话历史 (messages)
    └── 设置 模型/思考/流式等参数
    │
    ▼
POST https://api.anthropic.com/v1/messages
    │
    ▼
返回 SSE 流式响应
    ├── thinking_delta  → 思考过程（不展示给用户）
    ├── text_delta      → 用户可见文本
    ├── tool_use        → 工具调用指令
    └── stop_reason     → end_turn / tool_use
    │
    ▼
Claude Code 解析响应
    ├── 有文本 → 渲染 Markdown 展示
    ├── 有工具调用 → 执行工具 → 将结果加入历史 → 再次请求
    └── end_turn → 等待用户下一轮输入
```

------

## 八、模型选择策略

| 场景         | 模型               | 特点                    |
| :----------- | :----------------- | :---------------------- |
| 会话标题生成 | `claude-haiku-4-5` | 最快/最便宜，关闭思考   |
| 常规编程任务 | `claude-opus-4-8`  | 最强能力，1M 上下文     |
| 内部搜索代理 | `claude-opus-4-8`  | 精简提示词，仅 1 个工具 |

------

## 九、缓存策略

- `cache_control: { type: "ephemeral" }` 标记在系统提示词和用户消息上
- 大量工具定义（约 21K tokens）可被后续请求复用
- 实际新增输入通常仅几百 tokens

------

## 十、内部子请求机制

当主模型调用 `WebSearch` 等工具时，Claude Code 发起独立的精简子请求：

| 维度       | 主请求        | 搜索子请求                                                   |
| :--------- | :------------ | :----------------------------------------------------------- |
| 系统提示词 | 完整 ~4000 字 | `"You are an assistant for performing a web search tool use"` |
| 工具       | 27 个         | 仅 `web_search`                                              |
| 消息       | 完整对话历史  | 仅搜索 prompt                                                |
| 目的       | 通用任务      | 专注搜索执行                                                 |