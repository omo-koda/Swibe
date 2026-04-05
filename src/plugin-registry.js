import fs from 'node:fs';
import path from 'node:path';

export class PluginRegistry {
  constructor() {
    this.plugins = new Map();
    this.hooks = {
      onBirth: [],
      onThink: [],
      onReceipt: [],
      onSettle: [],
      onEvolve: [],
      onObserve: []
    };
  }

  register(name, plugin) {
    if (!plugin.name) plugin.name = name;
    this.plugins.set(name, plugin);

    if (typeof plugin.onBirth === 'function') this.hooks.onBirth.push(plugin.onBirth.bind(plugin));
    if (typeof plugin.onThink === 'function') this.hooks.onThink.push(plugin.onThink.bind(plugin));
    if (typeof plugin.onReceipt === 'function') this.hooks.onReceipt.push(plugin.onReceipt.bind(plugin));
    if (typeof plugin.onSettle === 'function') this.hooks.onSettle.push(plugin.onSettle.bind(plugin));
    if (typeof plugin.onEvolve === 'function') this.hooks.onEvolve.push(plugin.onEvolve.bind(plugin));
    if (typeof plugin.onObserve === 'function') this.hooks.onObserve.push(plugin.onObserve.bind(plugin));

    console.log(`[PLUGIN] Registered: ${name}`);
    return this;
  }

  async fire(hook, data) {
    const handlers = this.hooks[hook] || [];
    const results = [];
    for (const handler of handlers) {
      try {
        results.push(await handler(data));
      } catch (e) {
        console.warn(`[PLUGIN] ${hook} error:`, e.message);
      }
    }
    return results;
  }

  get(name) {
    return this.plugins.get(name);
  }

  list() {
    return Array.from(this.plugins.keys());
  }

  async autoDiscover(pluginsDir) {
    if (!fs.existsSync(pluginsDir)) {
      fs.mkdirSync(pluginsDir, { recursive: true });
      return;
    }

    const files = fs.readdirSync(pluginsDir)
      .filter(f => f.endsWith('.js') || f.endsWith('.swibe-plugin.js'));

    for (const file of files) {
      try {
        const pluginPath = path.join(pluginsDir, file);
        const mod = await import(pluginPath);
        const plugin = mod.default || mod;
        const name = file.replace('.js', '').replace('.swibe-plugin', '');
        this.register(name, plugin);
      } catch (e) {
        console.warn(`[PLUGIN] Failed to load ${file}:`, e.message);
      }
    }
  }
}

export const registry = new PluginRegistry();
