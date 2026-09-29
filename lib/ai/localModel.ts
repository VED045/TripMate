// Browser-only local AI runtime. This module is intentionally lazy: importing a
// screen never downloads a model. A model is downloaded only from Settings.

export type LocalAiTier = 'standard' | 'enhanced';

export interface LocalAiModel {
  id: string;
  tier: LocalAiTier;
  name: string;
  description: string;
  estimatedDownload: string;
  modelId: string;
  dtype: 'q4';
  minimumFreeStorageBytes: number;
}

export const LOCAL_AI_MODELS: Record<LocalAiTier, LocalAiModel> = {
  standard: {
    id: 'qwen2.5-0.5b-q4',
    tier: 'standard',
    name: 'Qwen 2.5 0.5B',
    description: 'A practical on-device assistant for short expense and search requests.',
    estimatedDownload: 'about 500 MB',
    modelId: 'onnx-community/Qwen2.5-0.5B-Instruct',
    dtype: 'q4',
    // Browser caches need workspace for model shards plus a temporary compile copy.
    minimumFreeStorageBytes: 900_000_000,
  },
  enhanced: {
    id: 'qwen2.5-1.5b-q4',
    tier: 'enhanced',
    name: 'Qwen 2.5 1.5B',
    description: 'Higher-quality instruction following and structured extraction for capable devices.',
    estimatedDownload: 'about 1.8 GB',
    modelId: 'onnx-community/Qwen2.5-1.5B-Instruct',
    dtype: 'q4',
    // Q4 weights plus browser cache/runtime workspace.
    minimumFreeStorageBytes: 2_200_000_000,
  },
};

export interface LocalAiStatus {
  webGpuAvailable: boolean;
  storageAvailable?: number;
  storageQuota?: number;
  downloaded: Record<LocalAiTier, boolean>;
}

export interface LocalAiGeneration {
  text: string | null;
  tier: LocalAiTier | null;
}

type Transformers = typeof import('@huggingface/transformers');
type TextGenerator = (messages: Array<{ role: string; content: string }>, options: { max_new_tokens: number; do_sample: boolean; temperature: number }) => Promise<Array<{ generated_text: Array<{ content: string }> }>>;

export class LocalAiDownloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocalAiDownloadError';
  }
}

let transformersPromise: Promise<Transformers> | null = null;
const loadedPipelines = new Map<LocalAiTier, unknown>();

async function getTransformers(): Promise<Transformers> {
  transformersPromise ??= import('@huggingface/transformers');
  const transformers = await transformersPromise;
  transformers.env.useBrowserCache = true;
  return transformers;
}

function storageKey(tier: LocalAiTier) { return `tripmate_local_ai_${tier}`; }

function formatGigabytes(bytes: number) {
  return `${(bytes / (1024 ** 3)).toFixed(1)} GB`;
}

async function getWorkingWebGpu() {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) return false;
  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
    return Boolean(await gpu?.requestAdapter());
  } catch {
    return false;
  }
}

async function ensureDownloadCapacity(model: LocalAiModel) {
  try {
    await navigator.storage?.persist?.();
    const estimate = await navigator.storage?.estimate?.();
    const freeBytes = estimate?.quota && estimate?.usage ? estimate.quota - estimate.usage : undefined;
    if (freeBytes !== undefined && freeBytes < model.minimumFreeStorageBytes) {
      throw new LocalAiDownloadError(`Not enough browser storage. Free at least ${formatGigabytes(model.minimumFreeStorageBytes)} and try again.`);
    }
  } catch (error) {
    if (error instanceof LocalAiDownloadError) throw error;
    // Storage estimates are not available on every mobile browser; let download continue.
  }
}

function progressValue(value: number | undefined) {
  if (typeof value !== 'number') return null;
  return Math.max(0, Math.min(100, value <= 1 ? value * 100 : value));
}

export async function getLocalAiStatus(): Promise<LocalAiStatus> {
  const webGpuAvailable = await getWorkingWebGpu();
  const estimate = await navigator.storage?.estimate?.();
  const downloaded = {
    standard: localStorage.getItem(storageKey('standard')) === 'ready',
    enhanced: localStorage.getItem(storageKey('enhanced')) === 'ready',
  };

  return {
    webGpuAvailable,
    storageAvailable: estimate?.quota && estimate?.usage ? estimate.quota - estimate.usage : undefined,
    storageQuota: estimate?.quota,
    downloaded,
  };
}

