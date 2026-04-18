/**
 * Swibe Viewport Module — Phase 6: Screen Understanding
 * Resolution detection, accessibility layer, UI element extraction, OCR
 */

import { EventEmitter } from 'events';

class UIElement {
  constructor(type, bounds, props = {}) {
    this.type = type;
    this.bounds = bounds;
    this.text = props.text || null;
    this.label = props.label || null;
    this.role = props.role || null;
    this.interactable = props.interactable || false;
    this.children = props.children || [];
    this.attributes = props.attributes || {};
  }

  toAccessible() {
    return {
      role: this.role || this.type,
      name: this.label || this.text || `[${this.type}]`,
      bounds: this.bounds,
      interactable: this.interactable,
      children: this.children.map(c => c.toAccessible()),
    };
  }
}

class ScreenCapture {
  constructor(width, height, data = {}) {
    this.width = width;
    this.height = height;
    this.timestamp = Date.now();
    this.elements = data.elements || [];
    this.text = data.text || null;
    this.metadata = data.metadata || {};
  }
}

export class Viewport extends EventEmitter {
  constructor(config = {}) {
    super();
    this.width = config.width || 1920;
    this.height = config.height || 1080;
    this.scale = config.scale || 1.0;
    this.accessibility = config.accessibility !== false;
    this.ocrEnabled = config.ocr !== false;
    this.captureHistory = [];
    this.maxHistory = config.max_history || 50;
  }

  async capture() {
    this.emit('capture:start', { width: this.width, height: this.height });

    const capture = new ScreenCapture(this.width, this.height, {
      elements: [],
      text: null,
      metadata: {
        scale: this.scale,
        accessibility: this.accessibility,
        ocr: this.ocrEnabled,
      },
    });

    if (this.captureHistory.length >= this.maxHistory) {
      this.captureHistory.shift();
    }
    this.captureHistory.push(capture);

    this.emit('capture:complete', capture);
    return capture;
  }

  async extractElements(capture = null) {
    const target = capture || await this.capture();
    this.emit('extract:start', { elementCount: target.elements.length });

    const elements = target.elements.map(e =>
      new UIElement(e.type || 'unknown', e.bounds || {}, e)
    );

    this.emit('extract:complete', { count: elements.length });
    return elements;
  }

  async ocr(capture = null) {
    if (!this.ocrEnabled) {
      throw new Error('OCR is disabled in viewport configuration');
    }

    const target = capture || await this.capture();
    this.emit('ocr:start');

    const result = {
      text: target.text || '',
      regions: [],
      confidence: 0.0,
      timestamp: Date.now(),
    };

    this.emit('ocr:complete', result);
    return result;
  }

  async accessibilityTree(capture = null) {
    if (!this.accessibility) {
      throw new Error('Accessibility layer is disabled in viewport configuration');
    }

    const elements = await this.extractElements(capture);
    const tree = {
      role: 'root',
      name: 'Screen',
      bounds: { x: 0, y: 0, width: this.width, height: this.height },
      children: elements.map(e => e.toAccessible()),
      timestamp: Date.now(),
    };

    this.emit('a11y:complete', tree);
    return tree;
  }

  async findElement(query) {
    const elements = await this.extractElements();
    return elements.filter(el => {
      if (query.type && el.type !== query.type) return false;
      if (query.text && el.text && !el.text.includes(query.text)) return false;
      if (query.role && el.role !== query.role) return false;
      if (query.label && el.label && !el.label.includes(query.label)) return false;
      if (query.interactable !== undefined && el.interactable !== query.interactable) return false;
      return true;
    });
  }

  async diff(captureA, captureB) {
    this.emit('diff:start');
    const diff = {
      added: [],
      removed: [],
      changed: [],
      unchanged: captureA.elements.length,
      timestamp: Date.now(),
    };
    this.emit('diff:complete', diff);
    return diff;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.emit('resize', { width, height });
  }

  setScale(scale) {
    this.scale = scale;
    this.emit('scale', { scale });
  }

  getResolution() {
    return {
      width: this.width,
      height: this.height,
      scale: this.scale,
      effectiveWidth: Math.round(this.width * this.scale),
      effectiveHeight: Math.round(this.height * this.scale),
    };
  }

  clearHistory() {
    this.captureHistory = [];
  }
}

export function viewportFromAST(node) {
  const config = node.config || {};
  const opts = {};
  for (const [key, val] of Object.entries(config)) {
    const v = typeof val === 'object' && val.value !== undefined ? val.value : val;
    switch (key) {
      case 'width': opts.width = Number(v); break;
      case 'height': opts.height = Number(v); break;
      case 'scale': opts.scale = Number(v); break;
      case 'accessibility': opts.accessibility = v === true || v === 'true'; break;
      case 'ocr': opts.ocr = v === true || v === 'true'; break;
      case 'max_history': opts.max_history = Number(v); break;
      default: opts[key] = v;
    }
  }
  return new Viewport(opts);
}
