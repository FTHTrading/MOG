/**
 * Capital Flow Dashboard — Sovereign Control Plane
 *
 * Visualizes the full capital lifecycle:
 * WIRE_IN → RECONCILED → KYC_PASSED → MINTED → ALLOCATED →
 * PERFORMING → DISTRIBUTION → REDEMPTION → BURNED → WIRE_OUT
 */

import {
  TransactionType,
  SettlementState,
  RedemptionStatus,
  FundingStatus,
  GuardrailType,
} from '@sovereign/ledger';

const CAPITAL_PIPELINE = [
  { stage: 'Wire In', status: 'active', count: 3, volume: '$2,100,000' },
  { stage: 'Reconciled', status: 'active', count: 2, volume: '$1,800,000' },
  { stage: 'KYC Passed', status: 'active', count: 2, volume: '$1,800,000' },
  { stage: 'Minted', status: 'active', count: 1, volume: '$900,000' },
  { stage: 'Allocated', status: 'active', count: 8, volume: '$7,200,000' },
  { stage: 'Performing', status: 'active', count: 12, volume: '$8,400,000' },
  { stage: 'Distribution', status: 'pending', count: 0, volume: '$0' },
  { stage: 'Redemption', status: 'idle', count: 1, volume: '$340,000' },
  { stage: 'Burned', status: 'idle', count: 0, volume: '$0' },
  { stage: 'Wire Out', status: 'idle', count: 1, volume: '$340,000' },
];

const RECENT_TRANSACTIONS = [
  { id: 'TXN-001', type: TransactionType.MINT, amount: '$900,000', currency: 'FTHUSD', status: 'COMPLETED', time: '2 min ago', chain: 'XRPL' },
  { id: 'TXN-002', type: TransactionType.ALLOCATION, amount: '$450,000', currency: 'FTHUSD', status: 'COMPLETED', time: '15 min ago', chain: 'XRPL' },
  { id: 'TXN-003', type: TransactionType.WIRE_IN, amount: '$2,100,000', currency: 'USD', status: 'RECONCILING', time: '1 hr ago', chain: '—' },
  { id: 'TXN-004', type: TransactionType.SETTLEMENT, amount: '$340,000', currency: 'USDC', status: 'EXECUTING', time: '2 hrs ago', chain: 'Polygon' },
  { id: 'TXN-005', type: TransactionType.DISTRIBUTION, amount: '$78,500', currency: 'FTHUSD', status: 'APPROVED', time: '5 hrs ago', chain: 'XRPL' },
  { id: 'TXN-006', type: TransactionType.ANCHOR, amount: '—', currency: '—', status: 'CONFIRMED', time: '6 hrs ago', chain: 'Bitcoin' },
];

const GUARDRAIL_STATUS = [
  { type: GuardrailType.DAILY_MINT_CAP, label: 'Daily Mint Cap', current: '$900,000', limit: '$10,000,000', pct: 9 },
  { type: GuardrailType.RESERVE_RATIO, label: 'Reserve Ratio', current: '104.2%', limit: '≥100%', pct: 100 },
  { type: GuardrailType.CONCENTRATION_LIMIT, label: 'Concentration', current: '8.7%', limit: '≤15%', pct: 58 },
  { type: GuardrailType.VELOCITY_CHECK, label: 'Velocity', current: '12 tx/hr', limit: '≤100 tx/hr', pct: 12 },
];

export default function CapitalFlowPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-sovereign-50">Capital Flow</h1>
        <p className="mt-1 text-sm text-sovereign-400">
          End-to-end capital lifecycle pipeline
        </p>
      </div>

      {/* Capital Pipeline Visual */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sovereign-100">Capital Pipeline</h3>
          <span className="font-mono text-xs text-sovereign-500">
            WIRE_IN → ... → WIRE_OUT
          </span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {CAPITAL_PIPELINE.map((stage, idx) => (
            <div key={stage.stage} className="flex items-center">
              <div
                className={`min-w-[120px] rounded border px-3 py-3 text-center ${
                  stage.status === 'active'
                    ? 'border-accent-green/30 bg-accent-green/5'
                    : stage.status === 'pending'
                    ? 'border-accent-amber/30 bg-accent-amber/5'
                    : 'border-sovereign-700/30 bg-sovereign-900/30'
                }`}
              >
                <div className="text-xs font-medium text-sovereign-300">{stage.stage}</div>
                <div className="mt-1 font-mono text-lg font-bold text-sovereign-100">{stage.count}</div>
                <div className="font-mono text-xs text-sovereign-500">{stage.volume}</div>
              </div>
              {idx < CAPITAL_PIPELINE.length - 1 && (
                <span className="px-1 text-sovereign-600">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Guardrails */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sovereign-100">Active Guardrails</h3>
          <span className="badge-green">All Clear</span>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {GUARDRAIL_STATUS.map((g) => (
            <div key={g.type} className="rounded border border-sovereign-800/50 p-3">
              <div className="text-xs font-medium text-sovereign-400">{g.label}</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-lg font-bold text-sovereign-100">{g.current}</span>
                <span className="font-mono text-xs text-sovereign-500">/ {g.limit}</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-sovereign-800">
                <div
                  className={`h-1.5 rounded-full ${
                    g.pct > 80 ? 'bg-accent-red' : g.pct > 50 ? 'bg-accent-amber' : 'bg-accent-green'
                  }`}
                  style={{ width: `${Math.min(g.pct, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sovereign-100">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">ID</th>
                <th className="table-header">Type</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Currency</th>
                <th className="table-header">Status</th>
                <th className="table-header">Chain</th>
                <th className="table-header">Time</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_TRANSACTIONS.map((tx) => (
                <tr key={tx.id} className="hover:bg-sovereign-800/30">
                  <td className="table-cell font-mono text-xs">{tx.id}</td>
                  <td className="table-cell">
                    <span className="badge-blue">{tx.type}</span>
                  </td>
                  <td className="table-cell font-mono">{tx.amount}</td>
                  <td className="table-cell font-mono text-xs">{tx.currency}</td>
                  <td className="table-cell">
                    <span className={
                      tx.status === 'COMPLETED' ? 'badge-green' :
                      tx.status === 'EXECUTING' || tx.status === 'RECONCILING' ? 'badge-amber' :
                      'badge-blue'
                    }>{tx.status}</span>
                  </td>
                  <td className="table-cell text-xs">{tx.chain}</td>
                  <td className="table-cell text-xs text-sovereign-400">{tx.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
