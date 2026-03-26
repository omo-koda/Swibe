// Swibe Genesis Engine — Agent Swarm Simulation
// Simulates autonomous agents decomposing a wish into a living micro-app
import { processWish } from './genesis.js';

const ROLES = {
  orchestrator: { color: '#ffd93d', title: 'Orchestrator' },
  architect:    { color: '#7b2ff7', title: 'Architect' },
  builder:      { color: '#00d9ff', title: 'Builder' },
  validator:    { color: '#4ecdc4', title: 'Validator' },
  stylist:      { color: '#ff6b9d', title: 'Stylist' },
};

const DECOMPOSE_MESSAGES = [
  'Analyzing semantic intent…',
  'Mapping ontological structure…',
  'Extracting functional primitives…',
  'Resolving dependency graph…',
  'Projecting component topology…',
];

const BUILD_MESSAGES = [
  'Synthesizing DOM scaffold…',
  'Weaving interaction bindings…',
  'Injecting state machine…',
  'Compiling visual atoms…',
  'Bridging event channels…',
  'Rendering layout geometry…',
];

const VALIDATE_MESSAGES = [
  'Running accessibility audit…',
  'Checking responsive breakpoints…',
  'Verifying interaction contracts…',
  'Scanning for state leaks…',
  'Confirming render integrity…',
];

const POLISH_MESSAGES = [
  'Injecting animation keyframes…',
  'Tuning easing curves…',
  'Harmonizing color palette…',
  'Adding micro-interactions…',
  'Polishing typographic rhythm…',
];

const MERGE_MESSAGES = [
  'Merging component trees…',
  'Resolving namespace collisions…',
  'Flattening dependency graph…',
  'Sealing final artifact…',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms + Math.random() * ms * 0.5));
}

function agentPos(index, total) {
  const cx = 960, cy = 540, radius = 280;
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
}

function detectCategory(wish) {
  const w = wish.toLowerCase();
  if (/timer|clock|time|countdown|stopwatch/.test(w)) return 'clock';
  if (/color|palette|paint|hue|gradient/.test(w)) return 'color';
  if (/music|sound|beat|drum|synth|audio/.test(w)) return 'music';
  if (/game|play|score|bounce|pong/.test(w)) return 'game';
  if (/calc|math|add|subtract|equation/.test(w)) return 'calculator';
  if (/chart|data|graph|visual|stat/.test(w)) return 'chart';
  return 'greeting';
}

function componentNamesFor(category) {
  const map = {
    clock:      ['TimeDisplay', 'AnimatedDial', 'TickEngine', 'ThemeShell'],
    color:      ['ColorWheel', 'MixerEngine', 'SwatchGrid', 'HarmonyCalc'],
    music:      ['PadGrid', 'AudioEngine', 'SequenceLoop', 'WaveVisual'],
    game:       ['GameCanvas', 'PhysicsCore', 'ScoreBoard', 'InputHandler'],
    calculator: ['Display', 'KeyPad', 'CalcEngine', 'HistoryLog'],
    chart:      ['DataSource', 'AxisRenderer', 'BarPainter', 'LegendPanel'],
    greeting:   ['ParticleField', 'TextRenderer', 'MotionSensor', 'ThemeEngine'],
  };
  return map[category] || map.greeting;
}

// ── Micro-App Generators ─────────────────────────────────────

