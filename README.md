# Claude Code 通信机制逆向分析

使用 Proxyman 抓包工具对 Claude Code 的 API 通信进行完整逆向分析，浅谈 AI Agent 的工作机制。

## 📋 项目简介

本项目通过对 Claude Code 与 API 之间的 HTTPS 请求/响应进行抓包，完整还原了其通信协议、工具调用机制、缓存策略和内部子代理设计。

## 📂 文档索引

| 文档 | 说明 |
|------|------|
| [背景介绍](<./doc/Claude Code 通信机制逆向分析.md>) | 分析背景、Proxyman 抓包方法、测试场景设计 |
| [Claude Code 请求结构解析](<./doc/Claude Code API 请求结构解析.md>) | 请求体各字段详解（model/messages/system/tools/metadata） |
| [Claude Code 工具列表分析](<./doc/Claude Code 工具列表.md>) | 27 个原生工具的归类与参数说明 |
| [创建文件任务分析](<./doc/Claude Code 创建文件任务分析.md>) | 3 轮请求/响应逐步拆解 + Token 消耗 |
| [天气查询任务分析](<./doc/Claude Code 天气查询任务分析.md>) | 4 轮请求/响应拆解 + 内部搜索代理机制 |
| [AI Agent 运行机制浅谈](<./doc/AI Agent 运行机制浅谈.md>) | 用通俗语言解释 Agent 的「思考→行动→观察」循环 |

## 说明

- 基于 Claude Code `v2.1.167` 版本，后续版本可能有差异
- 实际后端为 DeepSeek 代理，非 Anthropic 官方 API
- 仅供学习使用。
