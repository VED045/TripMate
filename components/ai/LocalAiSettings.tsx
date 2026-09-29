'use client';

import { useEffect, useState } from 'react';
import { BrainCircuit, CheckCircle2, Cpu, Download, LoaderCircle, Trash2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { deleteLocalAiModel, downloadLocalAiModel, getLocalAiStatus, LOCAL_AI_MODELS, type LocalAiStatus, type LocalAiTier } from '@/lib/ai/localModel';

export function LocalAiSettings() {
  const [status, setStatus] = useState<LocalAiStatus | null>(null);
  const [activeTier, setActiveTier] = useState<LocalAiTier | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [progressText, setProgressText] = useState('');
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadErrorTier, setDownloadErrorTier] = useState<LocalAiTier | null>(null);
  const refresh = async () => { try { setStatus(await getLocalAiStatus()); } catch { toast.error('Local AI status is unavailable in this browser.'); } };
  useEffect(() => {
    let active = true;
    getLocalAiStatus().then(value => { if (active) setStatus(value); }).catch(() => { if (active) toast.error('Local AI status is unavailable in this browser.'); });
    return () => { active = false; };
  }, []);
  const download = async (tier: LocalAiTier) => {
    setActiveTier(tier); setProgress(0); setDownloadError(null); setDownloadErrorTier(null);
    try { await downloadLocalAiModel(tier, (value, text) => { setProgress(value); setProgressText(text); }); await refresh(); toast.success(`${LOCAL_AI_MODELS[tier].name} is ready for offline use.`); }
    catch (error) {
      console.error('[local-ai]', error);
      const message = error instanceof Error ? error.message : 'Model download failed.';
      setProgressText(message);
      setDownloadError(message);
      setDownloadErrorTier(tier);
      toast.error(message);
    }
    finally { setActiveTier(null); setProgress(null); }
  };
  const remove = async (tier: LocalAiTier) => { try { await deleteLocalAiModel(tier); await refresh(); toast.success('Local model removed from this browser.'); } catch { toast.error('Could not remove the local model.'); } };
  return <section className="raised-card p-5 space-y-4">
    <div className="flex gap-3"><div className="w-9 h-9 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center shrink-0"><BrainCircuit className="w-5 h-5" /></div><div><h2 className="text-sm font-bold font-outfit text-[var(--text-primary)]">On-device AI</h2><p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Optional, private assistance for expense interpretation. No API key required.</p></div></div>
    <div className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-inset)] text-xs"><Cpu className="w-4 h-4 text-[var(--accent)] shrink-0" /><span className="font-semibold text-[var(--text-primary)]">{status?.webGpuAvailable ? 'WebGPU available' : 'WASM fallback'}</span><span className="text-[var(--text-muted)]">{status?.webGpuAvailable ? 'Faster local inference is supported.' : 'AI may be slower on this device.'}</span></div>
    <div className="space-y-2">{(Object.entries(LOCAL_AI_MODELS) as [LocalAiTier, typeof LOCAL_AI_MODELS.standard][]).map(([tier, model]) => { const downloaded = status?.downloaded[tier] ?? false; const downloading = activeTier === tier; const failed = downloadErrorTier === tier && activeTier === null && !downloaded; return <div key={tier} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] space-y-2"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-[var(--text-primary)]">{model.name} {tier === 'enhanced' && <span className="text-[10px] text-[var(--accent)]">ENHANCED · WEBGPU</span>}</p><p className="text-[10px] text-[var(--text-muted)] mt-0.5">{model.description} · {model.estimatedDownload}</p></div>{downloaded && <CheckCircle2 className="w-4 h-4 text-[var(--success)] shrink-0" />}</div>{tier === 'enhanced' && !status?.webGpuAvailable && <p className="text-[10px] text-amber-600">This model needs a WebGPU-capable browser. The Standard model remains available.</p>}{downloading && <div className="space-y-1"><div className="h-1.5 rounded-full overflow-hidden bg-[var(--surface-inset)]"><div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${progress ?? 8}%` }} /></div><p className="text-[10px] text-[var(--text-muted)]">{progressText || 'Starting download…'}</p></div>}{failed && <><p className="text-[10px] text-[var(--danger)] leading-relaxed">{downloadError}</p><button type="button" onClick={() => void remove(tier)} className="text-[10px] font-bold text-[var(--text-secondary)] underline underline-offset-2">Clear partial download</button></>}{downloaded ? <button type="button" onClick={() => void remove(tier)} className="text-[11px] font-bold text-[var(--danger)] flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Remove from this device</button> : <button type="button" disabled={activeTier !== null || (tier === 'enhanced' && !status?.webGpuAvailable)} onClick={() => void download(tier)} className="text-[11px] font-bold text-[var(--accent)] flex items-center gap-1.5 disabled:opacity-50">{downloading ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Download for offline use</button>}</div>; })}</div>
    <p className="flex gap-1.5 text-[10px] text-[var(--text-muted)] leading-relaxed"><TriangleAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" /> AI suggestions are always reviewed before saving. Totals, GST, splits, balances, and settlements stay deterministic.</p>
  </section>;
}
