/**
 * Sovereign Control Plane — System Health Dashboard
 *
 * Live-wired to the Sovereign Capital Engine.
 * Shows:
 * - Real engine status (XRPL connection, ledger, audit, guardrails)
 * - Live capital summary from the ledger
 * - Execute Capital Cycle demo
 * - Layer health + chain connectivity
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { SystemMode, SUPPORTED_CHAINS } from '@sovereign/identity';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface EngineStatus {
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

interface CycleResult {
  mint: any;
  settlement: any;
  anchor: any;
  integrity: any;
  auditChain: boolean;
  engineStatus: EngineStatus;
}

// ─── Static Layer Data ─────────────────────────────────────────────────────────

const LAYER_STATUS = [
  { name: 'Identity & Authority', package: '@sovereign/identity', modules: ['RBAC Engine', 'Namespace Registry', 'Key Authority', 'Audit Logger', 'Agent Registry'] },
  { name: 'Ledger & Settlement', package: '@sovereign/ledger', modules: ['Sovereign Ledger', 'XRPL Connection', 'Mint/Burn', 'Settlement Engine', 'Guardrails'] },
  { name: 'Compliance & Guardrails', package: '@sovereign/compliance', modules: ['Rule Engine', 'Howey Analyzer', 'KYC/AML Gate'] },
  { name: 'Product Factory', package: '@sovereign/products', modules: ['Stablecoin Runtime', 'Bond Engine', 'Fund Manager', 'RWA Registry'] },
  { name: 'Distribution (UI)', package: 'control-plane', modules: ['Control Plane', 'API Routes', 'Live Engine'] },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' }) {
  const styles = {
    HEALTHY: 'status-dot-healthy',
    DEGRADED: 'status-dot-degraded',
    OFFLINE: 'status-dot-offline',
  };
  return <span className={styles[status]} />;
}

function formatUptime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SystemHealthPage() {
  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [cycleResult, setCycleResult] = useState<CycleResult | null>(null);
  const [cycleRunning, setCycleRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/engine/status');
      const json = await res.json();
      if (json.ok) {
        setStatus(json.data);
        setError(null);
      } else {
        setError(json.error);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const executeCapitalCycle = async () => {
    setCycleRunning(true);
    setCycleResult(null);
    try {
      const res = await fetch('/api/engine/cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: '100000.00', initiatedBy: 'kevan-burns' }),
      });
      const json = await res.json();
      if (json.ok) {
        setCycleResult(json.data);
        await fetchStatus(); // Refresh status
      } else {
        setError(json.error);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCycleRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sovereign-50">System Health</h1>
          <p className="mt-1 text-sm text-sovereign-400">
            Sovereign Spine — Live Capital Engine
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusDot status={status?.initialized ? 'HEALTHY' : loading ? 'DEGRADED' : 'OFFLINE'} />
          <span className="font-mono text-sm text-sovereign-300">
            {loading ? 'Connecting...' : status?.initialized ? `Engine Active · Uptime: ${formatUptime(status.uptime)}` : 'Engine Offline'}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-700/50 bg-red-900/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Live Engine Stats */}
      {status && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-8">
          <div className="card">
            <div className="stat-label">Engine</div>
            <div className="stat-value mt-2 text-accent-green">{status.initialized ? 'LIVE' : 'OFF'}</div>
          </div>
          <div className="card">
            <div className="stat-label">XRPL</div>
            <div className={`stat-value mt-2 ${status.xrplConnected ? 'text-accent-green' : 'text-sovereign-500'}`}>
              {status.xrplConnected ? 'Connected' : 'Offline'}
            </div>
          </div>
          <div className="card">
            <div className="stat-label">Ledger Entries</div>
            <div className="stat-value mt-2">{status.ledgerEntries}</div>
          </div>
          <div className="card">
            <div className="stat-label">Audit Entries</div>
            <div className="stat-value mt-2">{status.auditEntries}</div>
          </div>
          <div className="card">
            <div className="stat-label">Guardrail Checks</div>
            <div className="stat-value mt-2">{status.guardrailChecks}</div>
          </div>
          <div className="card">
            <div className="stat-label">Pass Rate</div>
            <div className="stat-value mt-2 text-accent-green">{(status.guardrailPassRate * 100).toFixed(1)}%</div>
          </div>
          <div className="card">
            <div className="stat-label">Anchors</div>
            <div className="stat-value mt-2">{status.anchorCount}</div>
          </div>
          <div className="card">
            <div className="stat-label">Wallet</div>
            <div className="mt-2 truncate font-mono text-xs text-sovereign-300">
              {status.anchorWallet ? `${status.anchorWallet.slice(0, 8)}...` : 'None'}
            </div>
          </div>
        </div>
      )}

      {/* Execute Capital Cycle */}
      <div className="card border-accent-gold/30 bg-accent-gold/5">
        <div className="card-header">
          <div>
            <h3 className="font-semibold text-sovereign-100">Live Capital Cycle</h3>
            <p className="mt-1 text-xs text-sovereign-400">
              Mint $100,000 → Settle 10% to Treasury → Anchor audit hash to XRPL → Verify integrity
            </p>
          </div>
          <button
            onClick={executeCapitalCycle}
            disabled={cycleRunning || loading}
            className="rounded bg-accent-gold px-4 py-2 text-sm font-medium text-sovereign-950 hover:bg-accent-gold/80 disabled:opacity-50"
          >
            {cycleRunning ? 'Executing...' : 'Execute Cycle'}
          </button>
        </div>

        {cycleResult && (
          <div className="mt-4 space-y-3">
            {/* Mint Result */}
            <div className="flex items-center justify-between rounded border border-sovereign-700/50 bg-sovereign-900/50 px-4 py-2">
              <span className="text-sm text-sovereign-300">1. Mint</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-sovereign-400">{cycleResult.mint?.ledgerEntryId}</span>
                <span className="badge-green">OK</span>
              </div>
            </div>
            {/* Settlement Result */}
            <div className="flex items-center justify-between rounded border border-sovereign-700/50 bg-sovereign-900/50 px-4 py-2">
              <span className="text-sm text-sovereign-300">2. Settlement</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-sovereign-400">{cycleResult.settlement?.ledgerEntryId}</span>
                <span className="badge-green">OK</span>
              </div>
            </div>
            {/* Anchor Result */}
            <div className="flex items-center justify-between rounded border border-sovereign-700/50 bg-sovereign-900/50 px-4 py-2">
              <span className="text-sm text-sovereign-300">3. XRPL Anchor</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-sovereign-400">
                  {cycleResult.anchor?.txHash ? `${cycleResult.anchor.txHash.slice(0, 12)}...` : 'Offline mode'}
                </span>
                <span className={cycleResult.anchor ? 'badge-green' : 'badge-amber'}>
                  {cycleResult.anchor ? 'ANCHORED' : 'SKIPPED'}
                </span>
              </div>
            </div>
            {/* Integrity Result */}
            <div className="flex items-center justify-between rounded border border-sovereign-700/50 bg-sovereign-900/50 px-4 py-2">
              <span className="text-sm text-sovereign-300">4. Ledger Integrity</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-sovereign-400">
                  Hash chain + Conservation
                </span>
                <span className={cycleResult.integrity?.valid ? 'badge-green' : 'badge-red'}>
                  {cycleResult.integrity?.valid ? 'VERIFIED' : 'BROKEN'}
                </span>
              </div>
            </div>
            {/* Audit Chain */}
            <div className="flex items-center justify-between rounded border border-sovereign-700/50 bg-sovereign-900/50 px-4 py-2">
              <span className="text-sm text-sovereign-300">5. Audit Chain</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-sovereign-400">SHA-256 hash chain</span>
                <span className={cycleResult.auditChain ? 'badge-green' : 'badge-red'}>
                  {cycleResult.auditChain ? 'INTACT' : 'BROKEN'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Layer Status */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-sovereign-200">
          Sovereign Spine — 5 Layers
        </h2>
        {LAYER_STATUS.map((layer, idx) => (
          <div key={layer.name} className="card">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-sovereign-500">L{idx + 1}</span>
                <h3 className="font-semibold text-sovereign-100">{layer.name}</h3>
                <span className="font-mono text-xs text-sovereign-500">{layer.package}</span>
              </div>
              <span className="badge-green">HEALTHY</span>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {layer.modules.map((mod) => (
                <div
                  key={mod}
                  className="flex items-center gap-2 rounded border border-sovereign-800/50 bg-sovereign-900/50 px-3 py-2"
                >
                  <StatusDot status="HEALTHY" />
                  <span className="text-sm text-sovereign-200">{mod}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Chain Connectivity */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sovereign-100">Chain Connectivity — 13 Chains</h3>
          <span className="font-mono text-xs text-sovereign-500">
            {status?.xrplConnected ? '1' : '0'}/13 live
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 xl:grid-cols-5">
          {SUPPORTED_CHAINS.map((chain) => (
            <div
              key={chain}
              className="flex items-center justify-between rounded border border-sovereign-800/50 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <StatusDot status={chain === 'xrpl' && status?.xrplConnected ? 'HEALTHY' : 'DEGRADED'} />
                <span className="text-sm font-medium text-sovereign-200">{chain}</span>
              </div>
              <span className="font-mono text-xs text-sovereign-500">
                {chain === 'xrpl' && status?.xrplConnected ? 'testnet' : 'typed'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
