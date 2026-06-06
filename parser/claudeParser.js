const fs = require('fs');

/**
 * 从保存了 Claude SSE 流式响应的文本文件中，
 * 提取所有有用的信息：用户可见文本、思考内容、工具调用以及消息元数据。
 *
 * @param {string} filePath - 文件路径
 * @returns {{
 *   text: string,
 *   thinking: string,
 *   toolCalls: Array<{id:string, name:string, input:object|null}>,
 *   stopReason: string | null,
 *   usage: { input_tokens?: number, output_tokens?: number }
 * }}
 */
function parseClaudeResponseFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  let text = '';              // 普通文本块
  let thinking = '';         // 思考内容块 (Claude 3.7+)
  const toolCalls = [];      // 工具调用列表
  const blocks = {};         // index → 正在构建的块（包括 thinking, text, tool_use）

  // 消息元数据
  let stopReason = null;
  let usage = {};

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;

    const jsonStr = line.slice(6);
    let event;
    try {
      event = JSON.parse(jsonStr);
    } catch {
      continue; // 跳过无法解析的行（如 ping）
    }

    switch (event.type) {

      // ---------- 消息开始（元数据） ----------
      case 'message_start': {
        const msg = event.message;
          if (msg.usage) {
            usage.input_tokens = msg.usage.input_tokens;
            usage.output_tokens = msg.usage.output_tokens;
          }
        break;
      }

      // ---------- 消息增量（更新 stop_reason 和最终 usage） ----------
      case 'message_delta': {
        if (event.delta && event.delta.stop_reason) {
          stopReason = event.delta.stop_reason;
        }
        if (event.usage) {
          // 最终 usage 可能在这里
          usage.output_tokens = event.usage.output_tokens;
        }
        break;
      }

      // ---------- 内容块开始 ----------
      case 'content_block_start': {
        const block = event.content_block;
        blocks[event.index] = {
          type: block.type,
          id: block.id || null,
          name: block.name || null,
          partialJson: '',   // 仅用于 tool_use
          text: '',          // 用于 text / thinking 累积
        };
        break;
      }

      // ---------- 内容块增量 ----------
      case 'content_block_delta': {
        const block = blocks[event.index];
        if (!block) continue;

        const delta = event.delta;
        if (delta.type === 'text_delta') {
          block.text += delta.text;
        } else if (delta.type === 'input_json_delta') {
          block.partialJson += delta.partial_json;
        } else if (delta.type === 'thinking_delta') {
          block.text += delta.thinking;
        }
        // signature_delta 忽略（用于验证，通常不需要提取）
        break;
      }

      // ---------- 内容块结束 ----------
      case 'content_block_stop': {
        const block = blocks[event.index];
        if (!block) continue;

        if (block.type === 'text') {
          text += block.text;
        } else if (block.type === 'thinking') {
          thinking += block.text;
        } else if (block.type === 'tool_use') {
          try {
            const input = JSON.parse(block.partialJson);
            toolCalls.push({
              id: block.id,
              name: block.name,
              input,
            });
          } catch {
            // JSON 解析失败时保留原始字符串
            toolCalls.push({
              id: block.id,
              name: block.name,
              input: null,
              rawInput: block.partialJson,
            });
          }
        }
        // 其他类型（如 redacted_thinking）可在此扩展
        break;
      }

      // message_stop 等其他事件无需特殊处理
    }
  }

  return {
    text,
    thinking,
    toolCalls,
    stopReason,
    usage,
  };
}

module.exports = { parseClaudeResponseFromFile };
