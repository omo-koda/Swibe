/**
 * Swibe ToC Module — Phase 7: Complete Tokenomics
 * Three-token economy: Àṣẹ (human) → Dopamine (agent) → Synapse (agent commerce)
 * Every agent born with 86B Dopamine + 86M Synapse (neural layer mapping)
 */

export { TOKEN_TYPE, TOKEN_CONFIG, TokenLedger } from './token.js';
export { Wallet, WalletRegistry } from './wallet.js';
export { ConversionEngine } from './conversion.js';
export { StakingEngine } from './staking.js';
export { RoyaltyEngine } from './royalty.js';
export { EscrowEngine } from './escrow.js';

import { WalletRegistry } from './wallet.js';
import { ConversionEngine } from './conversion.js';
import { StakingEngine } from './staking.js';
import { RoyaltyEngine } from './royalty.js';
import { EscrowEngine } from './escrow.js';

export class ToCEconomy {
  constructor() {
    this.wallets = new WalletRegistry();
    this.conversion = new ConversionEngine(this.wallets);
    this.staking = new StakingEngine(this.wallets);
    this.royalty = new RoyaltyEngine(this.wallets);
    this.escrow = new EscrowEngine(this.wallets, this.royalty);
  }

  spawnAgent(agentId, creatorId = null, royaltyPercent = 10) {
    const wallet = this.wallets.createAgent(agentId);
    if (creatorId) {
      this.royalty.registerCreator(creatorId, agentId, { percentage: royaltyPercent });
    }
    return wallet;
  }

  registerHuman(userId, initialAse = 0) {
    const wallet = this.wallets.createHuman(userId);
    if (initialAse > 0) {
      wallet.receive('ase', initialAse);
    }
    return wallet;
  }

  postJob(humanId, agentId, aseAmount, description = '') {
    return this.escrow.create(humanId, agentId, aseAmount, description);
  }

  completeJob(escrowId) {
    return this.escrow.release(escrowId);
  }

  getStatus() {
    return {
      supply: this.wallets.getSupply(),
      burned: this.wallets.getBurned(),
      activeEscrows: this.escrow.getActive().length,
      totalStaked: {
        ase: this.staking.totalStaked('ase'),
        toc_s: this.staking.totalStaked('toc_s'),
      },
    };
  }
}

export function tocFromAST(node) {
  return new ToCEconomy();
}
