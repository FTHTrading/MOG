/**
 * Risk Exposure — Sovereign Control Plane
 */

import { SUPPORTED_CHAINS } from '@sovereign/identity';

const RISK_BY_CHAIN = [
  { chain: 'xrpl', exposure: '$8,400,000', pct: 58, products: 3, status: 'LOW' as const },
  { chain: 'polygon', exposure: '$2,100,000', pct: 15, products: 2, status: 'LOW' as const },
  { chain: 'ethereum', exposure: '$1,800,000', pct: 12, products: 1, status: 'LOW' as const },
  { chain: 'bitcoin', exposure: '$1,200,000', pct: 8, products: 1, status: 'LOW' as const },
  { chain: 'base', exposure: '$640,000', pct: 4, products: 1, status: 'LOW' as const },
  { chain: 'arbitrum', exposure: '$0', pct: 0, products: 0, status: 'NONE' as const },
  { chain: 'stellar', exposure: '$0', pct: 0, products: 0, status: 'NONE' as const },
];

const RISK_BY_PRODUCT = [
  { product: 'FTHUSD Stablecoin', type: 'STABLECOIN', exposure: '$12,140,000', reserved: '$12,636,000', ratio: '104.2%', risk: 'LOW' as const },
  { product: 'Bond Series A', type: 'BOND', exposure: '$1,500,000', reserved: '$1,575,000', ratio: '105.0%', risk: 'LOW' as const },
  { product: 'Growth Fund I', type: 'FUND', exposure: '$890,000', reserved: 'NAV', ratio: '—', risk: 'MEDIUM' as const },
];

const RISK_BY_COUNTERPARTY = [
  { name: 'Circle (USDC)', type: 'STABLECOIN_ISSUER', exposure: '$8,200,000', rating: 'A', status: 'HEALTHY' as const },
  { name: 'Fireblocks', type: 'CUSTODY', exposure: '$25,000,000', rating: 'A+', status: 'HEALTHY' as const },
  { name: 'Coinbase Prime', type: 'EXCHANGE', exposure: '$1,200,000', rating: 'A', status: 'HEALTHY' as const },
  { name: 'Kraken', type: 'EXCHANGE', exposure: '$340,000', rating: 'A-', status: 'HEALTHY' as const },
];

const STRESS_SCENARIOS = [
  { scenario: 'Market Crash (-40%)', impact: '-$4,856,000', survivable: true },
  { scenario: 'Liquidity Crisis', impact: '-$2,140,000', survivable: true },
  { scenario: 'Counterparty Default (Circle)', impact: '-$8,200,000', survivable: false },
  { scenario: 'Chain Outage (XRPL 24hr)', impact: '-$0 (frozen)', survivable: true },
  { scenario: 'Regulatory Freeze (US)', impact: '-$12,140,000', survivable: false },
  { scenario: 'Collateral Depreciation (-30%)', impact: '-$450,000', survivable: true },
];

export default function RiskPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-sovereign-50">Risk Exposure</h1>
        <p className="mt-1 text-sm text-sovereign-400">
          By chain · by product · by counterparty · stress scenarios
        </p>
      </div>

      {/* Risk by Chain */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sovereign-100">Exposure by Chain</h3>
        </div>
        <div className="space-y-3">
          {RISK_BY_CHAIN.filter(c => c.pct > 0).map((chain) => (
            <div key={chain.chain} className="flex items-center gap-4">
              <span className="w-24 text-sm font-medium capitalize text-sovereign-200">{chain.chain}</span>
              <div className="h-3 flex-1 rounded-full bg-sovereign-800">
                <div
                  className="h-3 rounded-full bg-accent-blue"
                  style={{ width: `${chain.pct}%` }}
                />
              </div>
              <span className="w-28 text-right font-mono text-sm text-sovereign-200">{chain.exposure}</span>
              <span className="w-12 text-right font-mono text-xs text-sovereign-500">{chain.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Risk by Product */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sovereign-100">Exposure by Product</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Product</th>
                <th className="table-header">Type</th>
                <th className="table-header">Exposure</th>
                <th className="table-header">Reserved</th>
                <th className="table-header">Ratio</th>
                <th className="table-header">Risk</th>
              </tr>
            </thead>
            <tbody>
              {RISK_BY_PRODUCT.map((p) => (
                <tr key={p.product} className="hover:bg-sovereign-800/30">
                  <td className="table-cell font-semibold text-sovereign-100">{p.product}</td>
                  <td className="table-cell"><span className="badge-blue">{p.type}</span></td>
                  <td className="table-cell font-mono">{p.exposure}</td>
                  <td className="table-cell font-mono">{p.reserved}</td>
                  <td className="table-cell font-mono">{p.ratio}</td>
                  <td className="table-cell">
                    <span className={p.risk === 'LOW' ? 'badge-green' : 'badge-amber'}>{p.risk}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Counterparty Risk */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sovereign-100">Counterparty Exposure</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {RISK_BY_COUNTERPARTY.map((cp) => (
            <div key={cp.name} className="rounded border border-sovereign-800/50 p-4">
              <div className="text-sm font-medium text-sovereign-200">{cp.name}</div>
              <div className="mt-1 text-xs text-sovereign-500">{cp.type}</div>
              <div className="mt-3 font-mono text-lg font-bold text-sovereign-100">{cp.exposure}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-sovereign-500">Rating:</span>
                <span className="font-mono text-xs text-gold-400">{cp.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stress Scenarios */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sovereign-100">Stress Scenarios</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Scenario</th>
                <th className="table-header">Impact</th>
                <th className="table-header">Survivable</th>
              </tr>
            </thead>
            <tbody>
              {STRESS_SCENARIOS.map((s) => (
                <tr key={s.scenario} className="hover:bg-sovereign-800/30">
                  <td className="table-cell text-sm">{s.scenario}</td>
                  <td className="table-cell font-mono text-accent-red">{s.impact}</td>
                  <td className="table-cell">
                    <span className={s.survivable ? 'badge-green' : 'badge-red'}>
                      {s.survivable ? 'YES' : 'NO'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
