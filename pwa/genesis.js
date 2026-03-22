// Swibe Genesis Engine — Main Orchestrator
// Wires canvas, audio, agents, and UI together

import { CosmosRenderer } from './canvas.js';
import { GenesisAudio } from './audio.js';
import { AgentSwarm } from './agents.js';

class GenesisEngine {
  constructor() {
    this.canvas = null;
    this.audio = new GenesisAudio();
    this.swarm = new AgentSwarm();
    this.dronStop = null;
    this.audioReady = false;

    this.$wish   = document.getElementById('wish-input');
    this.$voiceBtn = document.getElementById('voice-btn');
    this.$goBtn  = document.getElementById('wish-btn');
    this.$log    = document.getElementById('agent-log');
    this.$result = document.getElementById('result-stage');
    this.$phase  = document.getElementById('phase-indicator');

    this.init();
  }

  init() {
    // Cosmos
    const canvasEl = document.getElementById('cosmos');
    this.canvas = new CosmosRenderer(canvasEl);

    // Audio — lazy on first interaction
    const initAudio = () => {
      if (!this.audioReady) {
        this.audio.init();
        this.audioReady = true;
        this.dronStop = this.audio.ambientDrone();
      }
    };
    document.addEventListener('pointerdown', initAudio, { once: true });

    // Voice
    this.$voiceBtn.addEventListener('click', () => this.startVoice());

    // Genesis button
    this.$goBtn.addEventListener('click', () => this.run());

    // Enter key
    this.$wish.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.run();
      }
    });

    // Wire swarm events
    this.swarm.addEventListener('phase-change', (e) => {
      this.$phase.textContent = `⟐ ${e.detail.phase} — ${e.detail.description}`;
      this.$phase.classList.add('pulse');
      setTimeout(() => this.$phase.classList.remove('pulse'), 600);
    });

    this.swarm.addEventListener('agent-born', (e) => {
      const a = e.detail.agent;
      this.canvas.addAgent(a);
      if (this.audioReady) this.audio.agentBorn((a.x - 960) / 960);
    });

    this.swarm.addEventListener('agent-think', (e) => {
      this.canvas.setAgentState(e.detail.agentId, 'thinking');
      this.appendLog(e.detail.message, 'info');
      if (this.audioReady) this.audio.agentThink();
    });

    this.swarm.addEventListener('agent-connect', (e) => {
      this.canvas.connectAgents(e.detail.from, e.detail.to);
    });

    this.swarm.addEventListener('agent-merge', (e) => {
      this.canvas.setAgentState(e.detail.agentId, 'merging');
      if (this.audioReady) this.audio.agentMerge();
    });

    this.swarm.addEventListener('agent-done', (e) => {
      this.canvas.setAgentState(e.detail.agentId, 'done');
    });

    this.swarm.addEventListener('log', (e) => {
      this.appendLog(e.detail.message, e.detail.type);
    });

    this.swarm.addEventListener('genesis-complete', (e) => {
      this.canvas.pulseAll();
      if (this.audioReady) this.audio.genesis();
      setTimeout(() => {
        if (this.audioReady) this.audio.success();
        this.showResult(e.detail.html);
      }, 1200);
    });
  }

  appendLog(message, type = 'info') {
    const line = document.createElement('div');
    line.className = `log-line log-${type}`;
    line.textContent = message;
    this.$log.appendChild(line);
    this.$log.scrollTop = this.$log.scrollHeight;

    // Keep only last 50 lines
    while (this.$log.children.length > 50) {
      this.$log.removeChild(this.$log.firstChild);
    }
  }

  showResult(html) {
    this.$result.classList.add('visible');
    const iframe = document.createElement('iframe');
    iframe.sandbox = 'allow-scripts';
    iframe.srcdoc = html;
    this.$result.innerHTML = '';

    // Close button
    const close = document.createElement('button');
    close.className = 'result-close';
    close.textContent = '✕';
    close.addEventListener('click', () => {
      this.$result.classList.remove('visible');
      this.$result.innerHTML = '';
    });

    this.$result.appendChild(close);
    this.$result.appendChild(iframe);
  }

  async run() {
    const wish = this.$wish.value.trim();
    if (!wish) {
      this.$wish.focus();
      return;
    }

    // Reset
    this.$log.innerHTML = '';
    this.$result.classList.remove('visible');
    this.$result.innerHTML = '';
    this.$goBtn.disabled = true;
    this.$goBtn.textContent = '◌ Summoning…';

    this.appendLog(`🌀 Wish received: "${wish}"`, 'info');

    await this.swarm.genesis(wish);

    this.$goBtn.disabled = false;
    this.$goBtn.textContent = '⚡ Genesis';
  }

  startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      this.appendLog('⚠ Speech recognition not supported in this browser', 'warn');
      return;
    }

    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = true;

    this.$voiceBtn.classList.add('listening');
    this.appendLog('🎙 Listening…', 'info');

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
      this.$wish.value = transcript;
    };

    recognition.onend = () => {
      this.$voiceBtn.classList.remove('listening');
    };

    recognition.onerror = (e) => {
      this.$voiceBtn.classList.remove('listening');
      this.appendLog(`⚠ Voice error: ${e.error}`, 'warn');
    };

    recognition.start();
  }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  new GenesisEngine();
});
