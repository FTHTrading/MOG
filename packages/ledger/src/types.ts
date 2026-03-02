/**
 * @sovereign/ledger — Ledger Types
 *
 * MERGED FROM:
 *   fth-institutional-core/fth-platform/core/vault-ledger.ts (hash-chained, append-only)
 *   fth-capital-os/core/models/index.ts (capital domain models, 28-decimal)
 *   fth-capital-os/core/settlement-state-machine.ts (settlement states)
 *   fth-institutional-core/fth-platform/core/canonical-types.ts (bond/collateral/funding states)
 *
 * INVARIANT: Every ledger entry is hash-chained. 28-decimal precision.
 *            Append-only — no updates, no deletes.
 */

import type { SovereignIdentity, SupportedChain, TokenType, Stablecoin } from '@sovereign/identity';

// ─── Ledger Entry ──────────────────────────────────────────────────────────────

export enum TransactionType {
  MINT = 'MINT',
  BURN = 'BURN',
  ALLOCATION = 'ALLOCATION',
  REDEMPTION = 'REDEMPTION',
  SETTLEMENT = 'SETTLEMENT',
  DISTRIBUTION = 'DISTRIBUTION',
  TRANSFER = 'TRANSFER',
  FEE = 'FEE',
  RESERVE_VALIDATION = 'RESERVE_VALIDATION',
  WIRE_IN = 'WIRE_IN',
  WIRE_OUT = 'WIRE_OUT',
  ESCROW_CREATE = 'ESCROW_CREATE',
  ESCROW_FINISH = 'ESCROW_FINISH',
  ESCROW_CANCEL = 'ESCROW_CANCEL',
  ANCHOR = 'ANCHOR',
}

export interface LedgerEntry {
  id: string;
  sequenceNumber: number;
  transactionType: TransactionType;

  // Double-entry
  debitAccountId: string;
  creditAccountId: string;
  amount: string; // 28-decimal string precision
  currency: TokenType | Stablecoin | string;

  // Hash chain
  contentHash: string;
  previousEntryHash: string;

  // Chain reference
  chain?: SupportedChain;
  chainTxHash?: string;
  chainBlockNumber?: number;

  // Metadata
  reference?: string;
  memo?: string;
  initiatedBy: string;
  approvedBy?: string;

  // Timestamps
  timestamp: string;
  settledAt?: string;
}

// ─── Capital Account ───────────────────────────────────────────────────────────

