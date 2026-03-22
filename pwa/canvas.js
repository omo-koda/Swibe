/**
 * CosmosRenderer — Swibe Genesis Engine particle renderer
 * Canvas 2D cosmic background with agent orbs, connections, and pulse effects.
 */

const STAR_COUNT = 200;
const BG_COLOR = '#050510';
const ROLE_COLORS = {
  architect:    '#7b2ff7',
  builder:      '#00d9ff',
  validator:    '#4ecdc4',
  stylist:      '#ff6b9d',
  orchestrator: '#ffd93d',
};
const AGENT_RADIUS = 20;
const CONNECTION_PARTICLE_SPEED = 0.003;
const CONNECTION_PARTICLE_COUNT = 3;

// ---- helpers ----------------------------------------------------------------

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// ---- star pool --------------------------------------------------------------

function createStars(count, w, h) {
  const stars = new Array(count);
  for (let i = 0; i < count; i++) {
    stars[i] = {
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.3,
      depth: Math.random(),           // 0 = far, 1 = near (parallax)
      alpha: Math.random() * 0.6 + 0.4,
      twinkleSpeed: Math.random() * 0.002 + 0.001,
      twinklePhase: Math.random() * Math.PI * 2,
    };
  }
  return stars;
}

// ---- connection data-flow particles (pooled) --------------------------------

function createConnectionParticles() {
  const particles = new Array(CONNECTION_PARTICLE_COUNT);
  for (let i = 0; i < CONNECTION_PARTICLE_COUNT; i++) {
    particles[i] = { t: i / CONNECTION_PARTICLE_COUNT };
  }
  return particles;
}

// ---- CosmosRenderer ---------------------------------------------------------

export class CosmosRenderer {
  /** @param {HTMLCanvasElement} canvasEl */
  constructor(canvasEl) {
    this._canvas = canvasEl;
    this._ctx = canvasEl.getContext('2d');
    this._agents = new Map();          // id → agent
    this._connections = [];            // { id1, id2, particles[] }
    this._running = true;
    this._rafId = 0;
    this._pulse = null;                // { startTime, duration }
    this._pointer = { x: 0, y: 0 };   // normalised –1…1 from center
    this._time = 0;

    this._resize();
    this._stars = createStars(STAR_COUNT, this._w, this._h);

    this._onResize = () => this._resize();
    this._onPointerMove = (e) => this._handlePointer(e);
    window.addEventListener('resize', this._onResize);
    window.addEventListener('mousemove', this._onPointerMove);
    window.addEventListener('touchmove', this._onPointerMove, { passive: true });

    this._tick = this._tick.bind(this);
    this._rafId = requestAnimationFrame(this._tick);
  }

  // -- public API -------------------------------------------------------------

  /** Map from 1920×1080 virtual space to current canvas size. */
  _mapX(vx) { return (vx / 1920) * this._w; }
  _mapY(vy) { return (vy / 1080) * this._h; }

  /** Add an agent particle to the scene. */
  addAgent(agent) {
    const mx = this._mapX(agent.x);
    const my = this._mapY(agent.y);
    this._agents.set(agent.id, {
      ...agent,
      color: agent.color || ROLE_COLORS[agent.role] || '#ffffff',
      state: agent.state || 'idle',
      connections: agent.connections || [],
      x: mx, y: my,
      _phase: Math.random() * Math.PI * 2,
      _trail: [],
      _orbitAngle: 0,
      _scale: 1,
      _targetX: mx,
      _targetY: my,
    });
  }

  /** Remove an agent by id. */
  removeAgent(id) {
    this._agents.delete(id);
    this._connections = this._connections.filter(
      (c) => c.id1 !== id && c.id2 !== id,
    );
  }

  /** Draw a glowing data-flow line between two agents. */
  connectAgents(id1, id2) {
    const exists = this._connections.some(
      (c) => (c.id1 === id1 && c.id2 === id2) || (c.id1 === id2 && c.id2 === id1),
    );
    if (exists) return;
    this._connections.push({
      id1,
      id2,
      particles: createConnectionParticles(),
    });
  }

