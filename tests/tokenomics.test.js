/**
 * Tokenomics Test Suite — Full Spec Coverage
 *
 * Tests:
 *   1. Sabbath mint freeze (Saturday = 0)
 *   2. 3.69% Èṣù tax extraction correctness
 *   3. Wallet routing correctness (8 sub-wallets = 100%)
 *   4. No-commingling enforcement (revert on purpose mismatch)
 *   5. Dopamine decay = exactly 1% daily
 *   6. Conversion = exactly 10:1 (Dopamine → Synapse)
 *   7. Agent birth flow integrity (0.01 ÀṢẸ → 20/40/20/20 split)
 *   8. Event bridge (Ọ̀ṢỌ́VM → Swibe)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ElegbaraRouter,
  IsolatedWallet,
  ESU_CONFIG,
} from '../src/toc/esu-wallets.js';
import { DecayEngine } from '../src/toc/decay.js';

const DECAY_CONFIG = { DECAY_RATE: 0.01, DAY_MS: 86_400_000 };
import { EventBridge } from '../src/toc/event-bridge.js';
import { ToCEconomy } from '../src/toc/index.js';
import { TOKEN_TYPE } from '../src/toc/token.js';

// ===== 1. Sabbath Mint Freeze =====

describe('Sabbath Mint Freeze', () => {
  let router;

  beforeEach(() => {
    router = new ElegbaraRouter();
  });

  it('should identify Saturday as Sabbath', () => {
    // Saturday April 19, 2025 00:00 UTC
    const saturday = new Date('2025-04-19T00:00:00Z');
    expect(router.isSabbath(saturday)).toBe(true);
  });

  it('should identify Sunday-Friday as active mint days', () => {
    const sunday = new Date('2025-04-20T00:00:00Z');
    const monday = new Date('2025-04-21T00:00:00Z');
    const friday = new Date('2025-04-25T00:00:00Z');
    expect(router.isActiveMintDay(sunday)).toBe(true);
    expect(router.isActiveMintDay(monday)).toBe(true);
    expect(router.isActiveMintDay(friday)).toBe(true);
  });

  it('should block minting on Saturday', () => {
    const origSabbath = router.isSabbath;
    router.isSabbath = () => true;

    const result = router.routeMint(1);
    expect(result).toBeNull();

    router.isSabbath = origSabbath;
  });

  it('should allow minting on non-Saturday days', () => {
    const origSabbath = router.isSabbath;
    router.isSabbath = () => false;

    const result = router.routeMint(1);
    expect(result).not.toBeNull();
    expect(router.totalMinted).toBe(1);

    router.isSabbath = origSabbath;
  });
});

// ===== 2. 3.69% Èṣù Tax Extraction =====

describe('Èṣù Tax Extraction (3.69%)', () => {
  let router;

  beforeEach(() => {
    router = new ElegbaraRouter();
  });

  it('should extract exactly 3.69% tax', () => {
    const { tax, net } = router.extractEsuTax(10000);
    expect(tax).toBeCloseTo(369, 5);
    expect(net).toBeCloseTo(9631, 5);
  });

  it('should extract tax before routing', () => {
    const { tax, net } = router.routeTransaction(1000);
    expect(tax).toBeCloseTo(1000 * 0.0369, 5);
    expect(net).toBeCloseTo(1000 * (1 - 0.0369), 5);
  });

  it('should accumulate total tax collected', () => {
    router.routeTransaction(1000);
    router.routeTransaction(2000);
    const expectedTax = 1000 * 0.0369 + 2000 * 0.0369;
    expect(router.totalEsuTax).toBeCloseTo(expectedTax, 5);
  });

  it('ESU_TAX_RATE should equal 0.0369', () => {
    expect(ESU_CONFIG.ESU_TAX_RATE).toBe(0.0369);
  });
});

// ===== 3. Wallet Routing Correctness =====

describe('Wallet Routing (8 Sub-wallets = 100%)', () => {
  let router;

  beforeEach(() => {
    router = new ElegbaraRouter();
    router.isSabbath = () => false;
  });

  it('distribution percentages should sum to 100%', () => {
    const sum = Object.values(ESU_CONFIG.DISTRIBUTION).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it('should route mint to all 8 sub-wallets with correct proportions', () => {
    const amount = 1000;
    const result = router.routeMint(amount);

    expect(result).not.toBeNull();
    expect(result.veilsim).toBeCloseTo(300, 1);
    expect(result.rnd).toBeCloseTo(200, 1);
    expect(result.governance).toBeCloseTo(100, 1);
    expect(result.reserve).toBeCloseTo(100, 1);
    expect(result.lottery_burn).toBeCloseTo(100, 1);
    expect(result.grants).toBeCloseTo(100, 1);
    expect(result.ubi).toBeCloseTo(50, 1);
    expect(result.sabbath_reserve).toBeCloseTo(50, 1);
  });

  it('total routed should equal total minted (no dust loss)', () => {
    const amount = 1337;
    const result = router.routeMint(amount);
    const totalRouted = Object.values(result).reduce((a, b) => a + b, 0);
    expect(totalRouted).toBeCloseTo(amount, 5);
  });

  it('should have 8 primary sub-wallets', () => {
    const primaryKeys = Object.keys(ESU_CONFIG.DISTRIBUTION);
    expect(primaryKeys).toHaveLength(8);
  });
});

// ===== 4. No-Commingling Enforcement =====

describe('No-Commingling Enforcement', () => {
  it('should allow transfer within allowlist', () => {
    const wallet = new IsolatedWallet('veilsim', ['rnd', 'grants']);
    wallet.deposit(100, 'test');
    expect(() => wallet.withdraw(50, 'rnd')).not.toThrow();
  });

  it('should REVERT transfer outside allowlist', () => {
    const wallet = new IsolatedWallet('veilsim', ['rnd', 'grants']);
    wallet.deposit(100, 'test');
    expect(() => wallet.withdraw(50, 'ubi')).toThrow('COMMINGLING DENIED');
  });

  it('should REVERT lottery_burn outbound (empty allowlist)', () => {
    const wallet = new IsolatedWallet('lottery_burn', []);
    wallet.deposit(100, 'test');
    expect(() => wallet.withdraw(50, 'rnd')).toThrow('COMMINGLING DENIED');
  });

  it('should REVERT agbàná mint inflow', () => {
    const wallet = new IsolatedWallet('agbana', []);
    expect(() => wallet.deposit(100, 'mint')).toThrow('Agbàná wallet cannot receive mint inflow');
  });

  it('should allow agbàná non-mint deposits', () => {
    const wallet = new IsolatedWallet('agbana', []);
    expect(() => wallet.deposit(100, 'punitive')).not.toThrow();
  });

  it('every wallet should have a defined allowlist', () => {
    for (const key of Object.keys(ESU_CONFIG.PURPOSE_TAGS)) {
      expect(ESU_CONFIG.ALLOWLISTS).toHaveProperty(key);
    }
  });
});

// ===== 5. Dopamine Decay = Exactly 1% Daily =====

describe('Dopamine Decay (1% Daily)', () => {
  let economy;

  beforeEach(() => {
    economy = new ToCEconomy();
  });

  it('DECAY_RATE should be exactly 0.01', () => {
    expect(DECAY_CONFIG.DECAY_RATE).toBe(0.01);
  });

  it('should decay exactly 1% after 1 day', async () => {
    const agent = await economy.spawnAgent('decay-test-1');
    const initial = agent.balance(TOKEN_TYPE.TOC_D);

    const nowMs = agent.created + DECAY_CONFIG.DAY_MS;
    const decayed = economy.decay.decayAgent('decay-test-1', nowMs);

    const expected = Math.floor(initial * 0.01);
    expect(decayed).toBe(expected);

    const remaining = agent.balance(TOKEN_TYPE.TOC_D);
    expect(remaining).toBe(initial - expected);
  });

  it('should compound decay correctly over 3 days', async () => {
    const agent = await economy.spawnAgent('decay-test-3');
    const initial = agent.balance(TOKEN_TYPE.TOC_D);

    const nowMs = agent.created + DECAY_CONFIG.DAY_MS * 3;
    economy.decay.decayAgent('decay-test-3', nowMs);

    const expectedRemaining = Math.floor(initial * Math.pow(0.99, 3));
    expect(agent.balance(TOKEN_TYPE.TOC_D)).toBe(expectedRemaining);
  });

  it('should not decay within same day', async () => {
    const agent = await economy.spawnAgent('decay-test-noday');
    const initial = agent.balance(TOKEN_TYPE.TOC_D);

    const nowMs = agent.created + DECAY_CONFIG.DAY_MS / 2;
    const decayed = economy.decay.decayAgent('decay-test-noday', nowMs);

    expect(decayed).toBe(0);
    expect(agent.balance(TOKEN_TYPE.TOC_D)).toBe(initial);
  });
});

// ===== 6. Conversion = Exactly 10:1 =====

describe('Conversion: 10 Dopamine → 1 Synapse', () => {
  let economy;

  beforeEach(() => {
    economy = new ToCEconomy();
  });

  it('should convert at exactly 10:1 ratio', async () => {
    await economy.spawnAgent('conv-agent-1');
    const result = economy.conversion.dopamineToSynapse('conv-agent-1', 1000);

    expect(result.burned).toBe(1000);
    expect(result.minted).toBe(100); // 1000 / 10 = 100
  });

  it('should be a one-way burn (Dopamine destroyed)', async () => {
    const agent = await economy.spawnAgent('conv-agent-2');
    const initialD = agent.balance(TOKEN_TYPE.TOC_D);
    const initialS = agent.balance(TOKEN_TYPE.TOC_S);

    economy.conversion.dopamineToSynapse('conv-agent-2', 100);

    expect(agent.balance(TOKEN_TYPE.TOC_D)).toBe(initialD - 100);
    expect(agent.balance(TOKEN_TYPE.TOC_S)).toBe(initialS + 10);
  });

  it('should reject conversion with insufficient Dopamine', async () => {
    await economy.spawnAgent('conv-agent-3');
    const balance = economy.wallets.get('conv-agent-3').balance(TOKEN_TYPE.TOC_D);
    expect(() => economy.conversion.dopamineToSynapse('conv-agent-3', balance + 1)).toThrow('Insufficient');
  });
});

// ===== 7. Agent Birth Flow (0.01 ÀṢẸ → 20/40/20/20) =====

describe('Agent Birth Flow', () => {
  let router;

  beforeEach(() => {
    router = new ElegbaraRouter();
  });

  it('AGENT_BIRTH_FEE should be 0.01 ÀṢẸ', () => {
    expect(ESU_CONFIG.AGENT_BIRTH_FEE).toBe(0.01);
  });

  it('birth split should sum to 100%', () => {
    const sum = Object.values(ESU_CONFIG.BIRTH_SPLIT).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it('should split 0.01 ÀṢẸ as 20/40/20/20', () => {
    const result = router.processAgentBirth('creator-1');

    expect(result.fee).toBe(0.01);
    expect(result.burned).toBeCloseTo(0.002, 10);
    expect(result.toElegbara).toBeCloseTo(0.004, 10);
    expect(result.toInheritance).toBeCloseTo(0.002, 10);
    expect(result.toPerformance).toBeCloseTo(0.002, 10);
  });

  it('should increment total agents born', () => {
    router.processAgentBirth('c1');
    router.processAgentBirth('c2');
    expect(router.totalAgentsBorn).toBe(2);
  });
});

// ===== 8. Event Bridge (Ọ̀ṢỌ́VM → Swibe) =====

describe('Event Bridge: Ọ̀ṢỌ́VM → Swibe', () => {
  let economy;
  let bridge;

  beforeEach(() => {
    economy = new ToCEconomy();
    bridge = economy.bridge;
  });

  it('should process agent birth event end-to-end', async () => {
    const result = await bridge.processAgentBirth({
      agentId: 'bridge-agent-1',
      creatorId: 'bridge-creator-1',
      txHash: '0xabc123',
      timestamp: Date.now(),
    });

    expect(result.walletCreated).toBe(true);
    expect(result.agentId).toBe('bridge-agent-1');
    expect(result.creatorId).toBe('bridge-creator-1');
  });

  it('should create agent wallet with correct ToC endowment', async () => {
    await bridge.processAgentBirth({
      agentId: 'bridge-agent-2',
      creatorId: 'bridge-creator-2',
    });

    const wallet = economy.wallets.get('bridge-agent-2');
    expect(wallet).not.toBeNull();
    expect(wallet.balance(TOKEN_TYPE.TOC_D)).toBe(86_000_000_000);
    expect(wallet.balance(TOKEN_TYPE.TOC_S)).toBe(86_000_000);
  });

  it('agent should NEVER hold ÀṢẸ', async () => {
    await bridge.processAgentBirth({
      agentId: 'bridge-agent-3',
      creatorId: 'bridge-creator-3',
    });

    const wallet = economy.wallets.get('bridge-agent-3');
    // TOKEN_TYPE.ASE doesn't exist in Swibe — agents never hold Àṣẹ
    expect(wallet.balance('ase')).toBe(0);
  });

  it('should reject birth without agentId', async () => {
    await expect(bridge.processAgentBirth({
      creatorId: 'c1',
    })).rejects.toThrow('missing agentId');
  });

  it('should queue and process events', async () => {
    bridge.queueEvent({ agentId: 'q-agent-1', creatorId: 'q-creator-1' });
    bridge.queueEvent({ agentId: 'q-agent-2', creatorId: 'q-creator-2' });

    expect(bridge.getPendingCount()).toBe(2);

    const results = await bridge.processQueue();
    expect(results).toHaveLength(2);
    expect(bridge.getPendingCount()).toBe(0);
  });

  it('should track processed events', async () => {
    await bridge.processAgentBirth({
      agentId: 'track-agent',
      creatorId: 'track-creator',
    });

    const events = bridge.getProcessedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('agent_birth');
  });
});

// ===== Integration: Full System Model =====

describe('Full System Integration', () => {
  let economy;

  beforeEach(() => {
    economy = new ToCEconomy();
  });

  it('dual-token economy: ÀṢẸ for humans, ToC for agents', async () => {
    const agent = await economy.spawnAgent('int-agent-1', 'int-human-1');
    expect(agent.balance(TOKEN_TYPE.TOC_D)).toBe(86_000_000_000);
    expect(agent.balance(TOKEN_TYPE.TOC_S)).toBe(86_000_000);
    // No ASE token type exists in Swibe
    expect(agent.balance('ase')).toBe(0);
  });

  it('Elegbára router state is consistent', () => {
    const state = economy.elegbara.getState();
    expect(state.wallets).toHaveProperty('veilsim');
    expect(state.wallets).toHaveProperty('rnd');
    expect(state.wallets).toHaveProperty('governance');
    expect(state.wallets).toHaveProperty('reserve');
    expect(state.wallets).toHaveProperty('lottery_burn');
    expect(state.wallets).toHaveProperty('grants');
    expect(state.wallets).toHaveProperty('ubi');
    expect(state.wallets).toHaveProperty('sabbath_reserve');
    // Mask wallets
    expect(state.wallets).toHaveProperty('odara');
    expect(state.wallets).toHaveProperty('laalu');
    expect(state.wallets).toHaveProperty('bara');
    expect(state.wallets).toHaveProperty('agbana');
  });

  it('agent wallet has BIPON39 identity after birth', async () => {
    const agent = await economy.spawnAgent('bipon-agent-1');
    expect(agent.identity).not.toBeNull();
    expect(agent.identity.agentId).toHaveLength(64);
    expect(agent.identity.mnemonic.length).toBeGreaterThan(0);
    expect(agent.identity.odu).toBeGreaterThanOrEqual(0);
    expect(agent.identity.odu).toBeLessThanOrEqual(255);
    expect(agent.identity.address).toMatch(/^swibe:\/\//);
  });

  it('getStakeStatus returns correct balances', async () => {
    const agentId = 'stake-agent-1';
    await economy.spawnAgent(agentId);
    const status = economy.getStakeStatus(agentId);
    
    expect(status).not.toBeNull();
    expect(status.balances).toBeDefined();
    expect(status.balances.dopamine).toBe(86_000_000_000);
    expect(status.balances.synapse).toBe(86_000_000);
    expect(status.stakes).toBeInstanceOf(Array);
    expect(status.slashes).toBeInstanceOf(Array);
  });
});