export interface CapitalAccount {
  id: string;
  identityId: string;
  accountType: AccountType;
  currency: TokenType | Stablecoin | string;
  balance: string; // 28-decimal
  availableBalance: string;
  lockedBalance: string;
  chain: SupportedChain;
  chainAddress?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum AccountType {
  CLIENT = 'CLIENT',
  TREASURY = 'TREASURY',
  RESERVE = 'RESERVE',
  ESCROW = 'ESCROW',
  FEE = 'FEE',
  SETTLEMENT = 'SETTLEMENT',
  OMNIBUS = 'OMNIBUS',
  COLLATERAL = 'COLLATERAL',
}

// ─── Capital Operations ────────────────────────────────────────────────────────

export interface MintRequest {
  accountId: string;
  amount: string;
  currency: TokenType;
  reserveValidationId: string;
  initiatedBy: string;
}

export interface MintResult {
  ledgerEntryId: string;
  chainTxHash: string;
  amountMinted: string;
  newBalance: string;
  timestamp: string;
}

export interface BurnRequest {
  accountId: string;
  amount: string;
  currency: TokenType;
  redemptionId?: string;
  initiatedBy: string;
}

export interface BurnResult {
  ledgerEntryId: string;
  chainTxHash: string;
  amountBurned: string;
  newBalance: string;
  timestamp: string;
}

export interface AllocationRequest {
  sourceAccountId: string;
  strategyId: string;
  amount: string;
  currency: TokenType;
  initiatedBy: string;
}

export interface AllocationResult {
  ledgerEntryId: string;
  allocationId: string;
  amountAllocated: string;
  timestamp: string;
}

export interface RedemptionRequest {
  accountId: string;
  amount: string;
  currency: TokenType;
  destinationType: 'WIRE' | 'STABLECOIN' | 'XRPL';
  destinationDetails: Record<string, string>;
  initiatedBy: string;
}

export interface RedemptionResult {
  ledgerEntryId: string;
  redemptionId: string;
  status: RedemptionStatus;
  estimatedSettlement: string;
  timestamp: string;
}

export enum RedemptionStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  SETTLED = 'SETTLED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

// ─── Settlement ────────────────────────────────────────────────────────────────

export enum SettlementState {
  CREATED = 'CREATED',
  VALIDATED = 'VALIDATED',
  ROUTED = 'ROUTED',
  EXECUTING = 'EXECUTING',
  SETTLED = 'SETTLED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface SettlementRequest {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: string;
  currency: TokenType | Stablecoin | string;
  chain: SupportedChain;
  priority: 'NORMAL' | 'URGENT' | 'BATCH';
  initiatedBy: string;
}

export interface SettlementResult {
  ledgerEntryId: string;
  settlementId: string;
  state: SettlementState;
  chainTxHash?: string;
  settledAt?: string;
  timestamp: string;
}

// ─── Wire / Banking ────────────────────────────────────────────────────────────

export enum WireDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum WireStatus {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  RECONCILED = 'RECONCILED',
  REJECTED = 'REJECTED',
  RETURNED = 'RETURNED',
}

export enum BankRailType {
  ACH = 'ACH',
  WIRE = 'WIRE',
  SWIFT = 'SWIFT',
  SEPA = 'SEPA',
  FED_NOW = 'FED_NOW',
}

export interface WireRecord {
  id: string;
  direction: WireDirection;
  status: WireStatus;
  railType: BankRailType;
  amount: string;
  currency: string;
  counterpartyName: string;
  counterpartyAccount: string;
  referenceNumber: string;
  reconciliationId?: string;
  initiatedAt: string;
  settledAt?: string;
}

// ─── Escrow ────────────────────────────────────────────────────────────────────

export interface EscrowRequest {
  amount: string;
  currency: TokenType | Stablecoin;
  chain: SupportedChain;
  condition?: string;
  cancelAfter?: string;
  finishAfter?: string;
  destinationAddress: string;
  initiatedBy: string;
}

export interface EscrowResult {
  escrowId: string;
  ledgerEntryId: string;
  chainTxHash: string;
  sequenceNumber: number;
  state: 'CREATED' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';
  timestamp: string;
}

// ─── Anchor (Proof Commitment) ─────────────────────────────────────────────────

export enum AnchoringTier {
  TIER_1_BTC = 'TIER_1_BTC',
  TIER_2_XRPL = 'TIER_2_XRPL',
  TIER_3_POLYGON = 'TIER_3_POLYGON',
}

export interface AnchorRequest {
  dataHash: string;
  tier: AnchoringTier;
  metadata?: Record<string, unknown>;
  initiatedBy: string;
}

export interface AnchorResult {
  anchorId: string;
  tier: AnchoringTier;
  chain: SupportedChain;
  txHash: string;
  blockNumber?: number;
  dataHash: string;
  timestamp: string;
}

// ─── Guardrails ────────────────────────────────────────────────────────────────

export interface GuardrailCheck {
  type: GuardrailType;
  accountId?: string;
  amount?: string;
  currency?: string;
  initiatedBy: string;
}

export enum GuardrailType {
  DAILY_MINT_CAP = 'DAILY_MINT_CAP',
  FROZEN_ACCOUNT = 'FROZEN_ACCOUNT',
  DOUBLE_REDEMPTION = 'DOUBLE_REDEMPTION',
  ALLOCATION_LIMIT = 'ALLOCATION_LIMIT',
  CONCENTRATION_LIMIT = 'CONCENTRATION_LIMIT',
  VELOCITY_CHECK = 'VELOCITY_CHECK',
  RESERVE_RATIO = 'RESERVE_RATIO',
}

export interface GuardrailResult {
  passed: boolean;
  type: GuardrailType;
  message: string;
  currentValue?: string;
  threshold?: string;
  timestamp: string;
}

// ─── Integrity ─────────────────────────────────────────────────────────────────

export interface IntegrityReport {
  valid: boolean;
  totalEntries: number;
  verifiedEntries: number;
  firstBrokenLink?: number;
  conservationCheck: boolean; // total mints === total burns + outstanding
  verifiedAt: string;
}

// ─── Bond State Machine ────────────────────────────────────────────────────────

export enum BondState {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  SUBSCRIPTION = 'SUBSCRIPTION',
  FUNDED = 'FUNDED',
  ACTIVE = 'ACTIVE',
  MATURED = 'MATURED',
  REDEEMED = 'REDEEMED',
}

// ─── Collateral State Machine ──────────────────────────────────────────────────

export enum CollateralState {
  UNENCUMBERED = 'UNENCUMBERED',
  PLEDGED = 'PLEDGED',
  VERIFIED = 'VERIFIED',
  VALUED = 'VALUED',
  LIEN_PLACED = 'LIEN_PLACED',
  ESCROWED = 'ESCROWED',
  ACTIVE = 'ACTIVE',
  MARGIN_CALL = 'MARGIN_CALL',
  RELEASED = 'RELEASED',
  LIQUIDATED = 'LIQUIDATED',
}

// ─── Funding State Machine ─────────────────────────────────────────────────────

export enum FundingStatus {
  INITIATED = 'INITIATED',
  PENDING_KYC = 'PENDING_KYC',
  KYC_APPROVED = 'KYC_APPROVED',
  FIAT_RECEIVED = 'FIAT_RECEIVED',
  MINTING = 'MINTING',
  RESERVE_VALIDATED = 'RESERVE_VALIDATED',
  CREDITED = 'CREDITED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}
