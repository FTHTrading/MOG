/**
 * Sovereign Control Plane — System Health Dashboard
 *
 * The root page. Shows:
 * - System-wide health status
 * - Module availability across all 5 layers
 * - Chain connectivity
 * - Key authority status
 * - Active guardrails
 */

import { SystemMode, ModuleCategory, SUPPORTED_CHAINS } from '@sovereign/identity';
import type { ConnectionState } from '@sovereign/ledger';

// ─── Mock Data (replaced by live runtime in production) ────────────────────────

const SYSTEM_STATUS = {
  mode: SystemMode.ISSUER,
  uptime: '99.97%',
  lastHealthCheck: new Date().toISOString(),
};

const LAYER_STATUS = [
  {
    name: 'Identity & Authority',
    package: '@sovereign/identity',
    status: 'HEALTHY' as const,
    modules: [
      { name: 'RBAC Engine', status: 'HEALTHY' as const, lastPing: '12ms' },
      { name: 'Namespace Registry', status: 'HEALTHY' as const, lastPing: '18ms' },
      { name: 'Key Authority (HSM)', status: 'HEALTHY' as const, lastPing: '45ms' },
      { name: 'Key Authority (MPC)', status: 'HEALTHY' as const, lastPing: '120ms' },
      { name: 'Audit Logger', status: 'HEALTHY' as const, lastPing: '8ms' },
      { name: 'Agent Registry', status: 'HEALTHY' as const, lastPing: '15ms' },
      { name: 'VC Issuer', status: 'HEALTHY' as const, lastPing: '22ms' },
    ],
  },
  {
    name: 'Ledger & Settlement',
    package: '@sovereign/ledger',
    status: 'HEALTHY' as const,
    modules: [
      { name: 'Sovereign Ledger', status: 'HEALTHY' as const, lastPing: '6ms' },
      { name: 'XRPL Connection Pool', status: 'HEALTHY' as const, lastPing: '85ms' },
      { name: 'Mint Service', status: 'HEALTHY' as const, lastPing: '14ms' },
      { name: 'Burn Service', status: 'HEALTHY' as const, lastPing: '14ms' },
      { name: 'Settlement Engine', status: 'HEALTHY' as const, lastPing: '20ms' },
      { name: 'Wire Reconciliation', status: 'HEALTHY' as const, lastPing: '35ms' },
      { name: 'Escrow Manager', status: 'HEALTHY' as const, lastPing: '25ms' },
    ],
  },
  {
    name: 'Compliance & Guardrails',
    package: '@sovereign/compliance',
    status: 'HEALTHY' as const,
    modules: [
      { name: 'Rule Engine', status: 'HEALTHY' as const, lastPing: '10ms' },
      { name: 'Howey Analyzer', status: 'HEALTHY' as const, lastPing: '180ms' },
      { name: 'KYC/AML Gate', status: 'HEALTHY' as const, lastPing: '15ms' },
      { name: 'Guardrails', status: 'HEALTHY' as const, lastPing: '5ms' },
    ],
  },
  {
    name: 'Product Factory',
    package: '@sovereign/products',
    status: 'HEALTHY' as const,
    modules: [
      { name: 'Stablecoin Runtime', status: 'HEALTHY' as const, lastPing: '12ms' },
      { name: 'Bond Engine', status: 'HEALTHY' as const, lastPing: '18ms' },
      { name: 'Fund Manager', status: 'HEALTHY' as const, lastPing: '14ms' },
      { name: 'RWA Registry', status: 'DEGRADED' as const, lastPing: '350ms' },
    ],
  },
  {
    name: 'Distribution (UI)',
    package: '@sovereign/ui',
    status: 'HEALTHY' as const,
    modules: [
      { name: 'Control Plane', status: 'HEALTHY' as const, lastPing: '—' },
      { name: 'Client Portal', status: 'HEALTHY' as const, lastPing: '—' },
      { name: 'Admin Portal', status: 'HEALTHY' as const, lastPing: '—' },
      { name: 'Marketing Site', status: 'HEALTHY' as const, lastPing: '—' },
    ],
  },
];

const CHAIN_STATUS = SUPPORTED_CHAINS.map((chain) => ({
  chain,
  connected: chain !== 'cardano' && chain !== 'tron',
  ledgerIndex: chain === 'xrpl' ? 95_432_187 : undefined,
  latency: chain === 'xrpl' ? '85ms' : chain === 'bitcoin' ? '2100ms' : '120ms',
  lastBlock: new Date(Date.now() - Math.random() * 60000).toISOString(),
}));

const CAPITAL_SUMMARY = {
  totalMinted: '$14,280,000',
  totalBurned: '$2,140,000',
  outstanding: '$12,140,000',
  escrowLocked: '$3,200,000',
  dailyVolume: '$890,000',
  pendingSettlements: 7,
};

function StatusBadge({ status }: { status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' }) {
  const styles = {
    HEALTHY: 'badge-green',
    DEGRADED: 'badge-amber',
    OFFLINE: 'badge-red',
  };
  return <span className={styles[status]}>{status}</span>;
}

function StatusDot({ status }: { status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' }) {
  const styles = {
    HEALTHY: 'status-dot-healthy',
    DEGRADED: 'status-dot-degraded',
    OFFLINE: 'status-dot-offline',
  };
  return <span className={styles[status]} />;
}

export default function SystemHealthPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sovereign-50">System Health</h1>
          <p className="mt-1 text-sm text-sovereign-400">
            Sovereign Spine — All layers operational
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusDot status="HEALTHY" />
          <span className="font-mono text-sm text-sovereign-300">
            Mode: {SYSTEM_STATUS.mode} · Uptime: {SYSTEM_STATUS.uptime}
          </span>
        </div>
      </div>

      {/* Capital Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {Object.entries(CAPITAL_SUMMARY).map(([key, value]) => (
          <div key={key} className="card">
            <div className="stat-label">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div className="stat-value mt-2 text-xl">
              {typeof value === 'number' ? value : value}
            </div>
          </div>
        ))}
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
              <StatusBadge status={layer.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {layer.modules.map((mod) => (
                <div
                  key={mod.name}
                  className="flex items-center justify-between rounded border border-sovereign-800/50 bg-sovereign-900/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <StatusDot status={mod.status} />
                    <span className="text-sm text-sovereign-200">{mod.name}</span>
                  </div>
                  <span className="font-mono text-xs text-sovereign-500">{mod.lastPing}</span>
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
            {CHAIN_STATUS.filter((c) => c.connected).length}/13 connected
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 xl:grid-cols-5">
          {CHAIN_STATUS.map((chain) => (
            <div
              key={chain.chain}
              className="flex items-center justify-between rounded border border-sovereign-800/50 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <StatusDot status={chain.connected ? 'HEALTHY' : 'OFFLINE'} />
                <span className="text-sm font-medium text-sovereign-200">{chain.chain}</span>
              </div>
              <span className="font-mono text-xs text-sovereign-500">{chain.latency}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
