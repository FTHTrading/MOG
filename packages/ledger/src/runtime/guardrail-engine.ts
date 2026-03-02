/**
 * @sovereign/ledger — Guardrail Engine (LIVE)
 *
 * Real enforcement of capital operation guardrails.
 * Every mint, burn, allocation, redemption checks these gates BEFORE execution.
 *
 * Guardrails:
 *   1. DAILY_MINT_CAP — Max minting per 24h
 *   2. FROZEN_ACCOUNT — Block operations on frozen accounts
 *   3. DOUBLE_REDEMPTION — Prevent duplicate redemption requests
 *   4. ALLOCATION_LIMIT — Max allocation per strategy
 *   5. CONCENTRATION_LIMIT — Max % in any single position
 *   6. VELOCITY_CHECK — Rate limiting on operations
 *   7. RESERVE_RATIO — Reserve must be >= 100% of outstanding
 */

import { GuardrailType } from '../types';
import type { GuardrailCheck, GuardrailResult } from '../types';
import type { DurableStore } from './store';
import { STORE_COLLECTIONS, STORE_SNAPSHOTS } from './store';

// ─── Config ────────────────────────────────────────────────────────────────────

export interface GuardrailConfig {
  dailyMintCapUsd: number;
  allocationLimitUsd: number;
  concentrationLimitPct: number;
  velocityWindowMs: number;
  velocityMaxOps: number;
  reserveRatioMin: number; // 1.0 = 100%
}

const DEFAULT_CONFIG: GuardrailConfig = {
  dailyMintCapUsd: 10_000_000, // $10M daily
  allocationLimitUsd: 5_000_000, // $5M per strategy
  concentrationLimitPct: 25, // 25% max
  velocityWindowMs: 60_000, // 1 minute
  velocityMaxOps: 10,
  reserveRatioMin: 1.0, // 100%
};

// ─── Engine ────────────────────────────────────────────────────────────────────

export class GuardrailEngine {
  private config: GuardrailConfig;
  private frozenAccounts: Set<string> = new Set();
  private dailyMintTotal: number = 0;
  private dailyMintResetAt: number = Date.now() + 86_400_000;
  private recentRedemptionIds: Set<string> = new Set();
  private operationTimestamps: number[] = [];
  private totalMinted: number = 0;
  private totalReserves: number = 0;
  private results: GuardrailResult[] = [];
  private store: DurableStore | null;

