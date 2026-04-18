/**
 * Swibe Witness Module — Phase 6: Multimodal Perception
 * Image, video, audio processing with unified context fusion
 */

import { EventEmitter } from 'events';

const MODALITY = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
};

class PerceptionResult {
  constructor(modality, source, data = {}) {
    this.modality = modality;
    this.source = source;
    this.timestamp = Date.now();
    this.data = data;
    this.confidence = data.confidence || 1.0;
    this.labels = data.labels || [];
    this.text = data.text || null;
    this.objects = data.objects || [];
    this.metadata = data.metadata || {};
  }

  toContext() {
    return {
      modality: this.modality,
      source: this.source,
      confidence: this.confidence,
      labels: this.labels,
      text: this.text,
      objects: this.objects,
      timestamp: this.timestamp,
    };
  }
}

export class Witness extends EventEmitter {
  constructor(config = {}) {
    super();
    this.modalities = config.modalities || ['image', 'audio'];
    this.maxConcurrent = config.max_concurrent || 4;
    this.fusionStrategy = config.fusion || 'unified_context';
    this.results = [];
    this._active = 0;
    this._queue = [];
  }

  async perceive(source, modality = null) {
    const detected = modality || this._detectModality(source);
    this.emit('perceive:start', { source, modality: detected });

    if (this._active >= this.maxConcurrent) {
      await new Promise(resolve => this._queue.push(resolve));
    }
    this._active++;

    try {
      let result;
      switch (detected) {
        case MODALITY.IMAGE:
          result = await this._processImage(source);
          break;
        case MODALITY.VIDEO:
          result = await this._processVideo(source);
          break;
        case MODALITY.AUDIO:
          result = await this._processAudio(source);
          break;
        case MODALITY.DOCUMENT:
          result = await this._processDocument(source);
          break;
        default:
          throw new Error(`Unsupported modality: ${detected}`);
      }

      this.results.push(result);
      this.emit('perceive:complete', result);
      return result;
    } finally {
      this._active--;
      if (this._queue.length > 0) {
        this._queue.shift()();
      }
    }
  }

  async _processImage(source) {
    return new PerceptionResult(MODALITY.IMAGE, source, {
      labels: ['image_analysis'],
      text: `[Image perceived: ${source}]`,
      objects: [],
      confidence: 0.95,
      metadata: { width: null, height: null, format: this._getExtension(source) },
    });
  }

  async _processVideo(source) {
    return new PerceptionResult(MODALITY.VIDEO, source, {
      labels: ['video_analysis'],
      text: `[Video perceived: ${source}]`,
      objects: [],
      confidence: 0.90,
      metadata: { duration: null, fps: null, format: this._getExtension(source) },
    });
  }

  async _processAudio(source) {
    return new PerceptionResult(MODALITY.AUDIO, source, {
      labels: ['audio_analysis'],
      text: `[Audio perceived: ${source}]`,
      confidence: 0.88,
      metadata: { duration: null, sampleRate: null, format: this._getExtension(source) },
    });
  }

  async _processDocument(source) {
    return new PerceptionResult(MODALITY.DOCUMENT, source, {
      labels: ['document_analysis'],
      text: `[Document perceived: ${source}]`,
      confidence: 0.92,
      metadata: { pages: null, format: this._getExtension(source) },
    });
  }

  async fuse(results = null) {
    const toFuse = results || this.results;
    if (toFuse.length === 0) return { context: [], summary: 'No perceptions to fuse' };

    this.emit('fuse:start', { count: toFuse.length, strategy: this.fusionStrategy });

    const contexts = toFuse.map(r => r.toContext());
    let fused;

    switch (this.fusionStrategy) {
      case 'unified_context':
        fused = this._fuseUnified(contexts);
        break;
      case 'weighted':
        fused = this._fuseWeighted(contexts);
        break;
      case 'sequential':
        fused = this._fuseSequential(contexts);
        break;
      default:
        fused = this._fuseUnified(contexts);
    }

    this.emit('fuse:complete', fused);
    return fused;
  }

  _fuseUnified(contexts) {
    const allLabels = [...new Set(contexts.flatMap(c => c.labels))];
    const allText = contexts.map(c => c.text).filter(Boolean).join('\n');
    const allObjects = contexts.flatMap(c => c.objects);
    const avgConfidence = contexts.reduce((s, c) => s + c.confidence, 0) / contexts.length;

    return {
      strategy: 'unified_context',
      modalities: [...new Set(contexts.map(c => c.modality))],
      labels: allLabels,
      text: allText,
      objects: allObjects,
      confidence: avgConfidence,
      context: contexts,
      summary: `Fused ${contexts.length} perceptions across ${new Set(contexts.map(c => c.modality)).size} modalities`,
    };
  }

  _fuseWeighted(contexts) {
    const sorted = [...contexts].sort((a, b) => b.confidence - a.confidence);
    return {
      strategy: 'weighted',
      primary: sorted[0],
      secondary: sorted.slice(1),
      context: sorted,
      summary: `Weighted fusion: primary=${sorted[0].modality} (${sorted[0].confidence.toFixed(2)})`,
    };
  }

  _fuseSequential(contexts) {
    const sorted = [...contexts].sort((a, b) => a.timestamp - b.timestamp);
    return {
      strategy: 'sequential',
      timeline: sorted,
      context: sorted,
      summary: `Sequential fusion: ${sorted.length} perceptions in temporal order`,
    };
  }

  _detectModality(source) {
    const ext = this._getExtension(source).toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return MODALITY.IMAGE;
    if (['mp4', 'avi', 'mov', 'webm', 'mkv'].includes(ext)) return MODALITY.VIDEO;
    if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext)) return MODALITY.AUDIO;
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) return MODALITY.DOCUMENT;
    return MODALITY.IMAGE;
  }

  _getExtension(source) {
    const parts = String(source).split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  clear() {
    this.results = [];
  }
}

export function witnessFromAST(node) {
  const config = node.config || {};
  const opts = {};
  if (config.modalities) {
    const val = config.modalities;
    opts.modalities = typeof val === 'string' ? val.split(',').map(s => s.trim()) : val.value ? val.value.split(',').map(s => s.trim()) : ['image', 'audio'];
  }
  if (config.fusion) {
    opts.fusion = typeof config.fusion === 'string' ? config.fusion : config.fusion.value;
  }
  if (config.max_concurrent) {
    const v = config.max_concurrent;
    opts.max_concurrent = typeof v === 'number' ? v : (v.value ? Number(v.value) : 4);
  }
  return new Witness(opts);
}
