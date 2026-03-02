/**
 * Sovereign Capital Engine — Singleton (DURABLE)
 *
 * This is the live engine that powers the control plane.
 * It initializes the full stack with persistent storage:
 *   0. FileStore → JSONL append-only + JSON snapshots
 *   1. XRPL Connection Manager → testnet
 *   2. XRPL Anchor Engine → hash anchoring (persisted)
 *   3. Hash-Chained Audit Logger (persisted)
 *   4. Guardrail Engine (persisted)
 *   5. Sovereign Ledger (persisted)
 *
 * All state survives restarts via .sovereign-data/ directory.
 */

import {
  SovereignXrplConnectionManager,
  XrplAnchorEngine,
  SovereignAuditLogger,
  GuardrailEngine,
  SovereignLedgerImpl,
  XrplNetwork,
  AnchoringTier,
  FileStore,
} from '@sovereign/ledger';
import { AuditAction, Role, ModuleCategory } from '@sovereign/identity';
import type { GuardrailConfig, DurableStore } from '@sovereign/ledger';

// ─── Engine State ──────────────────────────────────────────────────────────────

export interface EngineStatus {
  initialized: boolean;
  xrplConnected: boolean;
  xrplNetwork: string;
  anchorWallet: string | null;
  ledgerEntries: number;
  auditEntries: number;
  guardrailChecks: number;
  guardrailPassRate: number;
  anchorCount: number;
  uptime: number;
}

// ─── Singleton Engine ──────────────────────────────────────────────────────────

class SovereignEngine {
  private _connectionManager: SovereignXrplConnectionManager | null = null;
  private _anchorEngine: XrplAnchorEngine | null = null;
  private _auditLogger: SovereignAuditLogger | null = null;
  private _guardrailEngine: GuardrailEngine | null = null;
  private _ledger: SovereignLedgerImpl | null = null;
  private _store: DurableStore | null = null;
  private _initialized = false;
  private _startTime = 0;

  get connectionManager() { return this._connectionManager!; }
  get anchorEngine() { return this._anchorEngine!; }
  get auditLogger() { return this._auditLogger!; }
  get guardrailEngine() { return this._guardrailEngine!; }
  get ledger() { return this._ledger!; }
  get initialized() { return this._initialized; }

  /**
   * Initialize the full capital engine.
   * Call once at startup. Idempotent.
   */
  async initialize(config?: {
    network?: XrplNetwork;
    xrplSeed?: string;
    guardrails?: Partial<GuardrailConfig>;
    skipXrpl?: boolean;
    dataDir?: string;
  }): Promise<void> {
    if (this._initialized) return;

    const network = config?.network ?? ('testnet' as XrplNetwork);
    this._startTime = Date.now();

    // 0. Durable Store (JSONL + JSON snapshots)
    const dataDir = config?.dataDir ?? '.sovereign-data';
    this._store = new FileStore(dataDir);
    await this._store.initialize();

    // 1. Audit Logger (with persistence)
    this._auditLogger = new SovereignAuditLogger(this._store);

    // 2. Guardrail Engine (with persistence)
    this._guardrailEngine = new GuardrailEngine(config?.guardrails, this._store);

    // 3. XRPL Connection Manager
    this._connectionManager = new SovereignXrplConnectionManager(network);

    // 4. XRPL Anchor Engine (with persistence)
    this._anchorEngine = new XrplAnchorEngine(this._connectionManager, this._store);

    // 5. Restore persisted state BEFORE connecting
    const [auditCount, guardrailMsg, anchorCount] = await Promise.all([
      this._auditLogger.restore(),
      this._guardrailEngine.restore().then(() => 'ok'),
      this._anchorEngine.restore(),
    ]);
    console.error(`[ENGINE] State restored — audit:${auditCount} anchors:${anchorCount}`);

    // 6. Connect to XRPL + fund wallet (if not skipping)
    if (!config?.skipXrpl) {
      try {
        await this._connectionManager.connect();
        await this._anchorEngine.initialize(config?.xrplSeed);

        // Log initialization
        await this._auditLogger.log({
          action: AuditAction.SYSTEM_CONFIG_CHANGED,
          actorId: 'SYSTEM',
          actorRole: Role.SUPER_ADMIN,
          module: ModuleCategory.XRPL_CONNECTION,
          details: {
            event: 'ENGINE_INITIALIZED',
            network,
            wallet: this._anchorEngine.getWalletAddress(),
          },
        });
      } catch (err) {
        console.error('[ENGINE] XRPL connection failed — running in offline mode:', err);
      }
    }

    // 7. Sovereign Ledger (depends on audit + guardrails + anchor + store)
    this._ledger = new SovereignLedgerImpl(
      this._auditLogger,
      this._guardrailEngine,
      this._anchorEngine,
      this._store,
    );

    // 8. Restore ledger state
    const ledgerCount = await this._ledger.restore();
    
    // Only seed demo account if no persisted accounts
    if (ledgerCount === 0) {
      this._ledger.createAccount('CLIENT-001', 'kevan-burns');
      // Set initial reserves ($10M)
      this._guardrailEngine.recordReserve(10_000_000);
    }

    this._initialized = true;
    console.error('[ENGINE] Sovereign Capital Engine initialized');
  }

