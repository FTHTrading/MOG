/**
 * @sovereign/ledger — File-Based Durable Store
 *
 * Stores sovereign engine state as JSON files on local disk.
 *
 * Directory structure:
 *   .sovereign-data/
 *     collections/
 *       ledger-entries.jsonl    (newline-delimited JSON — append-only)
 *       audit-entries.jsonl
 *       anchor-receipts.jsonl
 *       guardrail-results.jsonl
 *     snapshots/
 *       accounts.json
 *       guardrail-state.json
 *       engine-state.json
 *       audit-chain-head.json
 *       ledger-chain-head.json
 *
 * Append-only collections use JSONL (one JSON object per line) for
 * efficient append without rewriting the entire file.
 *
 * Snapshots are full JSON files overwritten on each save.
 *
 * This is v1 storage — no WAL, no transactions, no concurrent writers.
 * Designed for single-process operation. Production will use PostgreSQL.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, statSync } from 'fs';
import { join } from 'path';
import type { DurableStore, StoreInfo } from './store';

// ─── File Store Implementation ─────────────────────────────────────────────────

export class FileStore implements DurableStore {
  private basePath: string;
  private collectionsDir: string;
  private snapshotsDir: string;
  private _initialized = false;
  private _collections: Set<string> = new Set();
  private _snapshots: Set<string> = new Set();
  private _lastWriteAt: string | undefined;

  constructor(basePath?: string) {
    this.basePath = basePath ?? join(process.cwd(), '.sovereign-data');
    this.collectionsDir = join(this.basePath, 'collections');
    this.snapshotsDir = join(this.basePath, 'snapshots');
  }

  async initialize(): Promise<void> {
    if (this._initialized) return;

    // Create directories
    mkdirSync(this.collectionsDir, { recursive: true });
    mkdirSync(this.snapshotsDir, { recursive: true });

    // Scan existing files
    this.scanExisting();

    this._initialized = true;
    console.error(`[STORE] FileStore initialized at ${this.basePath}`);
  }

  // ─── Append-Only Collections ─────────────────────────────────────────────

  async append(collection: string, entries: unknown[]): Promise<void> {
    this.ensureInitialized();
    if (entries.length === 0) return;

    const filePath = this.collectionPath(collection);
    const lines = entries.map((e) => JSON.stringify(e)).join('\n') + '\n';

    appendFileSync(filePath, lines, 'utf-8');
    this._collections.add(collection);
    this._lastWriteAt = new Date().toISOString();
  }

  async loadAll(collection: string): Promise<unknown[]> {
    this.ensureInitialized();

    const filePath = this.collectionPath(collection);
    if (!existsSync(filePath)) return [];

    const content = readFileSync(filePath, 'utf-8').trim();
    if (!content) return [];

    return content.split('\n').filter(Boolean).map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        console.error(`[STORE] Corrupt line in ${collection}: ${line.substring(0, 50)}...`);
        return null;
      }
    }).filter(Boolean);
  }

  async loadRange(collection: string, offset: number, limit: number): Promise<unknown[]> {
    const all = await this.loadAll(collection);
    return all.slice(offset, offset + limit);
  }

  async count(collection: string): Promise<number> {
    const filePath = this.collectionPath(collection);
    if (!existsSync(filePath)) return 0;

    const content = readFileSync(filePath, 'utf-8').trim();
    if (!content) return 0;

    return content.split('\n').filter(Boolean).length;
  }

  // ─── Key-Value Snapshots ─────────────────────────────────────────────────

  async saveSnapshot(key: string, data: unknown): Promise<void> {
    this.ensureInitialized();

    const filePath = this.snapshotPath(key);
    const content = JSON.stringify(data, null, 2);
    writeFileSync(filePath, content, 'utf-8');

    this._snapshots.add(key);
    this._lastWriteAt = new Date().toISOString();
  }

  async loadSnapshot(key: string): Promise<unknown | null> {
    this.ensureInitialized();

    const filePath = this.snapshotPath(key);
    if (!existsSync(filePath)) return null;

    try {
      const content = readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      console.error(`[STORE] Failed to parse snapshot: ${key}`);
      return null;
    }
  }

  async exists(key: string): Promise<boolean> {
    const collectionExists = existsSync(this.collectionPath(key));
    const snapshotExists = existsSync(this.snapshotPath(key));
    return collectionExists || snapshotExists;
  }

  getInfo(): StoreInfo {
    return {
      type: 'file',
      path: this.basePath,
      initialized: this._initialized,
      collections: [...this._collections],
      snapshots: [...this._snapshots],
      lastWriteAt: this._lastWriteAt,
    };
  }

  // ─── Internals ───────────────────────────────────────────────────────────

  private collectionPath(name: string): string {
    return join(this.collectionsDir, `${name}.jsonl`);
  }

  private snapshotPath(name: string): string {
    return join(this.snapshotsDir, `${name}.json`);
  }

  private ensureInitialized(): void {
    if (!this._initialized) {
      throw new Error('[STORE] FileStore not initialized — call initialize() first');
    }
  }

  private scanExisting(): void {
    // Scan collections
    try {
      const { readdirSync } = require('fs');
      const collectionFiles = readdirSync(this.collectionsDir) as string[];
      for (const file of collectionFiles) {
        if (file.endsWith('.jsonl')) {
          this._collections.add(file.replace('.jsonl', ''));
        }
      }

      const snapshotFiles = readdirSync(this.snapshotsDir) as string[];
      for (const file of snapshotFiles) {
        if (file.endsWith('.json')) {
          this._snapshots.add(file.replace('.json', ''));
        }
      }
    } catch {
      // Fresh install — no files yet
    }
  }
}