  /** Update an agent's visual state. */
  setAgentState(id, state) {
    const a = this._agents.get(id);
    if (a) a.state = state;
  }

  /** Radial pulse from screen center. */
  pulseAll() {
    this._pulse = { startTime: this._time, duration: 1.2 };
  }

  /** Stop rendering and detach listeners. */
  destroy() {
    this._running = false;
    cancelAnimationFrame(this._rafId);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('mousemove', this._onPointerMove);
    window.removeEventListener('touchmove', this._onPointerMove);
  }

  // -- internals --------------------------------------------------------------

  _resize() {
    this._w = this._canvas.width = window.innerWidth;
    this._h = this._canvas.height = window.innerHeight;
    this._canvas.style.position = 'fixed';
    this._canvas.style.top = '0';
    this._canvas.style.left = '0';
    this._canvas.style.width = '100%';
    this._canvas.style.height = '100%';
    // redistribute stars so they stay spread across new size
    if (this._stars) {
      for (const s of this._stars) {
        s.x = Math.random() * this._w;
        s.y = Math.random() * this._h;
      }
    }
  }

  _handlePointer(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    this._pointer.x = (clientX / this._w - 0.5) * 2;  // –1…1
    this._pointer.y = (clientY / this._h - 0.5) * 2;
  }

  _tick(now) {
    if (!this._running) return;
    const dt = 1 / 60; // fixed-step feel; we don't accumulate real dt
    this._time = now * 0.001;
    const ctx = this._ctx;
    const w = this._w;
    const h = this._h;

    // -- clear ----------------------------------------------------------------
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    // -- stars ----------------------------------------------------------------
    this._drawStars(ctx, w, h);

    // -- connections ----------------------------------------------------------
    for (const conn of this._connections) {
      this._drawConnection(ctx, conn);
    }

    // -- agents ---------------------------------------------------------------
    for (const agent of this._agents.values()) {
      this._updateAgent(agent, dt);
      this._drawAgent(ctx, agent);
    }

    // -- pulse overlay --------------------------------------------------------
    if (this._pulse) {
      this._drawPulse(ctx, w, h);
    }

    this._rafId = requestAnimationFrame(this._tick);
  }

  // -- stars ------------------------------------------------------------------

