/**
 * MITRA AI — Controlled Multi-Step Agent Loop
 * 
 * Bounded by MAX_AGENT_STEPS = 8 to prevent recursion or infinite loops
 */

const toolRegistry = require('../tools/toolRegistry');
const { SYSTEM_PROMPT } = require('./systemPrompt');

const MAX_AGENT_STEPS = 8;

class AgentLoop {
  /**
   * Executes the multi-step reasoning loop with tool execution
   * @param {Object} params
   * @param {Object} params.provider Concrete ModelProvider instance
   * @param {Array} params.conversationHistory Prior messages array
   * @param {string} params.userMessage Current incoming user prompt
   * @param {Object} params.context Authenticated tenant/merchant context
   */
  async run({ provider, conversationHistory = [], userMessage, context = {} }) {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    const tools = toolRegistry.getAllDefinitions();
    const executedToolCalls = [];
    const executionTrace = [];
    let stepCount = 0;
    let finalAnswer = '';
    let totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    while (stepCount < MAX_AGENT_STEPS) {
      stepCount++;

      const response = await provider.generateResponse({
        messages,
        tools
      });

      if (response.usage) {
        totalUsage.promptTokens += response.usage.promptTokens || 0;
        totalUsage.completionTokens += response.usage.completionTokens || 0;
        totalUsage.totalTokens += response.usage.totalTokens || 0;
      }

      // If the model called tools, execute them and continue the loop
      if (response.toolCalls && response.toolCalls.length > 0) {
        // Append assistant message with tool calls
        messages.push({
          role: 'assistant',
          content: response.content || null,
          tool_calls: response.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments)
            }
          }))
        });

        for (const call of response.toolCalls) {
          const startTime = Date.now();
          const executionResult = await toolRegistry.executeTool(call.name, call.arguments, context);
          const durationMs = Date.now() - startTime;

          executedToolCalls.push({
            id: call.id,
            name: call.name,
            arguments: call.arguments,
            result: executionResult.data || null,
            error: executionResult.error || null,
            durationMs
          });

          executionTrace.push({
            tool: call.name,
            status: executionResult.success ? 'SUCCESS' : 'FAILED',
            description: `Executed ${call.name} in ${durationMs}ms`
          });

          // Append tool result message
          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            name: call.name,
            content: JSON.stringify(executionResult.data || { error: executionResult.error })
          });
        }
      } else {
        // Model provided final answer
        finalAnswer = response.content || 'I have completed the investigation based on your business telemetry.';
        break;
      }
    }

    if (!finalAnswer && stepCount >= MAX_AGENT_STEPS) {
      finalAnswer = 'Investigation reached maximum diagnostic depth. Please review the collected telemetry evidence below.';
    }

    return {
      answer: finalAnswer,
      stepCount,
      toolCalls: executedToolCalls,
      executionTrace,
      usage: totalUsage
    };
  }
}

module.exports = new AgentLoop();