  /**
   * Get full engine status.
   */
  getStatus(): EngineStatus {
    const guardrailStatus = this._guardrailEngine?.getStatus();

    return {
      initialized: this._initialized,
      xrplConnected: (this._connectionManager?.getStatus()?.activeConnections ?? 0) > 0,
      xrplNetwork: 'testnet',
      anchorWallet: this._anchorEngine?.getWalletAddress() ?? null,
      ledgerEntries: this._ledger?.getAllEntries().length ?? 0,
      auditEntries: this._auditLogger?.getEntryCount() ?? 0,
      guardrailChecks: guardrailStatus?.totalChecks ?? 0,
      guardrailPassRate: guardrailStatus?.passRate ?? 1,
      anchorCount: this._anchorEngine?.getHistory().length ?? 0,
      uptime: this._startTime > 0 ? Date.now() - this._startTime : 0,
    };
  }

  /**
   * Execute a full capital cycle: mint → settle → anchor → verify.
   * This is the demo flow that proves live infrastructure.
   */
  async executeCapitalCycle(params: {
    amount: string;
    initiatedBy: string;
  }): Promise<{
    mint: Awaited<ReturnType<SovereignLedgerImpl['mint']>>;
    settlement: Awaited<ReturnType<SovereignLedgerImpl['settle']>>;
    anchor: Awaited<ReturnType<SovereignLedgerImpl['anchor']>> | null;
    integrity: Awaited<ReturnType<SovereignLedgerImpl['verifyIntegrity']>>;
    auditChain: Awaited<ReturnType<SovereignAuditLogger['verifyChain']>>;
  }> {
    if (!this._initialized) {
      throw new Error('Engine not initialized');
    }

    // 1. Mint
    const mint = await this._ledger!.mint({
      accountId: 'CLIENT-001',
      amount: params.amount,
      currency: 'FTHUSD' as any,
      reserveValidationId: `rv-${Date.now()}`,
      initiatedBy: params.initiatedBy,
    });

    // 2. Settle
    const settlement = await this._ledger!.settle({
      sourceAccountId: 'CLIENT-001',
      destinationAccountId: 'TREASURY',
      amount: (parseFloat(params.amount) * 0.1).toFixed(2), // 10% to treasury
      currency: 'FTHUSD',
      chain: 'xrpl' as any,
      priority: 'NORMAL',
      initiatedBy: params.initiatedBy,
    });

    // 3. Anchor the audit chain hash to XRPL
    let anchor = null;
    try {
      const auditHash = this._auditLogger!.getLatestHash();
      anchor = await this._ledger!.anchor({
        dataHash: auditHash,
        tier: AnchoringTier.TIER_2_XRPL,
        metadata: { source: 'capital-cycle', mintId: mint.ledgerEntryId },
        initiatedBy: params.initiatedBy,
      });
    } catch (err) {
      console.error('[ENGINE] Anchor failed (offline mode):', err);
    }

    // 4. Verify integrity
    const integrity = await this._ledger!.verifyIntegrity();

    // 5. Verify audit chain
    const auditChain = await this._auditLogger!.verifyChain();

    return { mint, settlement, anchor, integrity, auditChain };
  }
}

// ─── Singleton Export ──────────────────────────────────────────────────────────

export const engine = new SovereignEngine();
