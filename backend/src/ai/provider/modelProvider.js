/**
 * MITRA AI — Model Provider Interface
 */

class ModelProvider {
  /**
   * Generates a model response given conversation messages and tool definitions
   * @param {Object} params
   * @param {Array} params.messages
   * @param {Array} params.tools
   * @param {Object} params.options
   * @returns {Promise<{ content: string|null, toolCalls: Array, usage: Object }>}
   */
  async generateResponse(params) {
    throw new Error('generateResponse must be implemented by concrete ModelProvider');
  }
}

module.exports = ModelProvider;
