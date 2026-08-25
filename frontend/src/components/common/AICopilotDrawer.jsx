import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  User,
  Send,
  X,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { aiApi } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const SUGGESTED_PROMPTS = [
  'Why did my sales or gross revenue drop?',
  'What is causing the payment failure spike?',
  'Check stockout risk and supplier lead times',
  'Analyze delivery delays in Bhopal regional hub',
  'Which VIP customer cohorts are at risk of churning?'
];

export function AICopilotDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am **Mitra AI**, your autonomous AI Business Operator.\n\nI continuously monitor your telemetry across **Sales, Payments, Inventory, Logistics, Refunds, and Customers** to diagnose friction, trace root causes, and propose bounded actions with policy safeguards.\n\nHow can I assist your business operations today?`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [approvedActionIds, setApprovedActionIds] = useState(new Set());
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiApi.chat({
        message: text,
        context: { merchantId: 1, role: 'OPERATOR' }
      });

      const assistantPayload = response.data || response;

      const botMsg = {
        role: 'assistant',
        content: assistantPayload.answer || 'Investigation complete.',
        evidenceCards: assistantPayload.evidenceCards || [],
        actionProposals: assistantPayload.actionProposals || [],
        executionTrace: assistantPayload.executionTrace || [],
        provider: assistantPayload.provider || 'offline-engine',
        timestamp: assistantPayload.timestamp || new Date().toISOString()
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error during autonomous investigation: ${err.message || 'Server timeout'}. Please retry or check backend service health.`,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAction = async (proposalId) => {
    try {
      await aiApi.approveProposal(proposalId, {
        actor: 'merchant_admin@apexretail.in',
        justification: 'Approved via Mitra AI Copilot chat'
      });
      setApprovedActionIds((prev) => new Set(prev).add(proposalId));
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-surface-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl h-full flex flex-col z-50 border-l border-surface-200 animate-slideLeft">
        {/* Header */}
        <div className="h-16 px-6 border-b border-surface-200 flex items-center justify-between bg-surface-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-surface-900">Mitra AI Copilot</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Online
                </span>
              </div>
              <span className="text-[11px] text-surface-400">Autonomous Business Operator</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 space-y-3 ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-br-xs'
                    : 'bg-surface-50 border border-surface-200 text-surface-800 rounded-bl-xs'
                }`}
              >
                {/* Text Content */}
                <div className="leading-relaxed whitespace-pre-line font-medium text-xs">
                  {msg.content}
                </div>

                {/* Execution Trace Accordion */}
                {msg.executionTrace && msg.executionTrace.length > 0 && (
                  <div className="pt-2 border-t border-surface-200/80">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-surface-500 font-semibold mb-1">
                      <Layers className="w-3 h-3 text-brand-600" />
                      <span>Executed Analytical Tools ({msg.executionTrace.length})</span>
                    </div>
                    <div className="space-y-1">
                      {msg.executionTrace.map((tr, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-2 py-1 rounded bg-white border border-surface-200 text-[10px] font-mono text-surface-700"
                        >
                          <span>{tr.tool}</span>
                          <span className="text-emerald-600 font-bold">SUCCESS ✅</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Structured Evidence Cards */}
                {msg.evidenceCards && msg.evidenceCards.length > 0 && (
                  <div className="pt-2 border-t border-surface-200/80 space-y-2">
                    <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block">
                      Attached Telemetry Evidence
                    </span>
                    {msg.evidenceCards.map((card, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-white border border-surface-200 text-surface-700 text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-surface-900">{card.title}</span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-brand-50 text-brand-700">
                            {card.metric}
                          </span>
                        </div>
                        {card.details && card.details.length > 0 && (
                          <ul className="text-[10px] text-surface-500 space-y-0.5 pt-1">
                            {card.details.map((d, dIdx) => (
                              <li key={dIdx}>• {d}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Action Proposals */}
                {msg.actionProposals && msg.actionProposals.length > 0 && (
                  <div className="pt-2 border-t border-surface-200/80 space-y-2">
                    <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider block">
                      Proposed Policy Action (Requires Approval)
                    </span>
                    {msg.actionProposals.map((prop) => {
                      const isApproved = approvedActionIds.has(prop.id) || prop.status === 'EXECUTED';
                      return (
                        <div
                          key={prop.id}
                          className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-surface-900">{prop.title}</span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              PENDING GATE
                            </span>
                          </div>
                          <p className="text-[11px] text-surface-600">{prop.reason}</p>
                          <div className="pt-1 flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-rose-600">
                              Est. Impact: {formatCurrency(prop.estimatedImpactInr)}
                            </span>
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approved & Audited</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleApproveAction(prop.id)}
                                className="btn-primary text-[11px] px-3 py-1 flex items-center gap-1 shadow-xs"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Approve Action</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-surface-900 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  U
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-center text-xs text-surface-500 font-mono">
              <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <span>Mitra AI is correlating cross-domain telemetry & querying tools...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Pills */}
        <div className="p-3 bg-surface-50 border-t border-surface-200 overflow-x-auto flex gap-2 shrink-0">
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full bg-white border border-surface-200 text-surface-700 text-[10px] hover:border-brand-300 hover:bg-brand-50 whitespace-nowrap transition"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-surface-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask Mitra AI about revenue, payments, stockout risks, refunds..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              className="flex-1 text-xs px-3.5 py-2.5 rounded-lg border border-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="btn-primary px-4 py-2 text-xs flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AICopilotDrawer;
