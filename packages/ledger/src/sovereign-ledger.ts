/**
 * @sovereign/ledger — Sovereign Ledger Interface
 *
 * The ONE ledger. All capital movements route through this interface.
 *
 * MERGED FROM:
 *   fth-institutional-core vault-ledger.ts (hash-chained, append-only)
 *   fth-capital-os ledger-service (double-entry, 28-decimal)
 *
 * Properties:
 *   - Hash-chained (every entry references previous hash)
 *   - Append-only (no updates, no deletes)
 *   - 28-decimal precision
 *   - Double-entry (every transaction has debit + credit)
 *   - Integrity-verifiable (conservation invariant: mints = burns + outstanding)
 */

import type {
  LedgerEntry,
  CapitalAccount,
  MintRequest, MintResult,
  BurnRequest, BurnResult,
  AllocationRequest, AllocationResult,
  RedemptionRequest, RedemptionResult,
  SettlementRequest, SettlementResult,
  EscrowRequest, EscrowResult,
  AnchorRequest, AnchorResult,
  GuardrailCheck, GuardrailResult,
  IntegrityReport,
  TransactionType,
} from './types';

// ─── Sovereign Ledger Interface ────────────────────────────────────────────────

export interface SovereignLedger {
  // ── Capital Operations ─────────────────────────────────────────────────────

  /** Mint tokens — requires reserve validation, guardrail check */
  mint(params: MintRequest): Promise<MintResult>;

  /** Burn tokens — requires redemption approval */
  burn(params: BurnRequest): Promise<BurnResult>;

  /** Allocate capital to a strategy */
  allocate(params: AllocationRequest): Promise<AllocationResult>;

  /** Redeem capital — initiates burn + settlement */
  redeem(params: RedemptionRequest): Promise<RedemptionResult>;

  /** Settle between accounts across chains */
  settle(params: SettlementRequest): Promise<SettlementResult>;

  // ── Chain Operations ───────────────────────────────────────────────────────

  /** Create an escrow on-chain */
  escrow(params: EscrowRequest): Promise<EscrowResult>;

  /** Anchor data hash to chain (3-tier: BTC → XRPL → Polygon) */
  anchor(params: AnchorRequest): Promise<AnchorResult>;

  // ── Guardrails ─────────────────────────────────────────────────────────────

  /** Check a guardrail before operation */
  checkGuardrail(check: GuardrailCheck): Promise<GuardrailResult>;

  // ── Integrity ──────────────────────────────────────────────────────────────

  /** Verify the entire ledger chain + conservation invariant */
  verifyIntegrity(): Promise<IntegrityReport>;

  // ── Queries ────────────────────────────────────────────────────────────────

  /** Get a ledger entry by ID */
  getEntry(entryId: string): Promise<LedgerEntry | null>;

  /** Get account balance and details */
  getAccount(accountId: string): Promise<CapitalAccount | null>;

  /** Query entries by type, account, date range */
  queryEntries(filters: LedgerQueryFilters): Promise<LedgerEntry[]>;

  /** Get aggregate statistics */
  getStats(): Promise<LedgerStats>;
}

// ─── Query Types ───────────────────────────────────────────────────────────────

export interface LedgerQueryFilters {
  transactionType?: TransactionType[];
  accountId?: string;
  currency?: string;
  chain?: string;
  fromDate?: string;
  toDate?: string;
  minAmount?: string;
  maxAmount?: string;
  limit?: number;
  offset?: number;
}

export interface LedgerStats {
  totalEntries: number;
  totalMinted: string;
  totalBurned: string;
  outstanding: string;
  totalSettled: string;
  totalEscrowed: string;
  lastEntryTimestamp: string;
  chainBreakdown: Record<string, ChainStats>;
}

export interface ChainStats {
  chain: string;
  transactionCount: number;
  totalVolume: string;
  lastActivity: string;
  connectionStatus: string;
}
