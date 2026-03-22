/**
 * GenesisAudio — Web Audio API spatial sound engine for the Swibe Genesis Engine PWA.
 *
 * All sounds are synthesized in real-time. Designed to feel ambient and musical —
 * Ryuichi Sakamoto meets sci-fi UI. Volume is kept subtle throughout.
 */

export class GenesisAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.reverb = null;
    this._initialized = false;
  }

  /* ------------------------------------------------------------------ */
  /*  Lifecycle                                                          */
  /* ------------------------------------------------------------------ */

  /** Create AudioContext, master gain and convolution reverb.
   *  Call on the first user gesture (click / tap / key). */
  async init() {
    if (this._initialized) return;

    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    // Master gain — keep everything subdued
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);

    // Convolution reverb with a generated impulse response
    this.reverb = this._createReverb(2.4, 2.0);
    this.reverb.connect(this.master);

    this._initialized = true;
  }

  /** Tear everything down. */
  dispose() {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.master = null;
    this.reverb = null;
    this._initialized = false;
  }

  /* ------------------------------------------------------------------ */
  /*  Sound events                                                       */
  /* ------------------------------------------------------------------ */

  /**
   * Starts a low, evolving ambient pad — two detuned oscillators
   * (sine + triangle) with a slow LFO modulating frequency.
   * @returns {Function} stop — call to fade out and stop the drone.
   */
  ambientDrone() {
    this._ensure();
    const t = this.ctx.currentTime;

    // Drone gain — very low
    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0, t);
    droneGain.gain.linearRampToValueAtTime(0.06, t + 4);
    droneGain.connect(this.master);

    // Two detuned oscillators
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 55; // A1

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 55.4; // slightly sharp — beating

    // Slow LFO on frequency
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.07; // ~ 4-second cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 1.5; // ±1.5 Hz wobble
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    osc1.connect(droneGain);
    osc2.connect(droneGain);

    lfo.start(t);
    osc1.start(t);
    osc2.start(t);

    return () => {
      const now = this.ctx.currentTime;
      droneGain.gain.linearRampToValueAtTime(0, now + 3);
      osc1.stop(now + 3.1);
      osc2.stop(now + 3.1);
      lfo.stop(now + 3.1);
    };
  }

  /**
   * A short rising crystalline tone — like a star being born.
   * @param {number} pan  Stereo position, –1 (left) to 1 (right).
   */
  agentBorn(pan = 0) {
    this._ensure();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(2400, t + 0.15);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.12, t + 0.02);   // quick attack
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.6); // medium decay

    const panner = this.ctx.createStereoPanner();
    panner.pan.value = pan;

    osc.connect(env);
    env.connect(panner);
    panner.connect(this.reverb);
    panner.connect(this.master);

    osc.start(t);
    osc.stop(t + 0.65);
  }

  /** Soft clicking / ticking — short noise burst through a high bandpass. */
  agentThink() {
    this._ensure();
    const t = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.015; // 15 ms
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 6000;
    bp.Q.value = 8;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.08, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    src.connect(bp);
    bp.connect(env);
    env.connect(this.master);

    src.start(t);
  }

  /** Two tones sliding together into unison — portamento merge. */
  agentMerge() {
    this._ensure();
    const t = this.ctx.currentTime;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.09, t);
    gain.gain.linearRampToValueAtTime(0.09, t + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
    gain.connect(this.reverb);
    gain.connect(this.master);

    const oscA = this.ctx.createOscillator();
    oscA.type = 'sine';
    oscA.frequency.setValueAtTime(440, t);
    oscA.frequency.exponentialRampToValueAtTime(523.25, t + 0.8); // slide up to C5

    const oscB = this.ctx.createOscillator();
    oscB.type = 'sine';
    oscB.frequency.setValueAtTime(660, t);
    oscB.frequency.exponentialRampToValueAtTime(523.25, t + 0.8); // slide down to C5

    oscA.connect(gain);
    oscB.connect(gain);

    oscA.start(t);
    oscB.start(t);
    oscA.stop(t + 1.5);
    oscB.stop(t + 1.5);
  }

  /**
   * The big moment — deep sub-bass hit + shimmer sweep upward + reverb tail.
   * Dramatic but not loud.
   */
  genesis() {
    this._ensure();
    const t = this.ctx.currentTime;

    // --- Sub-bass hit ---
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(40, t);
    sub.frequency.exponentialRampToValueAtTime(28, t + 1.2);

    const subEnv = this.ctx.createGain();
    subEnv.gain.setValueAtTime(0.18, t);
    subEnv.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

    sub.connect(subEnv);
    subEnv.connect(this.master);

    sub.start(t);
    sub.stop(t + 2);

    // --- Shimmer sweep upward ---
    const shimmer = this.ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(800, t + 0.05);
    shimmer.frequency.exponentialRampToValueAtTime(6000, t + 1.6);

    const shimmer2 = this.ctx.createOscillator();
    shimmer2.type = 'sine';
    shimmer2.frequency.setValueAtTime(803, t + 0.05); // slight detune for width
    shimmer2.frequency.exponentialRampToValueAtTime(6010, t + 1.6);

    const shimmerEnv = this.ctx.createGain();
    shimmerEnv.gain.setValueAtTime(0, t);
    shimmerEnv.gain.linearRampToValueAtTime(0.06, t + 0.3);
    shimmerEnv.gain.exponentialRampToValueAtTime(0.001, t + 2.2);

    shimmer.connect(shimmerEnv);
    shimmer2.connect(shimmerEnv);
    shimmerEnv.connect(this.reverb);

    shimmer.start(t + 0.05);
    shimmer2.start(t + 0.05);
    shimmer.stop(t + 2.5);
    shimmer2.stop(t + 2.5);
  }

  /** Gentle major chord arpeggio — C E G C ascending, quick sine plucks. */
  success() {
    this._ensure();
    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4 E4 G4 C5
    const spacing = 0.12;

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const env = this.ctx.createGain();
      const onset = t + i * spacing;
      env.gain.setValueAtTime(0, onset);
      env.gain.linearRampToValueAtTime(0.1, onset + 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, onset + 0.5);

      osc.connect(env);
      env.connect(this.reverb);
      env.connect(this.master);

      osc.start(onset);
      osc.stop(onset + 0.55);
    });
  }

  /** Short minor-second dissonance, quick fade. */
  error() {
    this._ensure();
    const t = this.ctx.currentTime;

    const oscA = this.ctx.createOscillator();
    oscA.type = 'sine';
    oscA.frequency.value = 311.13; // Eb4

    const oscB = this.ctx.createOscillator();
    oscB.type = 'sine';
    oscB.frequency.value = 329.63; // E4 — minor second clash

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.1, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    oscA.connect(env);
    oscB.connect(env);
    env.connect(this.master);

    oscA.start(t);
    oscB.start(t);
    oscA.stop(t + 0.4);
    oscB.stop(t + 0.4);
  }

  /* ------------------------------------------------------------------ */
  /*  Internals                                                          */
  /* ------------------------------------------------------------------ */

  /** Throw if init() hasn't been called yet. */
  _ensure() {
    if (!this._initialized) {
      throw new Error('GenesisAudio: call init() first (must be triggered by a user gesture).');
    }
  }

  /**
   * Generate a synthetic reverb impulse response.
   * @param {number} duration  Length in seconds.
   * @param {number} decay     Decay time constant.
   * @returns {ConvolverNode}
   */
  _createReverb(duration, decay) {
    const length = this.ctx.sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    const convolver = this.ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }
}
