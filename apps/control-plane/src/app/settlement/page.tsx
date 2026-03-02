/**
 * Settlement Dashboard — Sovereign Control Plane
 */

import { SettlementState } from '@sovereign/ledger';

const SETTLEMENT_PIPELINE = [
  { state: SettlementState.CREATED, count: 2 },
  { state: SettlementState.VALIDATED, count: 1 },
  { state: SettlementState.ROUTED, count: 1 },
  { state: SettlementState.EXECUTING, count: 3 },
  { state: SettlementState.SETTLED, count: 142 },
  { state: SettlementState.FAILED, count: 0 },
  { state: SettlementState.CANCELLED, count: 1 },
];

const ACTIVE_SETTLEMENTS = [
  { id: 'SETT-092', from: 'Treasury', to: 'Client Acct #47', amount: '$340,000', currency: 'USDC', chain: 'Polygon', state: SettlementState.EXECUTING, initiated: '2 hrs ago' },
  { id: 'SETT-093', from: 'Omnibus', to: 'Settlement Pool', amount: '$890,000', currency: 'FTHUSD', chain: 'XRPL', state: SettlementState.EXECUTING, initiated: '1 hr ago' },
  { id: 'SETT-094', from: 'Reserve', to: 'Circle Treasury', amount: '$1,200,000', currency: 'USDC', chain: 'Ethereum', state: SettlementState.EXECUTING, initiated: '45 min ago' },
  { id: 'SETT-095', from: 'Escrow', to: 'Client Acct #12', amount: '$150,000', currency: 'FTHUSD', chain: 'XRPL', state: SettlementState.ROUTED, initiated: '30 min ago' },
  { id: 'SETT-096', from: 'Treasury', to: 'Wire Out', amount: '$500,000', currency: 'USD', chain: '—', state: SettlementState.VALIDATED, initiated: '15 min ago' },
  { id: 'SETT-097', from: 'Client Acct #33', to: 'Redemption Pool', amount: '$75,000', currency: 'FTHUSD', chain: 'XRPL', state: SettlementState.CREATED, initiated: '5 min ago' },
  { id: 'SETT-098', from: 'Wire In', to: 'Omnibus', amount: '$2,100,000', currency: 'USD', chain: '—', state: SettlementState.CREATED, initiated: '2 min ago' },
];

export default function SettlementPage() {
  const activeCount = ACTIVE_SETTLEMENTS.filter(
    s => s.state !== SettlementState.SETTLED && s.state !== SettlementState.CANCELLED
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-sovereign-50">Settlement</h1>
        <p className="mt-1 text-sm text-sovereign-400">
          Settlement state machine — {activeCount} active intents
        </p>
      </div>

      {/* State Machine Visual */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sovereign-100">Settlement State Machine</h3>
        </div>
        <div className="flex items-center justify-center gap-2 py-4">
          {SETTLEMENT_PIPELINE.map((s, idx) => (
            <div key={s.state} className="flex items-center">
              <div className={`rounded border px-4 py-3 text-center ${
                s.count > 0 && s.state !== SettlementState.SETTLED
                  ? 'border-accent-blue/30 bg-accent-blue/5'
                  : s.state === SettlementState.FAILED
                  ? 'border-accent-red/30 bg-accent-red/5'
                  : 'border-sovereign-700/30'
              }`}>
                <div className="text-xs font-medium text-sovereign-400">{s.state}</div>
                <div className="mt-1 font-mono text-2xl font-bold text-sovereign-100">{s.count}</div>
              </div>
              {idx < SETTLEMENT_PIPELINE.length - 1 && (
                <span className="px-1 text-sovereign-600">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Settlements Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sovereign-100">Active Settlement Intents</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">ID</th>
                <th className="table-header">From</th>
                <th className="table-header">To</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Currency</th>
                <th className="table-header">Chain</th>
                <th className="table-header">State</th>
                <th className="table-header">Initiated</th>
              </tr>
            </thead>
            <tbody>
              {ACTIVE_SETTLEMENTS.map((s) => (
                <tr key={s.id} className="hover:bg-sovereign-800/30">
                  <td className="table-cell font-mono text-xs">{s.id}</td>
                  <td className="table-cell text-sm">{s.from}</td>
                  <td className="table-cell text-sm">{s.to}</td>
                  <td className="table-cell font-mono">{s.amount}</td>
                  <td className="table-cell font-mono text-xs">{s.currency}</td>
                  <td className="table-cell text-xs">{s.chain}</td>
                  <td className="table-cell">
                    <span className={
                      s.state === SettlementState.EXECUTING ? 'badge-amber' :
                      s.state === SettlementState.SETTLED ? 'badge-green' :
                      s.state === SettlementState.FAILED ? 'badge-red' :
                      'badge-blue'
                    }>{s.state}</span>
                  </td>
                  <td className="table-cell text-xs text-sovereign-400">{s.initiated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
