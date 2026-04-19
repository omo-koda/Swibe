/**
 * UBI Verification & Distribution Engine
 *
 * User eligible ONLY IF:
 *   1. Verified World ID flag = true
 *   2. Activity within last 7 days
 *
 * Distribution:
 *   ubi_share = total_ubi_pool / eligible_users
 *
 * MUST:
 *   - Exclude inactive users
 *   - Exclude unverified users
 *   - Deterministic ordering
 */

import { EventEmitter } from 'events';

const ACTIVITY_WINDOW_DAYS = 7;
const ACTIVITY_WINDOW_MS = ACTIVITY_WINDOW_DAYS * 86_400_000;

export class UBIEngine extends EventEmitter {
  constructor() {
    super();
    this.users = new Map(); // userId → { isVerified, lastActiveTimestamp }
    this.distributions = [];
  }

  /**
   * Register or update a user's verification and activity status.
   */
  registerUser(userId, isVerified = false, lastActiveTimestamp = Date.now()) {
    this.users.set(userId, {
      userId,
      isVerified,
      lastActiveTimestamp,
      registeredAt: this.users.has(userId)
        ? this.users.get(userId).registeredAt
        : Date.now(),
    });
    this.emit('user_registered', { userId, isVerified });
  }

  /**
   * Update user's last active timestamp.
   */
  recordActivity(userId, timestamp = Date.now()) {
    const user = this.users.get(userId);
    if (!user) throw new Error(`User not found: ${userId}`);
    user.lastActiveTimestamp = timestamp;
    this.emit('activity_recorded', { userId, timestamp });
  }

  /**
   * Mark user as World ID verified.
   */
  verifyUser(userId) {
    const user = this.users.get(userId);
    if (!user) throw new Error(`User not found: ${userId}`);
    user.isVerified = true;
    this.emit('user_verified', { userId });
  }

  /**
   * Get all eligible users for UBI distribution.
   * Eligible = verified AND active within last 7 days.
   */
  getEligibleUsers(nowMs = Date.now()) {
    const cutoff = nowMs - ACTIVITY_WINDOW_MS;
    const eligible = [];

    for (const [userId, user] of this.users) {
      if (user.isVerified && user.lastActiveTimestamp >= cutoff) {
        eligible.push(user);
      }
    }

    // Deterministic ordering
    eligible.sort((a, b) => a.userId.localeCompare(b.userId));
    return eligible;
  }

  /**
   * Distribute UBI pool to eligible users.
   * Equal split: ubi_share = pool / eligible_users
   *
   * @param {number} pool - Total ÀṢẸ in UBI pool
   * @param {number} nowMs - Current timestamp for eligibility check
   * @returns {object} Distribution result
   */
  distribute(pool, nowMs = Date.now()) {
    if (pool <= 0) throw new Error('UBI pool must be positive');

    const eligible = this.getEligibleUsers(nowMs);
    if (eligible.length === 0) {
      const result = {
        epoch: this.distributions.length,
        pool,
        eligibleCount: 0,
        perPerson: 0,
        payouts: [],
        excluded: { inactive: 0, unverified: 0 },
        timestamp: nowMs,
      };
      this.distributions.push(result);
      this.emit('distribution', result);
      return result;
    }

    const perPerson = Math.floor((pool / eligible.length) * 1e6) / 1e6;

    // Count exclusions
    let inactive = 0;
    let unverified = 0;
    const cutoff = nowMs - ACTIVITY_WINDOW_MS;

    for (const [, user] of this.users) {
      if (!user.isVerified) unverified++;
      else if (user.lastActiveTimestamp < cutoff) inactive++;
    }

    const payouts = eligible.map(user => ({
      userId: user.userId,
      amount: perPerson,
      isVerified: true,
      daysSinceActive: Math.floor((nowMs - user.lastActiveTimestamp) / 86_400_000),
    }));

    // Last user gets remainder to avoid dust loss
    if (payouts.length > 0) {
      const distributed = perPerson * (payouts.length - 1);
      payouts[payouts.length - 1].amount = Math.floor((pool - distributed) * 1e6) / 1e6;
    }

    const result = {
      epoch: this.distributions.length,
      pool,
      eligibleCount: eligible.length,
      perPerson,
      payouts,
      excluded: { inactive, unverified },
      timestamp: nowMs,
    };

    this.distributions.push(result);
    this.emit('distribution', result);
    return result;
  }

  /**
   * Check if a specific user is eligible.
   */
  isEligible(userId, nowMs = Date.now()) {
    const user = this.users.get(userId);
    if (!user) return false;
    if (!user.isVerified) return false;
    const cutoff = nowMs - ACTIVITY_WINDOW_MS;
    return user.lastActiveTimestamp >= cutoff;
  }

  getDistributionHistory(limit = 50) {
    return this.distributions.slice(-limit);
  }

  getUserCount() {
    return this.users.size;
  }

  getVerifiedCount() {
    let count = 0;
    for (const [, user] of this.users) {
      if (user.isVerified) count++;
    }
    return count;
  }
}

export const UBI_CONFIG = { ACTIVITY_WINDOW_DAYS, ACTIVITY_WINDOW_MS };