  _drawStars(ctx, w, h) {
    const px = this._pointer.x;
    const py = this._pointer.y;
    const t = this._time;

    for (const s of this._stars) {
      const parallax = s.depth * 12;
      const sx = s.x + px * parallax;
      const sy = s.y + py * parallax;
      const flicker =
        s.alpha + Math.sin(t * s.twinkleSpeed * 1000 + s.twinklePhase) * 0.2;

      ctx.globalAlpha = Math.max(0, Math.min(1, flicker));
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // -- agents -----------------------------------------------------------------

  _updateAgent(a, dt) {
    const t = this._time;

    switch (a.state) {
      case 'idle': {
        // gentle hover
        a.x = a._targetX + Math.sin(t * 0.8 + a._phase) * 4;
        a.y = a._targetY + Math.cos(t * 0.6 + a._phase) * 4;
        a._scale = 1;
        break;
      }
      case 'thinking': {
        // pulse scale + orbit particles handled in draw
        a._scale = 1 + Math.sin(t * 4 + a._phase) * 0.15;
        a._orbitAngle += dt * 3;
        a.x = a._targetX + Math.sin(t * 0.8 + a._phase) * 3;
        a.y = a._targetY + Math.cos(t * 0.6 + a._phase) * 3;
        break;
      }
      case 'merging': {
        // find merge target (first connection)
        const connEntry = this._connections.find(
          (c) => c.id1 === a.id || c.id2 === a.id,
        );
        if (connEntry) {
          const targetId = connEntry.id1 === a.id ? connEntry.id2 : connEntry.id1;
          const target = this._agents.get(targetId);
          if (target) {
            a._targetX = lerp(a._targetX, target._targetX, dt * 1.2);
            a._targetY = lerp(a._targetY, target._targetY, dt * 1.2);
          }
        }
        a.x = a._targetX;
        a.y = a._targetY;
        a._scale = 1 + Math.sin(t * 5) * 0.1;
        // trail
        a._trail.push({ x: a.x, y: a.y, alpha: 1 });
        if (a._trail.length > 20) a._trail.shift();
        break;
      }
      case 'done': {
        a._scale = Math.max(0.2, a._scale - dt * 0.4);
        a.x = a._targetX;
        a.y = a._targetY;
        break;
      }
    }
  }

  _drawAgent(ctx, a) {
    const r = AGENT_RADIUS * a._scale;
    const [cr, cg, cb] = hexToRgb(a.color);

    // -- trail (merging) ------------------------------------------------------
    if (a.state === 'merging' && a._trail.length > 1) {
      for (let i = 0; i < a._trail.length; i++) {
        const tp = a._trail[i];
        tp.alpha -= 0.03;
        if (tp.alpha <= 0) continue;
        ctx.globalAlpha = tp.alpha * 0.5;
        ctx.fillStyle = a.color;
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, r * 0.3 * tp.alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // -- glow -----------------------------------------------------------------
    const glow = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, r * 2.5);
    glow.addColorStop(0, `rgba(${cr},${cg},${cb},0.35)`);
    glow.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(a.x, a.y, r * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // -- orb ------------------------------------------------------------------
    const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, r);
    if (a.state === 'done') {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, `rgba(${cr},${cg},${cb},0.6)`);
    } else {
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},1)`);
      grad.addColorStop(0.6, `rgba(${cr},${cg},${cb},0.5)`);
      grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
    ctx.fill();

    // -- thinking orbiting particles ------------------------------------------
    if (a.state === 'thinking') {
      const orbitR = r * 1.8;
      for (let i = 0; i < 3; i++) {
        const angle = a._orbitAngle + (i * Math.PI * 2) / 3;
        const ox = a.x + Math.cos(angle) * orbitR;
        const oy = a.y + Math.sin(angle) * orbitR;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},0.8)`;
        ctx.beginPath();
        ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // -- label ----------------------------------------------------------------
    if (a.name) {
      ctx.fillStyle = `rgba(${cr},${cg},${cb},0.7)`;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(a.name, a.x, a.y + r + 14);
    }
  }

  // -- connections ------------------------------------------------------------

  _drawConnection(ctx, conn) {
    const a1 = this._agents.get(conn.id1);
    const a2 = this._agents.get(conn.id2);
    if (!a1 || !a2) return;

    // glowing line
    const [cr, cg, cb] = hexToRgb(a1.color);
    ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.15)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(a1.x, a1.y);
    ctx.lineTo(a2.x, a2.y);
    ctx.stroke();

    // brighter core
    ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.06)`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(a1.x, a1.y);
    ctx.lineTo(a2.x, a2.y);
    ctx.stroke();

    // traveling particles
    for (const p of conn.particles) {
      p.t = (p.t + CONNECTION_PARTICLE_SPEED) % 1;
      const px = lerp(a1.x, a2.x, p.t);
      const py = lerp(a1.y, a2.y, p.t);
      const alpha = Math.sin(p.t * Math.PI); // fade at ends
      ctx.fillStyle = `rgba(255,255,255,${(alpha * 0.8).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // -- pulse ------------------------------------------------------------------

  _drawPulse(ctx, w, h) {
    const elapsed = this._time - this._pulse.startTime;
    const progress = elapsed / this._pulse.duration;
    if (progress > 1) {
      this._pulse = null;
      return;
    }
    const maxR = Math.hypot(w, h) * 0.5;
    const radius = progress * maxR;
    const alpha = (1 - progress) * 0.35;

    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, radius);
    grad.addColorStop(0, `rgba(123,47,247,0)`);
    grad.addColorStop(0.7, `rgba(123,47,247,0)`);
    grad.addColorStop(0.85, `rgba(123,47,247,${alpha.toFixed(3)})`);
    grad.addColorStop(1, `rgba(123,47,247,0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
