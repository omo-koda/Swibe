/**
 * Real Sui & Walrus Integration for Swibe
 * 
 * Handles:
 * 1. On-chain receipts (Sui events)
 * 2. Soul Token minting (Sui NFTs)
 * 3. Walrus storage (Decentralized blob storage)
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair as _Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import _crypto from 'node:crypto';

export class SuiClientWrapper {
  constructor(config = {}) {
    this.network = config.network || 'testnet';
    this.client = new SuiClient({ url: config.url || getFullnodeUrl(this.network) });
    this.keypair = config.keypair || null;
    this.packageId = config.packageId || null; // The omokoda::soul package
  }

  /**
   * Emit an on-chain receipt via Sui Event
   */
  async emitReceipt(hash, agentAddress) {
    if (!this.keypair) {
        console.warn('[SUI] No keypair provided, simulating receipt');
        return { mock: true, hash, agent: agentAddress };
    }

    const txb = new TransactionBlock();
    txb.moveCall({
      target: `${this.packageId}::soul::receipt`,
      arguments: [
        txb.pure(Array.from(Buffer.from(hash, 'hex'))),
        txb.pure(agentAddress || this.keypair.getPublicKey().toSuiAddress()),
      ],
    });

    try {
      const result = await this.client.signAndExecuteTransactionBlock({
        signer: this.keypair,
        transactionBlock: txb,
      });
      return result;
    } catch (e) {
      console.error('[SUI] Receipt failed:', e.message);
      throw e;
    }
  }

  /**
   * Mint a Soul Token (NFT)
   */
  async mintSoulToken(recipient, value = 1) {
    if (!this.keypair) {
        console.warn('[SUI] No keypair provided, simulating mint');
        return { mock: true, recipient, value };
    }

    const txb = new TransactionBlock();
    txb.moveCall({
      target: `${this.packageId}::soul::mint`,
      arguments: [
        txb.pure(recipient || this.keypair.getPublicKey().toSuiAddress()),
        txb.pure(value),
      ],
    });

    try {
      const result = await this.client.signAndExecuteTransactionBlock({
        signer: this.keypair,
        transactionBlock: txb,
      });
      return result;
    } catch (e) {
      console.error('[SUI] Mint failed:', e.message);
      throw e;
    }
  }
}

export class WalrusStorage {
  constructor(config = {}) {
    this.publisherUrl = config.publisherUrl || 'https://publisher-devnet.walrus.site';
    this.aggregatorUrl = config.aggregatorUrl || 'https://aggregator-devnet.walrus.site';
  }

  /**
   * Store a blob on Walrus
   * @param {string|Buffer} data 
   * @param {number} epochs 
   */
  async store(data, epochs = 1) {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    
    try {
      const res = await fetch(`${this.publisherUrl}/v1/store?epochs=${epochs}`, {
        method: 'PUT',
        body: buffer,
      });

      if (!res.ok) {
        throw new Error(`Walrus store error: ${res.status} ${res.statusText}`);
      }

      const result = await res.json();
      // Walrus returns blobId in various formats depending on version
      return result.newlyCreated?.blobObject?.blobId || result.blobId;
    } catch (e) {
      console.error('[WALRUS] Store failed:', e.message);
      throw e;
    }
  }

  /**
   * Retrieve a blob from Walrus
   */
  async retrieve(blobId) {
    try {
      const res = await fetch(`${this.aggregatorUrl}/v1/${blobId}`);
      if (!res.ok) {
        throw new Error(`Walrus retrieve error: ${res.status} ${res.statusText}`);
      }
      return await res.text();
    } catch (e) {
      console.error('[WALRUS] Retrieve failed:', e.message);
      throw e;
    }
  }
}
