/**
 * @sovereign/ledger — Hash-Chained Audit Logger (LIVE + DURABLE)
 *
 * Real implementation of AuditLogger from @sovereign/identity.
 * Every entry is hash-chained using SHA-256.
 * Breaking any link invalidates the downstream chain.
 *
 * Storage: Optional DurableStore for persistence across restarts.
 * Anchoring: Optional — can anchor batches to XRPL.
 */

import { createHash } from 'crypto';
import type {
  AuditLogger,
  AuditLogEntry,
  AuditLogParams,
  AuditChainVerification,
  AuditQueryFilters,
  AuditBundle,
} from '@sovereign/identity';
import type { DurableStore } from './store';
import { STORE_COLLECTIONS, STORE_SNAPSHOTS } from './store';

// ─── Audit Logger Implementation ───────────────────────────────────────────────

export class SovereignAuditLogger implements AuditLogger {
  private entries: AuditLogEntry[] = [];
  private lastHash: string = '0'.repeat(64); // genesis hash
  private store: DurableStore | null = null;

  constructor(store?: DurableStore) {
    this.store = store ?? null;
  }

  /**
   * Restore state from durable store. Call once before any operations.
   */
  async restore(): Promise<number> {
    if (!this.store) return 0;

    const entries = await this.store.loadAll(STORE_COLLECTIONS.AUDIT_ENTRIES) as AuditLogEntry[];
    if (entries.length === 0) return 0;

    this.entries = entries;
    this.lastHash = entries[entries.length - 1].contentHash;

    console.error(`[AUDIT] Restored ${entries.length} entries, head: ${this.lastHash.substring(0, 12)}...`);
    return entries.length;
  }

  /**
   * Log an audit event. Returns the hash-chained entry.
   */
  async log(params: AuditLogParams): Promise<AuditLogEntry> {
    const sequenceNumber = this.entries.length + 1;
    const timestamp = new Date().toISOString();

    // Build content for hashing (deterministic JSON serialization)
    const contentPayload = JSON.stringify({
      action: params.action,
      actorId: params.actorId,
      actorRole: params.actorRole,
      module: params.module,
      targetId: params.targetId,
      targetType: params.targetType,
      details: params.details ?? {},
      sequenceNumber,
      timestamp,
      previousEntryHash: this.lastHash,
    });

    const contentHash = createHash('sha256').update(contentPayload).digest('hex');

    const entry: AuditLogEntry = {
      id: `audit-${sequenceNumber}-${contentHash.substring(0, 8)}`,
      action: params.action,
      actorId: params.actorId,
      actorRole: params.actorRole,
      module: params.module,
      targetId: params.targetId,
      targetType: params.targetType,
      contentHash,
      previousEntryHash: this.lastHash,
      sequenceNumber,
      details: params.details ?? {},
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      timestamp,
      createdAt: timestamp,
    };

    this.entries.push(entry);
    this.lastHash = contentHash;

    // Persist
    if (this.store) {
      await this.store.append(STORE_COLLECTIONS.AUDIT_ENTRIES, [entry]);
      await this.store.saveSnapshot(STORE_SNAPSHOTS.AUDIT_CHAIN_HEAD, {
        lastHash: this.lastHash,
        entryCount: this.entries.length,
        lastEntryId: entry.id,
        timestamp: entry.timestamp,
      });
    }

    return entry;
  }

  /**
   * Verify the integrity of the audit chain.
   * Walks from the start (or given sequence) and verifies each hash link.
   */
  async verifyChain(fromSequence: number = 1): Promise<AuditChainVerification> {
    const startIdx = fromSequence - 1;
    let previousHash = startIdx === 0 ? '0'.repeat(64) : this.entries[startIdx - 1]?.contentHash;

    if (!previousHash) {
      return {
        valid: false,
        totalEntries: this.entries.length,
        verifiedEntries: 0,
        firstBrokenLink: fromSequence,
        verifiedAt: new Date().toISOString(),
      };
    }

    let verified = 0;

    for (let i = startIdx; i < this.entries.length; i++) {
      const entry = this.entries[i];

      // Verify the hash chain link
      if (entry.previousEntryHash !== previousHash) {
        return {
          valid: false,
          totalEntries: this.entries.length,
          verifiedEntries: verified,
          firstBrokenLink: entry.sequenceNumber,
          verifiedAt: new Date().toISOString(),
        };
      }

      // Verify the content hash itself
      const contentPayload = JSON.stringify({
        action: entry.action,
        actorId: entry.actorId,
        actorRole: entry.actorRole,
        module: entry.module,
        targetId: entry.targetId,
        targetType: entry.targetType,
        details: entry.details,
        sequenceNumber: entry.sequenceNumber,
        timestamp: entry.timestamp,
        previousEntryHash: entry.previousEntryHash,
      });

      const expectedHash = createHash('sha256').update(contentPayload).digest('hex');

      if (entry.contentHash !== expectedHash) {
        return {
          valid: false,
          totalEntries: this.entries.length,
          verifiedEntries: verified,
          firstBrokenLink: entry.sequenceNumber,
          verifiedAt: new Date().toISOString(),
        };
      }

      previousHash = entry.contentHash;
      verified++;
    }

    return {
      valid: true,
      totalEntries: this.entries.length,
      verifiedEntries: verified,
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Query audit entries with filters.
   */
  async query(filters: AuditQueryFilters): Promise<AuditLogEntry[]> {
    let results = [...this.entries];

    if (filters.actions?.length) {
      results = results.filter((e) => filters.actions!.includes(e.action));
    }

    if (filters.actorId) {
      results = results.filter((e) => e.actorId === filters.actorId);
    }

    if (filters.module) {
      results = results.filter((e) => e.module === filters.module);
    }

    if (filters.fromDate) {
      results = results.filter((e) => e.timestamp >= filters.fromDate!);
    }

    if (filters.toDate) {
      results = results.filter((e) => e.timestamp <= filters.toDate!);
    }

    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 100;

    return results.slice(offset, offset + limit);
  }

  /**
   * Export audit entries as a signed bundle.
   */
  async exportBundle(filters: AuditQueryFilters): Promise<AuditBundle> {
    const entries = await this.query(filters);

    const bundleContent = JSON.stringify(entries.map((e) => e.contentHash));
    const bundleHash = createHash('sha256').update(bundleContent).digest('hex');

    return {
      entries,
      bundleHash,
      signature: `sovereign:${bundleHash.substring(0, 32)}`, // Real HSM signing in Phase D
      exportedAt: new Date().toISOString(),
      exportedBy: 'sovereign-spine',
    };
  }

  /**
   * Get the latest hash in the chain.
   */
  getLatestHash(): string {
    return this.lastHash;
  }

  /**
   * Get total entry count.
   */
  getEntryCount(): number {
    return this.entries.length;
  }

  /**
   * Get all entries (for control plane display).
   */
  getAllEntries(): AuditLogEntry[] {
    return [...this.entries];
  }
}
