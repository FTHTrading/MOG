/**
 * @sovereign/ledger — Durable Store Abstraction
 *
 * Storage interface for persistent state.
 * Implementations:
 *   - FileStore (v1): JSON files on local disk
 *   - PostgresStore (future): PostgreSQL 16
 *   - DynamoStore (future): AWS DynamoDB
 *
 * Design:
 *   - Append-only collections (ledger entries, audit entries)
 *   - Key-value state (accounts, guardrail state)
 *   - Atomic writes via snapshot + journal pattern
 *
 * All data is JSON-serializable.
 */

// ─── Store Interface ───────────────────────────────────────────────────────────

export interface DurableStore {
  /**
   * Initialize the store. Creates directories/tables if needed.
   */
  initialize(): Promise<void>;

  /**
   * Append entries to a named collection. Entries are never modified or deleted.
   */
  append(collection: string, entries: unknown[]): Promise<void>;

  /**
   * Load all entries from a named collection, in insertion order.
   */
  loadAll(collection: string): Promise<unknown[]>;

  /**
   * Load entries from a collection with offset + limit.
   */
  loadRange(collection: string, offset: number, limit: number): Promise<unknown[]>;

  /**
   * Get the count of entries in a collection.
   */
  count(collection: string): Promise<number>;

  /**
   * Save a keyed snapshot (JSON-serializable object).
   * Used for accounts map, guardrail state, etc.
   */
  saveSnapshot(key: string, data: unknown): Promise<void>;

  /**
   * Load a keyed snapshot. Returns null if not found.
   */
  loadSnapshot(key: string): Promise<unknown | null>;

  /**
   * Check if a collection or snapshot exists.
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get store metadata (path, type, last write, etc.)
   */
  getInfo(): StoreInfo;
}

// ─── Store Info ────────────────────────────────────────────────────────────────

export interface StoreInfo {
  type: 'file' | 'postgres' | 'memory';
  path?: string;
  initialized: boolean;
  collections: string[];
  snapshots: string[];
  lastWriteAt?: string;
}

// ─── Store Collections ─────────────────────────────────────────────────────────

/**
 * Canonical collection names used by the sovereign engine.
 */
export const STORE_COLLECTIONS = {
  LEDGER_ENTRIES: 'ledger-entries',
  AUDIT_ENTRIES: 'audit-entries',
  ANCHOR_RECEIPTS: 'anchor-receipts',
  GUARDRAIL_RESULTS: 'guardrail-results',
} as const;

export const STORE_SNAPSHOTS = {
  ACCOUNTS: 'accounts',
  GUARDRAIL_STATE: 'guardrail-state',
  ENGINE_STATE: 'engine-state',
  AUDIT_CHAIN_HEAD: 'audit-chain-head',
  LEDGER_CHAIN_HEAD: 'ledger-chain-head',
} as const;
