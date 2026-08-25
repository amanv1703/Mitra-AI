/**
 * MITRA AI — Master AI Business Operator Agent
 */

const OpenAiProvider = require('../provider/openaiProvider');
const OfflineProvider = require('../provider/offlineProvider');
const agentLoop = require('./agentLoop');
const evidenceCollector = require('../reasoning/evidenceCollector');
const approvalManager = require('../actions/approvalManager');
const { AI } = require('../../config/env');

class MitraAgent {
  constructor() {
    this.openaiProvider = new OpenAiProvider();
    this.offlineProvider = new OfflineProvider();
    this.conversations = new Map();
  }

  getProvider() {
    if (this.openaiProvider.isConfigured()) {
      return this.openaiProvider;
    }
    return this.offlineProvider;
  }

  async processMessage({ conversationId = `conv_${Date.now()}`, message, context = {} }) {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('Message must be a non-empty string');
    }

    const provider = this.getProvider();
    const history = this.conversations.get(conversationId) || [];

    // Execute multi-step loop
    const result = await agentLoop.run({
      provider,
      conversationHistory: history,
      userMessage: message,
      context
    });

    // Extract structured evidence cards
    const evidenceCards = evidenceCollector.extractEvidenceCards(result.toolCalls);

    // Retrieve active proposals related to current context
    const actionProposals = approvalManager.getAllProposals().filter(p => p.status === 'PENDING').slice(0, 2);

    const messagePayload = {
      messageId: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      conversationId,
      answer: result.answer,
      evidenceCards,
      actionProposals,
      executionTrace: result.executionTrace,
      toolCallsCount: result.toolCalls.length,
      usage: result.usage,
      provider: provider.name || 'openai-gpt4o',
      timestamp: new Date().toISOString()
    };

    // Update conversation context (short-term window of last 10 messages)
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: result.answer });
    if (history.length > 10) {
      this.conversations.set(conversationId, history.slice(-10));
    } else {
      this.conversations.set(conversationId, history);
    }

    return messagePayload;
  }

  getConversationHistory(conversationId) {
    return this.conversations.get(conversationId) || [];
  }
}

module.exports = new MitraAgent();
