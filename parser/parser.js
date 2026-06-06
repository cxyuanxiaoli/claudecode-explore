const { parseClaudeResponseFromFile } = require('./claudeParser');

const result = parseClaudeResponseFromFile('../3_response_4.txt');

console.log('可见文本:\n', result.text);
console.log('思考内容:\n', result.thinking);
console.log('工具调用:\n', result.toolCalls);
console.log('停止原因:\n', result.stopReason);
console.log('用量:', result.usage);
