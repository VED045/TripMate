'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Mic,
  Send,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseNLExpense } from '@/lib/ai/nlExpenseParser';
import { extractJsonObject, generateLocalJsonWithStatus, type LocalAiTier } from '@/lib/ai/localModel';
import { formatCurrency } from '@/lib/currency';
import type { Member } from '@/types';

interface NLExpenseInputProps {
  members: Member[];
  currency?: string;
  onParsed: (result: {
    description: string;
    amountPaise: number;
    paidByMemberId: string | null;
    splitType: 'equal' | 'exact' | 'custom' | 'unknown';
    participantIds: string[];
    categoryHint: string | null;
  }) => void;
  onClose: () => void;
}

const EXAMPLE_PROMPTS = [
  'Omkar paid ₹2400 for dinner, split equally between everyone',
  'Raj spent 1800 on hotel booking',
  'Cab 340 paid by Swayam, Omkar and Ved share',
  'Paid ₹500 for groceries, all of us',
];

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export function NLExpenseInput({ members, currency = 'INR', onParsed, onClose }: NLExpenseInputProps) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ReturnType<typeof parseNLExpense> | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [aiTierUsed, setAiTierUsed] = useState<LocalAiTier | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const parseInput = async (input: string) => {
    if (!input.trim()) return;
    const parsed = parseNLExpense(input, members);
    setIsParsing(true);
    setAiTierUsed(null);
    try {
      const generation = await generateLocalJsonWithStatus(
        `Extract an expense proposal. Known members: ${members.map(m => m.name).join(', ')}. Return {"description":string,"amount":number,"payer":string|null,"participants":string[],"category":string|null}. Amount is the stated major currency amount; do not calculate, split, or invent values.`,
        input,
      );
      setAiTierUsed(generation.tier);
      const suggestion = generation.text ? extractJsonObject(generation.text) : null;
      if (suggestion) {
        const payerName = typeof suggestion.payer === 'string' ? suggestion.payer.toLowerCase() : '';
        const member = members.find(m => m.name.toLowerCase() === payerName);
        const suggestedParticipants = Array.isArray(suggestion.participants) ? suggestion.participants.filter((p): p is string => typeof p === 'string') : [];
        const participants = suggestedParticipants.length ? members.filter(m => suggestedParticipants.some(p => p.toLowerCase() === m.name.toLowerCase())).map(m => m.id) : parsed.participantIds;
        if (typeof suggestion.description === 'string' && suggestion.description.trim()) parsed.description = suggestion.description.trim();
        if (parsed.amountPaise === 0 && typeof suggestion.amount === 'number' && Number.isFinite(suggestion.amount) && suggestion.amount > 0) parsed.amountPaise = Math.round(suggestion.amount * 100);
        if (member) parsed.paidByMemberId = member.id;
        if (participants.length) parsed.participantIds = participants;
        if (typeof suggestion.category === 'string') parsed.categoryHint = suggestion.category.toLowerCase();
        parsed.confidence = Math.max(parsed.confidence, 0.7);
      }
    } catch { /* Manual parsing remains the safe fallback. */ }
    finally { setIsParsing(false); }
    setResult(parsed);
  };

  const handleParse = async () => parseInput(text);

  const handleStartVoice = () => {
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Try Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = event => {
      const transcript = event.results[0][0].transcript;
      setText(transcript);
      void parseInput(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleStopVoice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleConfirm = () => {
    if (!result) return;
    onParsed({
      description: result.description,
      amountPaise: result.amountPaise,
      paidByMemberId: result.paidByMemberId,
      splitType: result.splitType === 'unknown' ? 'equal' : result.splitType,
      participantIds: result.participantIds,
      categoryHint: result.categoryHint,
    });
    onClose();
  };

  const getMemberName = (id: string | null) => {
    if (!id) return 'Unknown';
    return members.find(m => m.id === id)?.name || 'Unknown';
  };

  const confidenceColor =
    (result?.confidence || 0) >= 0.7
      ? 'text-emerald-600 dark:text-emerald-400'
      : (result?.confidence || 0) >= 0.4
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-rose-600 dark:text-rose-400';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 py-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        className="relative w-full max-w-lg raised-card p-5 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-outfit text-[var(--text-primary)]">
                Quick Add (Natural Language)
              </h2>
              <p className="text-[10px] text-[var(--text-muted)]">Describe the expense in plain English</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-inset)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Example prompts */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] font-mono flex items-center gap-1">
            <Lightbulb className="w-3 h-3" /> Try something like:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => { setText(p); setResult(null); }}
                className="text-[10px] font-mono px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-inset)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all text-[var(--text-muted)] text-left"
              >
                {p.length > 45 ? p.slice(0, 45) + '…' : p}
              </button>
            ))}
          </div>
        </div>

        {/* Text input */}
        <div className="space-y-2">
          <div className="relative">
            <textarea
              ref={textareaRef}
              id="nl-expense-input"
              value={text}
              onChange={e => { setText(e.target.value); setResult(null); }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleParse(); } }}
              placeholder="e.g. Omkar paid ₹2400 for dinner, split equally"
              rows={3}
              className="w-full inset-field px-4 py-3 text-sm resize-none pr-12 font-[var(--font-sans)]"
            />
            {/* Voice button */}
            <button
              type="button"
              onClick={isListening ? handleStopVoice : handleStartVoice}
              className={cn(
                'absolute right-2 top-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--accent)]'
              )}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              <Mic className="w-4 h-4" />
            </button>
            {isListening && <p className="mt-1 text-[10px] font-medium text-rose-500">Listening… Speak the amount, who paid, and who shares it.</p>}
          </div>

          <button
            onClick={() => void handleParse()}
            disabled={!text.trim() || isParsing}
            className="w-full py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
          >
            <Sparkles className="w-4 h-4" />
            {isParsing ? 'Checking details…' : 'Parse Expense'}
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Parsed result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[var(--text-primary)] font-outfit">Parsed Result</p>
                <div className="flex items-center gap-2">
                  {aiTierUsed && <span className="text-[10px] font-bold font-mono text-violet-600 dark:text-violet-400">On-device AI · {aiTierUsed === 'enhanced' ? '1.5B' : '0.5B'}</span>}
                  <span className={cn('text-[10px] font-bold font-mono', confidenceColor)}>
                    {Math.round((result.confidence || 0) * 100)}% confident
                  </span>
                </div>
              </div>

              {aiTierUsed ? (
                <p className="text-[10px] text-[var(--text-muted)]">Your downloaded on-device model refined this suggestion. Review it before saving.</p>
              ) : (
                <p className="text-[10px] text-[var(--text-muted)]">Using the fast on-device rules. Download a local model in Profile &amp; preferences for an AI refinement pass.</p>
              )}

              <div className="p-3 rounded-xl border border-[var(--border)] space-y-2.5"
                style={{ background: 'var(--surface-inset)' }}>
                {/* Description */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">Description</span>
                  <span className="text-xs font-bold text-[var(--text-primary)] text-right">
                    {result.description || <span className="text-[var(--text-muted)] italic">Not detected</span>}
                  </span>
                </div>

                {/* Amount */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">Amount</span>
                  <span className={cn('text-xs font-bold font-mono', result.amountPaise > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500')}>
                    {result.amountPaise > 0 ? formatCurrency(result.amountPaise, currency) : 'Not detected'}
                  </span>
                </div>

                {/* Paid by */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">Paid by</span>
                  <span className={cn('text-xs font-bold', result.paidByMemberId ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] italic')}>
                    {result.paidByMemberId ? getMemberName(result.paidByMemberId) : 'Not detected'}
                  </span>
                </div>

                {/* Split */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">Split</span>
                  <span className="text-xs font-bold text-[var(--text-primary)] capitalize text-right">
                    {result.splitType === 'equal' ? 'Equal' : result.splitType}
                    {result.participantIds.length > 0
                      ? ` · ${result.participantIds.map(id => getMemberName(id)).join(', ')}`
                      : ' · All members'}
                  </span>
                </div>

                {/* Category */}
                {result.categoryHint && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">Category</span>
                    <span className="text-xs font-bold text-[var(--accent)] capitalize">{result.categoryHint}</span>
                  </div>
                )}
              </div>

              {/* Confidence warning */}
              {(result.confidence || 0) < 0.5 && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                    Low confidence — some fields weren&apos;t detected. The form will be pre-filled but please review before saving.
                  </p>
                </div>
              )}

              {(!result.description || !result.amountPaise || !result.paidByMemberId) && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-violet-500/10 border border-violet-500/25">
                  <AlertCircle className="w-3.5 h-3.5 text-violet-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-violet-700 dark:text-violet-300 leading-relaxed">
                    Please confirm {[
                      !result.description && 'what this expense was for',
                      !result.amountPaise && 'the total amount',
                      !result.paidByMemberId && 'who paid',
                    ].filter(Boolean).join(', ')} before saving.
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Use This → Open Form
                </button>
                <button
                  onClick={() => setResult(null)}
                  className="px-3 py-2.5 rounded-xl font-semibold text-xs border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] transition-colors"
                >
                  Edit
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