function generateClockApp(wish) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a1a;display:flex;align-items:center;justify-content:center;height:100vh;font-family:monospace;overflow:hidden}
.clock{text-align:center;color:#fff}.time{font-size:min(20vw,120px);font-weight:200;letter-spacing:8px;background:linear-gradient(135deg,#7b2ff7,#00d9ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.date{font-size:min(4vw,20px);color:#666;margin-top:16px}.ring{width:min(80vw,400px);height:min(80vw,400px);border:2px solid rgba(123,47,247,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;animation:spin 60s linear infinite;position:relative}
.dot{width:10px;height:10px;background:#7b2ff7;border-radius:50%;position:absolute;top:-5px;left:50%;box-shadow:0 0 20px #7b2ff7}
@keyframes spin{to{transform:rotate(360deg)}}</style></head>
<body><div class="clock"><div class="ring"><div class="dot"></div><div><div class="time" id="t"></div><div class="date" id="d"></div></div></div></div>
<script>function u(){const n=new Date();document.getElementById('t').textContent=n.toLocaleTimeString('en',{hour12:false});document.getElementById('d').textContent=n.toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric'});requestAnimationFrame(u)}u();</script></body></html>`;
}

function generateColorApp() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a1a;color:#fff;font-family:system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:24px}
.swatch{width:min(60vw,200px);height:min(60vw,200px);border-radius:24px;transition:background .3s;box-shadow:0 0 60px var(--c,#7b2ff7)44;background:var(--c,#7b2ff7)}
.sliders{display:flex;flex-direction:column;gap:12px;width:min(80vw,300px)}input[type=range]{-webkit-appearance:none;height:8px;border-radius:4px;outline:none}
.r{background:linear-gradient(90deg,#000,#f00)}.g{background:linear-gradient(90deg,#000,#0f0)}.b{background:linear-gradient(90deg,#000,#00f)}
input::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#fff;cursor:pointer}
.hex{font-size:24px;font-family:monospace;letter-spacing:2px}</style></head>
<body><div class="swatch" id="sw"></div><div class="hex" id="hx">#7B2FF7</div>
<div class="sliders"><input type="range" min="0" max="255" value="123" class="r" id="r"><input type="range" min="0" max="255" value="47" class="g" id="g"><input type="range" min="0" max="255" value="247" class="b" id="b"></div>
<script>const s=document.getElementById('sw'),h=document.getElementById('hx');function u(){const r=+document.getElementById('r').value,g=+document.getElementById('g').value,b=+document.getElementById('b').value;
const c='#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');s.style.setProperty('--c',c);s.style.background=c;h.textContent=c.toUpperCase()}
document.querySelectorAll('input').forEach(i=>i.addEventListener('input',u));u();</script></body></html>`;
}

function generateMusicApp() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a1a;color:#fff;font-family:system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:24px}
h2{font-weight:200;letter-spacing:4px;opacity:.6}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.pad{width:min(18vw,80px);height:min(18vw,80px);border-radius:16px;border:none;cursor:pointer;transition:transform .1s,box-shadow .1s;font-size:12px;color:#fff;font-weight:600}
.pad:active{transform:scale(0.9)}.pad.flash{box-shadow:0 0 40px var(--c)}</style></head>
<body><h2>GENESIS BEATS</h2><div class="grid" id="g"></div>
<script>const ctx=new(window.AudioContext||window.webkitAudioContext)();const notes=[261.6,293.7,329.6,349.2,392,440,493.9,523.3];
const colors=['#7b2ff7','#00d9ff','#4ecdc4','#ff6b9d','#ffd93d','#ff6348','#5f27cd','#01a3a4'];
const names=['C4','D4','E4','F4','G4','A4','B4','C5'];const g=document.getElementById('g');
notes.forEach((f,i)=>{const b=document.createElement('button');b.className='pad';b.textContent=names[i];b.style.background=colors[i];b.style.setProperty('--c',colors[i]);
b.addEventListener('pointerdown',()=>{const o=ctx.createOscillator(),gn=ctx.createGain();o.type='sine';o.frequency.value=f;gn.gain.setValueAtTime(0.3,ctx.currentTime);
gn.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.5);o.connect(gn);gn.connect(ctx.destination);o.start();o.stop(ctx.currentTime+0.5);
b.classList.add('flash');setTimeout(()=>b.classList.remove('flash'),200)});g.appendChild(b)});</script></body></html>`;
}

function generateGameApp() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a1a;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:monospace;color:#fff;gap:16px}
canvas{border-radius:16px;background:#111;cursor:pointer}.score{font-size:24px;letter-spacing:4px;color:#7b2ff7}</style></head>
<body><div class="score">SCORE: <span id="sc">0</span></div><canvas id="c" width="400" height="400"></canvas>
<script>const c=document.getElementById('c'),x=c.getContext('2d');let score=0,balls=[];const sc=document.getElementById('sc');
function spawn(){balls.push({x:Math.random()*360+20,y:Math.random()*360+20,r:20+Math.random()*20,vx:(Math.random()-0.5)*3,vy:(Math.random()-0.5)*3,
color:['#7b2ff7','#00d9ff','#4ecdc4','#ff6b9d','#ffd93d'][Math.floor(Math.random()*5)],alive:true})}
for(let i=0;i<5;i++)spawn();
c.addEventListener('click',e=>{const rect=c.getBoundingClientRect();const mx=e.clientX-rect.left,my=e.clientY-rect.top;
balls.forEach(b=>{if(b.alive&&Math.hypot(b.x-mx,b.y-my)<b.r){b.alive=false;score+=10;sc.textContent=score;spawn()}})});
function draw(){x.clearRect(0,0,400,400);balls.forEach(b=>{if(!b.alive)return;b.x+=b.vx;b.y+=b.vy;
if(b.x<b.r||b.x>400-b.r)b.vx*=-1;if(b.y<b.r||b.y>400-b.r)b.vy*=-1;
x.beginPath();x.arc(b.x,b.y,b.r,0,Math.PI*2);x.fillStyle=b.color;x.shadowBlur=20;x.shadowColor=b.color;x.fill();x.shadowBlur=0});
requestAnimationFrame(draw)}draw();</script></body></html>`;
}

function generateCalcApp() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a1a;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui}
.calc{background:#111;border-radius:24px;padding:24px;box-shadow:0 0 60px rgba(123,47,247,0.2);width:min(90vw,320px)}
.display{background:#0a0a1a;border-radius:12px;padding:20px;text-align:right;font-size:32px;color:#fff;margin-bottom:16px;min-height:70px;word-break:break-all;font-family:monospace}
.keys{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}button{padding:16px;border:none;border-radius:12px;font-size:18px;cursor:pointer;transition:transform .1s;background:#1a1a2e;color:#fff}
button:active{transform:scale(.95)}button.op{background:#7b2ff7}button.eq{background:#00d9ff;color:#0a0a1a;font-weight:700}button.cl{background:#ff6b9d}</style></head>
<body><div class="calc"><div class="display" id="d">0</div><div class="keys">
<button class="cl" onclick="cl()">C</button><button onclick="ap('(')">(</button><button onclick="ap(')')">)</button><button class="op" onclick="ap('/')">÷</button>
<button onclick="ap('7')">7</button><button onclick="ap('8')">8</button><button onclick="ap('9')">9</button><button class="op" onclick="ap('*')">×</button>
<button onclick="ap('4')">4</button><button onclick="ap('5')">5</button><button onclick="ap('6')">6</button><button class="op" onclick="ap('-')">−</button>
<button onclick="ap('1')">1</button><button onclick="ap('2')">2</button><button onclick="ap('3')">3</button><button class="op" onclick="ap('+')">+</button>
<button onclick="ap('0')">0</button><button onclick="ap('.')">.</button><button onclick="del()">⌫</button><button class="eq" onclick="ev()">=</button>
</div></div>
<script>let s='';const d=document.getElementById('d');function ap(c){s+=c;d.textContent=s||'0'}function cl(){s='';d.textContent='0'}function del(){s=s.slice(0,-1);d.textContent=s||'0'}
function ev(){try{d.textContent=Function('"use strict";return ('+s+')')();s=d.textContent}catch{d.textContent='Error';s=''}}</script></body></html>`;
}

function generateChartApp() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a1a;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui}
canvas{border-radius:16px;background:#111}</style></head>
<body><canvas id="c" width="600" height="400"></canvas>
<script>const c=document.getElementById('c'),x=c.getContext('2d');const colors=['#7b2ff7','#00d9ff','#4ecdc4','#ff6b9d','#ffd93d'];
let data=Array.from({length:8},()=>Math.random()*200+50);const labels=['Mon','Tue','Wed','Thu','Fri','Sat','Sun','Avg'];
let targets=[...data];setInterval(()=>{targets=targets.map(()=>Math.random()*200+50)},2000);
function draw(){x.clearRect(0,0,600,400);const bw=50,gap=20,baseY=360,startX=60;
data=data.map((v,i)=>v+(targets[i]-v)*0.05);
data.forEach((v,i)=>{const bx=startX+i*(bw+gap);const col=colors[i%colors.length];
x.fillStyle=col;x.shadowBlur=15;x.shadowColor=col;x.beginPath();x.roundRect(bx,baseY-v,bw,v,8);x.fill();x.shadowBlur=0;
x.fillStyle='#666';x.font='12px system-ui';x.textAlign='center';x.fillText(labels[i],bx+bw/2,baseY+20);
x.fillStyle='#fff';x.fillText(Math.round(v),bx+bw/2,baseY-v-8)});
x.fillStyle='#333';x.font='14px system-ui';x.textAlign='left';x.fillText('LIVE DATA',20,30);requestAnimationFrame(draw)}draw();</script></body></html>`;
}

function generateGreetingApp(wish) {
  const safeWish = wish.replace(/[<>"'&]/g, '');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a1a;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100vh}
canvas{position:fixed;top:0;left:0;z-index:0}.msg{position:relative;z-index:1;text-align:center;padding:40px}
h1{font-family:system-ui;font-weight:200;font-size:min(6vw,48px);color:#fff;letter-spacing:2px;line-height:1.4;
background:linear-gradient(135deg,#7b2ff7,#00d9ff,#ff6b9d);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-size:200% 200%;animation:grad 4s ease infinite}
p{color:#666;font-family:monospace;margin-top:16px;font-size:14px}@keyframes grad{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}</style></head>
<body><canvas id="c"></canvas><div class="msg"><h1>${safeWish}</h1><p>born from the genesis engine</p></div>
<script>const c=document.getElementById('c'),x=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;
const ps=Array.from({length:150},()=>({x:Math.random()*c.width,y:Math.random()*c.height,r:Math.random()*3,vx:(Math.random()-.5)*.5,vy:(Math.random()-.5)*.5,
color:['#7b2ff7','#00d9ff','#4ecdc4','#ff6b9d','#ffd93d'][Math.floor(Math.random()*5)]}));
let mx=c.width/2,my=c.height/2;document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY});
window.addEventListener('deviceorientation',e=>{if(e.gamma!=null){mx=c.width/2+e.gamma*5;my=c.height/2+e.beta*5}});
function draw(){x.fillStyle='rgba(10,10,26,0.15)';x.fillRect(0,0,c.width,c.height);
ps.forEach(p=>{const dx=mx-p.x,dy=my-p.y,d=Math.hypot(dx,dy);if(d<200){p.vx+=dx/d*0.02;p.vy+=dy/d*0.02}
p.x+=p.vx;p.y+=p.vy;p.vx*=0.99;p.vy*=0.99;
if(p.x<0)p.x=c.width;if(p.x>c.width)p.x=0;if(p.y<0)p.y=c.height;if(p.y>c.height)p.y=0;
x.beginPath();x.arc(p.x,p.y,p.r,0,Math.PI*2);x.fillStyle=p.color;x.shadowBlur=10;x.shadowColor=p.color;x.fill();x.shadowBlur=0});
requestAnimationFrame(draw)}draw();window.addEventListener('resize',()=>{c.width=innerWidth;c.height=innerHeight});</script></body></html>`;
}

function generateApp(wish) {
  const cat = detectCategory(wish);
  switch (cat) {
    case 'clock':      return generateClockApp(wish);
    case 'color':      return generateColorApp();
    case 'music':      return generateMusicApp();
    case 'game':       return generateGameApp();
    case 'calculator': return generateCalcApp();
    case 'chart':      return generateChartApp();
    default:           return generateGreetingApp(wish);
  }
}

// ── Agent Swarm ──────────────────────────────────────────────

export class AgentSwarm extends EventTarget {
  constructor() {
    super();
    this.agents = [];
    this.running = false;
  }

  _emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail }));
  }

  _spawn(role, index, total) {
    const { x, y } = agentPos(index, total);
    const info = ROLES[role];
    const agent = {
      id: crypto.randomUUID(),
      name: `${info.title}-${Math.random().toString(36).slice(2, 6)}`,
      role,
      x,
      y,
      color: info.color,
      state: 'idle',
    };
    this.agents.push(agent);
    this._emit('agent-born', { agent });
    this._emit('log', { message: `⚡ ${info.title} agent spawned: ${agent.name}`, type: 'info' });
    return agent;
  }

  getAgents() {
    return [...this.agents];
  }

  async genesis(wish) {
    if (this.running) return;
    this.running = true;
    this.agents = [];

    // Try real LLM pipeline via Ollama; fall back to regex detection
    let llmSource = null;
    try {
      const llmResult = await processWish(wish);
      if (llmResult.ollamaAvailable && llmResult.swibeSource) {
        llmSource = llmResult.swibeSource;
        this._emit('log', { message: '🤖 Ollama connected — live LLM generation active', type: 'success' });
      } else if (!llmResult.ollamaAvailable) {
        this._emit('log', {
          message: '💡 Start Ollama for live generation: ollama serve',
          type: 'warn'
        });
      }
    } catch (_) { /* silent fallback */ }

    const category = llmSource ? 'llm-generated' : detectCategory(wish);
    const components = componentNamesFor(llmSource ? 'greeting' : category);
    const totalAgents = 3 + components.length; // orch + arch + validator + stylist + builders

    // ── Phase 1: DECOMPOSE ──
    this._emit('phase-change', { phase: 'DECOMPOSE', description: 'Orchestrator analyzing wish…' });

    const orch = this._spawn('orchestrator', 0, totalAgents);
    await delay(1200);

    const arch = this._spawn('architect', 1, totalAgents);
    this._emit('agent-connect', { from: orch.id, to: arch.id });
    await delay(800);

    for (const msg of DECOMPOSE_MESSAGES.slice(0, 3)) {
      arch.state = 'thinking';
      this._emit('agent-think', { agentId: arch.id, message: msg });
      await delay(700);
    }

    this._emit('log', { message: `📐 Decomposed into ${components.length} components: ${components.join(', ')}`, type: 'success' });
    await delay(600);

    // ── Phase 2: BUILD ──
    this._emit('phase-change', { phase: 'BUILD', description: 'Builder agents assembling components…' });

    const builders = [];
    for (let i = 0; i < components.length; i++) {
      const b = this._spawn('builder', 2 + i, totalAgents);
      builders.push(b);
      this._emit('agent-connect', { from: arch.id, to: b.id });
      await delay(500);

      b.state = 'thinking';
      const msgs = BUILD_MESSAGES.sort(() => Math.random() - 0.5).slice(0, 2);
      for (const m of msgs) {
        this._emit('agent-think', { agentId: b.id, message: `[${components[i]}] ${m}` });
        await delay(600 + Math.random() * 800);
      }
      this._emit('log', { message: `🔧 ${components[i]} assembled`, type: 'info' });
    }

    arch.state = 'done';
    this._emit('agent-done', { agentId: arch.id });

    // ── Phase 3: VALIDATE ──
    this._emit('phase-change', { phase: 'VALIDATE', description: 'Validator checking integrity…' });

    const val = this._spawn('validator', totalAgents - 2, totalAgents);
    for (const b of builders) {
      this._emit('agent-connect', { from: val.id, to: b.id });
    }
    await delay(600);

    for (const msg of VALIDATE_MESSAGES.slice(0, 3)) {
      val.state = 'thinking';
      this._emit('agent-think', { agentId: val.id, message: msg });
      await delay(800);
    }
    this._emit('log', { message: '✅ All components validated', type: 'success' });
    val.state = 'done';
    this._emit('agent-done', { agentId: val.id });

    // ── Phase 4: POLISH ──
    this._emit('phase-change', { phase: 'POLISH', description: 'Stylist adding visual magic…' });

    const sty = this._spawn('stylist', totalAgents - 1, totalAgents);
    this._emit('agent-connect', { from: val.id, to: sty.id });
    await delay(500);

    for (const msg of POLISH_MESSAGES.slice(0, 3)) {
      sty.state = 'thinking';
      this._emit('agent-think', { agentId: sty.id, message: msg });
      await delay(700);
    }
    sty.state = 'done';
    this._emit('agent-done', { agentId: sty.id });
    this._emit('log', { message: '🎨 Visual polish complete', type: 'success' });

    // ── Phase 5: MERGE ──
    this._emit('phase-change', { phase: 'MERGE', description: 'Orchestrator merging all artifacts…' });

    for (const a of this.agents) {
      if (a.id !== orch.id) {
        this._emit('agent-connect', { from: a.id, to: orch.id });
        a.state = 'merging';
        this._emit('agent-merge', { agentId: a.id });
        await delay(400);
      }
    }

    for (const msg of MERGE_MESSAGES) {
      orch.state = 'thinking';
      this._emit('agent-think', { agentId: orch.id, message: msg });
      await delay(600);
    }

    // ── Phase 6: GENESIS ──
    this._emit('phase-change', { phase: 'GENESIS', description: 'Birth.' });
    await delay(1000);

    for (const a of this.agents) {
      a.state = 'done';
      this._emit('agent-done', { agentId: a.id });
    }

    // Use LLM-generated source if available, otherwise regex fallback
    const html = llmSource
      ? generateGreetingApp(`${wish}\n\n<pre style="font-size:11px;opacity:.5">${llmSource.substring(0, 200)}…</pre>`)
      : generateApp(wish);

    this._emit('log', { message: '🌟 Genesis complete — your creation lives.', type: 'success' });
    this._emit('genesis-complete', { html });

    this.running = false;
  }
}
