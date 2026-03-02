/**
 * @sovereign/ledger — XRPL Module Types
 *
 * CONSOLIDATED FROM:
 *   fth-capital-os/xrpl/* (operational services — mint, burn, escrow, wallet, trustline)
 *   fth-institutional-core/fth-platform/xrpl/* (connection manager, issuer, account control)
 *   circle-superapp/src/lib/circle/xrpl.ts (trustline types, DEX, bridging)
 *   fth-institutional-core/fth-anchor-bridge/* (genesis ceremony, submitter)
 *
 * RULE: ONE connection manager. ONE mint/burn path. ONE trustline manager.
 */

import type { SupportedChain } from '@sovereign/identity';

// ─── Connection Management ─────────────────────────────────────────────────────

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  DRAINING = 'DRAINING',
  FAILED = 'FAILED',
}

export enum EndpointTier {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  FALLBACK = 'FALLBACK',
}

export interface XrplEndpoint {
  url: string;
  tier: EndpointTier;
  network: XrplNetwork;
  maxConnections: number;
}

export enum XrplNetwork {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  DEVNET = 'devnet',
}

export interface ConnectionHealth {
  endpoint: string;
  state: ConnectionState;
  latencyMs: number;
  ledgerIndex: number;
  ledgerLag: number;
  lastHeartbeat: string;
  reconnectCount: number;
  uptime: number; // percentage
}

export interface ConnectionPoolStatus {
  totalConnections: number;
  activeConnections: number;
  healthyConnections: number;
  endpoints: ConnectionHealth[];
  primaryEndpoint: string;
  estimatedFee: string;
}

// ─── XRPL Connection Manager Interface ─────────────────────────────────────────

export interface XrplConnectionManager {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getClient(): Promise<unknown>; // xrpl.Client at runtime
  getStatus(): ConnectionPoolStatus;
  estimateFee(): Promise<string>;
  getLedgerIndex(): Promise<number>;
  healthCheck(): Promise<ConnectionHealth[]>;
  onStateChange(callback: (state: ConnectionState) => void): void;
}

// ─── Currency Encoding ─────────────────────────────────────────────────────────

export const XRPL_CURRENCY_HEX: Record<string, string> = {
  FTHUSD: '4654485553440000000000000000000000000000',
  USDF: '5553444600000000000000000000000000000000',
};

export const XRPL_TOKENS = [
  { currency: 'FTHUSD', name: 'FTH USD', decimals: 15 },
  { currency: 'USDF', name: 'USD Facility', decimals: 15 },
  { currency: 'USD', name: 'US Dollar', decimals: 6 },
] as const;

// ─── Wallet Management ─────────────────────────────────────────────────────────

export interface XrplWalletInfo {
  address: string;
  publicKey: string;
  balance: string;
  sequence: number;
  ownerCount: number;
  flags: number;
  isActivated: boolean;
}

// ─── Trustline Management ──────────────────────────────────────────────────────

export interface XrplTrustline {
  account: string;
  currency: string;
  issuer: string;
  limit: string;
  balance: string;
  qualityIn: number;
  qualityOut: number;
  noRipple: boolean;
  freeze: boolean;
}

export interface TrustlineRequest {
  account: string;
  currency: string;
  issuer: string;
  limit: string;
  noRipple?: boolean;
}

// ─── Issuer Management ─────────────────────────────────────────────────────────

export interface IssuerConfig {
  address: string;
  currencies: string[];
  defaultRipple: boolean;
  requireAuth: boolean;
  globalFreeze: boolean;
  transferRate?: number;
}

// ─── Escrow ────────────────────────────────────────────────────────────────────

export interface XrplEscrowParams {
  senderAddress: string;
  destinationAddress: string;
  amount: string;
  condition?: string;
  cancelAfter?: number; // unix timestamp
  finishAfter?: number;
}

export interface XrplEscrowResult {
  txHash: string;
  sequence: number;
  ledgerIndex: number;
  status: 'CREATED' | 'FINISHED' | 'CANCELLED';
}

// ─── Payment ───────────────────────────────────────────────────────────────────

export interface XrplPaymentParams {
  senderAddress: string;
  destinationAddress: string;
  amount: string | { currency: string; issuer: string; value: string };
  destinationTag?: number;
  memo?: string;
}

// ─── DEX ───────────────────────────────────────────────────────────────────────

export interface XrplOfferParams {
  account: string;
  takerGets: string | { currency: string; issuer: string; value: string };
  takerPays: string | { currency: string; issuer: string; value: string };
  expiration?: number;
}

// ─── Anchor Engine ─────────────────────────────────────────────────────────────

export interface AnchorSubmission {
  dataHash: string;
  chain: 'xrpl';
  memo: string;
  metadata?: Record<string, unknown>;
}

export interface AnchorReceipt {
  txHash: string;
  ledgerIndex: number;
  dataHash: string;
  timestamp: string;
  verified: boolean;
}

// ─── Listener ──────────────────────────────────────────────────────────────────

export interface XrplEventSubscription {
  type: 'transaction' | 'ledger' | 'account';
  account?: string;
  callback: (event: XrplEvent) => void;
}

export interface XrplEvent {
  type: string;
  txHash?: string;
  ledgerIndex: number;
  account?: string;
  data: Record<string, unknown>;
  timestamp: string;
}
