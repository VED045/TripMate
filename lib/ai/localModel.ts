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
  },
  enhanced: {
    id: 'qwen2.5-1.5b-q4',
    tier: 'enhanced',
    name: 'Qwen 2.5 1.5B',
    description: 'Higher-quality instruction following and structured extraction for capable devices.',
    estimatedDownload: 'about 1.8 GB',
    modelId: 'onnx-community/Qwen2.5-1.5B-Instruct',
    dtype: 'q4',
  },
};

export interface LocalAiStatus {
  webGpuAvailable: boolean;
  storageAvailable?: number;
  storageQuota?: number;
  downloaded: Record<LocalAiTier, boolean>;
}

type Transformers = typeof import('@huggingface/transformers');
type TextGenerator = (messages: Array<{ role: string; content: string }>, options: { max_new_tokens: number; do_sample: boolean; temperature: number }) => Promise<Array<{ generated_text: Array<{ content: string }> }>>;

let transformersPromise: Promise<Transformers> | null = null;
const loadedPipelines = new Map<LocalAiTier, unknown>();

async function getTransformers(): Promise<Transformers> {
  transformersPromise ??= import('@huggingface/transformers');
  const transformers = await transformersPromise;
  transformers.env.useBrowserCache = true;
  return transformers;
}

function storageKey(tier: LocalAiTier) { return `tripmate_local_ai_${tier}`; }

export async function getLocalAiStatus(): Promise<LocalAiStatus> {
  const webGpuAvailable = typeof navigator !== 'undefined' && 'gpu' in navigator;
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
  const device = typeof navigator !== 'undefined' && 'gpu' in navigator ? 'webgpu' : 'wasm';

  onProgress?.(0, 'Preparing secure local download…');
  try {
    const pipeline = await transformers.pipeline('text-generation', model.modelId, {
      dtype: model.dtype,
      device,
      progress_callback: (event: { status?: string; progress?: number }) => {
        onProgress?.(typeof event.progress === 'number' ? event.progress : null, event.status || 'Downloading…');
      },
    });
    loadedPipelines.set(tier, pipeline);
    localStorage.setItem(storageKey(tier), 'ready');
    onProgress?.(100, 'Ready on this device');
  } catch (error) {
    if (device === 'webgpu') {
      onProgress?.(null, 'WebGPU was unavailable. Retrying with WASM…');
      const pipeline = await transformers.pipeline('text-generation', model.modelId, {
        dtype: model.dtype,
        device: 'wasm',
        progress_callback: (event: { status?: string; progress?: number }) => {
          onProgress?.(typeof event.progress === 'number' ? event.progress : null, event.status || 'Downloading…');
        },
      });
      loadedPipelines.set(tier, pipeline);
      localStorage.setItem(storageKey(tier), 'ready');
      onProgress?.(100, 'Ready with WASM');
      return;
    }
    throw error;
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

export async function generateLocalJson(
  instructions: string,
  input: string,
): Promise<string | null> {
  const tier = await getDownloadedTier();
  if (!tier) return null;

  const transformers = await getTransformers();
  const model = LOCAL_AI_MODELS[tier];
  let generator = loadedPipelines.get(tier) as TextGenerator | undefined;

  if (!generator) {
    const device = typeof navigator !== 'undefined' && 'gpu' in navigator ? 'webgpu' : 'wasm';
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
  return Array.isArray(generated) ? generated.at(-1)?.content ?? null : null;
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
