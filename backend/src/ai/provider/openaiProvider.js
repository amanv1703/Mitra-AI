/**
 * MITRA AI — OpenAI Model Provider
 */

const OpenAI = require('openai');
const ModelProvider = require('./modelProvider');
const { AI } = require('../../config/env');

class OpenAiProvider extends ModelProvider {
  constructor(apiKey = AI.openaiApiKey, model = AI.openaiModel) {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateResponse({ messages = [], tools = [], options = {} }) {
    if (!this.client) {
      throw new Error('OpenAI client is not configured with a valid API key');
    }

    const formattedTools = tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }
    }));

    const payload = {
      model: this.model,
      messages,
      temperature: 0.1, // Low temperature for deterministic factual answers
      max_tokens: 1500,
      ...options
    };

    if (formattedTools.length > 0) {
      payload.tools = formattedTools;
      payload.tool_choice = 'auto';
    }

    const completion = await this.client.chat.completions.create(payload);
    const choice = completion.choices[0] || {};
    const message = choice.message || {};

    const toolCalls = (message.tool_calls || []).map(tc => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments || '{}')
    }));

    return {
      content: message.content || null,
      toolCalls,
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
        model: completion.model
      }
    };
  }
}

module.exports = OpenAiProvider;