export async function downloadLocalAiModel(
  tier: LocalAiTier,
  onProgress?: (progress: number | null, status: string) => void,
): Promise<void> {
  const transformers = await getTransformers();
  const model = LOCAL_AI_MODELS[tier];
  await ensureDownloadCapacity(model);
  const device = (await getWorkingWebGpu()) ? 'webgpu' : 'wasm';

  onProgress?.(0, 'Checking device and preparing download…');
  const load = async (targetDevice: 'webgpu' | 'wasm') => transformers.pipeline('text-generation', model.modelId, {
    dtype: model.dtype,
    device: targetDevice,
    progress_callback: (event: { status?: string; progress?: number }) => {
      onProgress?.(progressValue(event.progress), event.status || 'Downloading…');
    },
  });
  try {
    const pipeline = await load(device);
    loadedPipelines.set(tier, pipeline);
    localStorage.setItem(storageKey(tier), 'ready');
    onProgress?.(100, 'Ready on this device');
  } catch (error) {
    if (device === 'webgpu') {
      onProgress?.(null, 'WebGPU could not start this model. Retrying with Q4 WASM…');
      const pipeline = await load('wasm');
      loadedPipelines.set(tier, pipeline);
      localStorage.setItem(storageKey(tier), 'ready');
      onProgress?.(100, 'Ready with WASM');
      return;
    }
    const message = error instanceof Error ? error.message : 'Unknown browser error';
    if (/quota|storage|space/i.test(message)) {
      throw new LocalAiDownloadError(`Browser storage ran out while preparing this model. Free storage, remove a model, then retry. (${message})`);
    }
    if (tier === 'enhanced') throw new LocalAiDownloadError(`The Enhanced 1.5B model could not start after both WebGPU and Q4 WASM were tried. Clear the partial download and retry on Wi-Fi. (${message})`);
    throw new LocalAiDownloadError(`The Standard model could not start. Try again on Wi-Fi or clear the partial download. (${message})`);
  }
}

export async function deleteLocalAiModel(tier: LocalAiTier): Promise<void> {
  const model = LOCAL_AI_MODELS[tier];
  loadedPipelines.delete(tier);
  localStorage.removeItem(storageKey(tier));
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(async cacheName => {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      await Promise.all(requests.filter(request => request.url.includes(model.modelId)).map(request => cache.delete(request)));
    }));
  }
}

export async function getDownloadedTier(): Promise<LocalAiTier | null> {
  const status = await getLocalAiStatus();
  return status.downloaded.enhanced ? 'enhanced' : status.downloaded.standard ? 'standard' : null;
}

export async function generateLocalJsonWithStatus(
  instructions: string,
  input: string,
): Promise<LocalAiGeneration> {
  const preferredTier = await getDownloadedTier();
  if (!preferredTier) return { text: null, tier: null };

  const transformers = await getTransformers();
  const tiers: LocalAiTier[] = preferredTier === 'enhanced' ? ['enhanced', 'standard'] : ['standard'];

  for (const tier of tiers) {
    if (localStorage.getItem(storageKey(tier)) !== 'ready') continue;
    const model = LOCAL_AI_MODELS[tier];
    let generator = loadedPipelines.get(tier) as TextGenerator | undefined;
    try {
      if (!generator) {
        const device = await getWorkingWebGpu() ? 'webgpu' : 'wasm';
        try {
          generator = await transformers.pipeline('text-generation', model.modelId, { dtype: model.dtype, device }) as unknown as TextGenerator;
        } catch {
          generator = await transformers.pipeline('text-generation', model.modelId, { dtype: model.dtype, device: 'wasm' }) as unknown as TextGenerator;
        }
        loadedPipelines.set(tier, generator);
      }

      const output = await generator([
        { role: 'system', content: `${instructions}\nReturn only valid JSON. Never calculate financial totals.` },
        { role: 'user', content: input },
      ], { max_new_tokens: 220, do_sample: false, temperature: 0 });

      const generated = output[0]?.generated_text;
      return { text: Array.isArray(generated) ? generated.at(-1)?.content ?? null : null, tier };
    } catch (error) {
      console.warn(`[local-ai] ${tier} generation failed; trying a compatible downloaded model if available.`, error);
      loadedPipelines.delete(tier);
      // A previously cached model can become unusable after a browser/runtime update.
      // Keep its files so the user can retry, but allow Standard to handle this request.
    }
  }

  return { text: null, tier: null };
}

export async function generateLocalJson(instructions: string, input: string): Promise<string | null> {
  return (await generateLocalJsonWithStatus(instructions, input)).text;
}

export function extractJsonObject(value: string): Record<string, unknown> | null {
  const start = value.indexOf('{');
  const end = value.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const parsed: unknown = JSON.parse(value.slice(start, end + 1));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}