  constructor(config?: Partial<GuardrailConfig>, store?: DurableStore) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.store = store ?? null;
  }

  /**
   * Restore state from durable store. Call once before operations.
   */
  async restore(): Promise<void> {
    if (!this.store) return;

    // Restore guardrail results
    const results = await this.store.loadAll(STORE_COLLECTIONS.GUARDRAIL_RESULTS) as GuardrailResult[];
    if (results.length > 0) {
      this.results = results;
    }

    // Restore mutable state
    const state = await this.store.loadSnapshot(STORE_SNAPSHOTS.GUARDRAIL_STATE) as {
      frozenAccounts: string[];
      dailyMintTotal: number;
      dailyMintResetAt: number;
      recentRedemptionIds: string[];
      totalMinted: number;
      totalReserves: number;
    } | null;

    if (state) {
      this.frozenAccounts = new Set(state.frozenAccounts);
      this.dailyMintTotal = state.dailyMintTotal;
      this.dailyMintResetAt = state.dailyMintResetAt;
      this.recentRedemptionIds = new Set(state.recentRedemptionIds);
      this.totalMinted = state.totalMinted;
      this.totalReserves = state.totalReserves;
    }

    console.error(`[GUARDRAILS] Restored ${results.length} results, ${this.frozenAccounts.size} frozen accounts`);
  }

  /**
   * Persist mutable guardrail state to store.
   */
  private async persistState(): Promise<void> {
    if (!this.store) return;
    await this.store.saveSnapshot(STORE_SNAPSHOTS.GUARDRAIL_STATE, {
      frozenAccounts: [...this.frozenAccounts],
      dailyMintTotal: this.dailyMintTotal,
      dailyMintResetAt: this.dailyMintResetAt,
      recentRedemptionIds: [...this.recentRedemptionIds],
      totalMinted: this.totalMinted,
      totalReserves: this.totalReserves,
    });
  }

  /**
   * Check a guardrail. Returns pass/fail with context.
   */
  async check(params: GuardrailCheck): Promise<GuardrailResult> {
    const timestamp = new Date().toISOString();

    let result: GuardrailResult;

    switch (params.type) {
      case GuardrailType.DAILY_MINT_CAP:
        result = this.checkDailyMintCap(params, timestamp);
        break;
      case GuardrailType.FROZEN_ACCOUNT:
        result = this.checkFrozenAccount(params, timestamp);
        break;
      case GuardrailType.DOUBLE_REDEMPTION:
        result = this.checkDoubleRedemption(params, timestamp);
        break;
      case GuardrailType.ALLOCATION_LIMIT:
        result = this.checkAllocationLimit(params, timestamp);
        break;
      case GuardrailType.CONCENTRATION_LIMIT:
        result = this.checkConcentrationLimit(params, timestamp);
        break;
      case GuardrailType.VELOCITY_CHECK:
        result = this.checkVelocity(params, timestamp);
        break;
      case GuardrailType.RESERVE_RATIO:
        result = this.checkReserveRatio(params, timestamp);
        break;
      default:
        result = {
          passed: false,
          type: params.type,
          message: `Unknown guardrail type: ${params.type}`,
          timestamp,
        };
    }

    this.results.push(result);

    // Persist result
    if (this.store) {
      this.store.append(STORE_COLLECTIONS.GUARDRAIL_RESULTS, [result]).catch(() => {});
    }

    return result;
  }

  // ─── Administration ──────────────────────────────────────────────────────

  freezeAccount(accountId: string): void {
    this.frozenAccounts.add(accountId);
    this.persistState().catch(() => {});
  }

  unfreezeAccount(accountId: string): void {
    this.frozenAccounts.delete(accountId);
    this.persistState().catch(() => {});
  }

  recordMint(amountUsd: number): void {
    this.resetDailyIfNeeded();
    this.dailyMintTotal += amountUsd;
    this.totalMinted += amountUsd;
    this.persistState().catch(() => {});
  }

  recordReserve(amountUsd: number): void {
    this.totalReserves = amountUsd;
    this.persistState().catch(() => {});
  }

  recordRedemptionId(redemptionId: string): void {
    this.recentRedemptionIds.add(redemptionId);
    this.persistState().catch(() => {});
  }

  recordOperation(): void {
    this.operationTimestamps.push(Date.now());
  }

  getResults(): GuardrailResult[] {
    return [...this.results];
  }

  getStatus(): {
    frozenAccounts: number;
    dailyMintUsed: number;
    dailyMintCap: number;
    reserveRatio: number;
    totalChecks: number;
    passRate: number;
  } {
    const passed = this.results.filter((r) => r.passed).length;
    return {
      frozenAccounts: this.frozenAccounts.size,
      dailyMintUsed: this.dailyMintTotal,
      dailyMintCap: this.config.dailyMintCapUsd,
      reserveRatio: this.totalMinted > 0 ? this.totalReserves / this.totalMinted : 1,
      totalChecks: this.results.length,
      passRate: this.results.length > 0 ? passed / this.results.length : 1,
    };
  }

  // ─── Individual Checks ───────────────────────────────────────────────────

  private checkDailyMintCap(params: GuardrailCheck, timestamp: string): GuardrailResult {
    this.resetDailyIfNeeded();
    const amount = parseFloat(params.amount ?? '0');
    const projectedTotal = this.dailyMintTotal + amount;
    const passed = projectedTotal <= this.config.dailyMintCapUsd;

    return {
      passed,
      type: GuardrailType.DAILY_MINT_CAP,
      message: passed
        ? `Mint within daily cap: $${projectedTotal.toLocaleString()} / $${this.config.dailyMintCapUsd.toLocaleString()}`
        : `BLOCKED: Mint would exceed daily cap ($${projectedTotal.toLocaleString()} > $${this.config.dailyMintCapUsd.toLocaleString()})`,
      currentValue: projectedTotal.toString(),
      threshold: this.config.dailyMintCapUsd.toString(),
      timestamp,
    };
  }

  private checkFrozenAccount(params: GuardrailCheck, timestamp: string): GuardrailResult {
    const accountId = params.accountId ?? '';
    const frozen = this.frozenAccounts.has(accountId);

    return {
      passed: !frozen,
      type: GuardrailType.FROZEN_ACCOUNT,
      message: frozen
        ? `BLOCKED: Account ${accountId} is frozen`
        : `Account ${accountId} is active`,
      timestamp,
    };
  }

  private checkDoubleRedemption(params: GuardrailCheck, timestamp: string): GuardrailResult {
    const redemptionId = params.accountId ?? '';
    const isDuplicate = this.recentRedemptionIds.has(redemptionId);

    return {
      passed: !isDuplicate,
      type: GuardrailType.DOUBLE_REDEMPTION,
      message: isDuplicate
        ? `BLOCKED: Duplicate redemption ${redemptionId}`
        : `Redemption ${redemptionId} is unique`,
      timestamp,
    };
  }

  private checkAllocationLimit(params: GuardrailCheck, timestamp: string): GuardrailResult {
    const amount = parseFloat(params.amount ?? '0');
    const passed = amount <= this.config.allocationLimitUsd;

    return {
      passed,
      type: GuardrailType.ALLOCATION_LIMIT,
      message: passed
        ? `Allocation $${amount.toLocaleString()} within limit`
        : `BLOCKED: Allocation $${amount.toLocaleString()} exceeds limit $${this.config.allocationLimitUsd.toLocaleString()}`,
      currentValue: amount.toString(),
      threshold: this.config.allocationLimitUsd.toString(),
      timestamp,
    };
  }

  private checkConcentrationLimit(params: GuardrailCheck, timestamp: string): GuardrailResult {
    // In v1, we pass concentration as the amount field (percentage)
    const concentration = parseFloat(params.amount ?? '0');
    const passed = concentration <= this.config.concentrationLimitPct;

    return {
      passed,
      type: GuardrailType.CONCENTRATION_LIMIT,
      message: passed
        ? `Concentration ${concentration}% within limit`
        : `BLOCKED: Concentration ${concentration}% exceeds ${this.config.concentrationLimitPct}%`,
      currentValue: concentration.toString(),
      threshold: this.config.concentrationLimitPct.toString(),
      timestamp,
    };
  }

  private checkVelocity(params: GuardrailCheck, timestamp: string): GuardrailResult {
    const now = Date.now();
    const windowStart = now - this.config.velocityWindowMs;
    const recentOps = this.operationTimestamps.filter((t) => t >= windowStart);
    const passed = recentOps.length < this.config.velocityMaxOps;

    return {
      passed,
      type: GuardrailType.VELOCITY_CHECK,
      message: passed
        ? `${recentOps.length} ops in window (max: ${this.config.velocityMaxOps})`
        : `BLOCKED: ${recentOps.length} ops exceeds velocity limit of ${this.config.velocityMaxOps}`,
      currentValue: recentOps.length.toString(),
      threshold: this.config.velocityMaxOps.toString(),
      timestamp,
    };
  }

  private checkReserveRatio(params: GuardrailCheck, timestamp: string): GuardrailResult {
    const ratio = this.totalMinted > 0 ? this.totalReserves / this.totalMinted : 1;
    const passed = ratio >= this.config.reserveRatioMin;

    return {
      passed,
      type: GuardrailType.RESERVE_RATIO,
      message: passed
        ? `Reserve ratio: ${(ratio * 100).toFixed(1)}% (min: ${(this.config.reserveRatioMin * 100).toFixed(1)}%)`
        : `BLOCKED: Reserve ratio ${(ratio * 100).toFixed(1)}% below minimum ${(this.config.reserveRatioMin * 100).toFixed(1)}%`,
      currentValue: ratio.toString(),
      threshold: this.config.reserveRatioMin.toString(),
      timestamp,
    };
  }

  private resetDailyIfNeeded(): void {
    if (Date.now() >= this.dailyMintResetAt) {
      this.dailyMintTotal = 0;
      this.dailyMintResetAt = Date.now() + 86_400_000;
    }
  }
}
