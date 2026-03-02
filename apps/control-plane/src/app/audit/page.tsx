/**
 * Audit Trail — Sovereign Control Plane
 *
 * Hash-chained, signed audit log explorer.
 * Every entry references the previous entry's hash — tamper-evident.
 */

import { AuditAction, Role, ModuleCategory } from '@sovereign/identity';

const AUDIT_CHAIN_STATUS = {
  totalEntries: 12_847,
  chainValid: true,
  lastVerified: new Date().toISOString(),
  firstEntry: '2025-06-15T00:00:00Z',
  latestEntry: new Date().toISOString(),
};

const RECENT_AUDIT_ENTRIES = [
  { seq: 12847, action: AuditAction.MINT_COMPLETED, actor: 'treasury-mgr-01', role: Role.TREASURY_MANAGER, module: ModuleCategory.MINT, target: 'acct-47', hash: 'a3f8...c291', prevHash: 'b7e2...d483', time: '2 min ago' },
  { seq: 12846, action: AuditAction.COMPLIANCE_CHECK_PASSED, actor: 'agent-compliance-001', role: Role.AGENT, module: ModuleCategory.KYC, target: 'identity-47', hash: 'b7e2...d483', prevHash: 'c1d9...e744', time: '2 min ago' },
  { seq: 12845, action: AuditAction.ALLOCATION_CREATED, actor: 'ops-01', role: Role.OPERATIONS, module: ModuleCategory.ALLOCATION, target: 'alloc-289', hash: 'c1d9...e744', prevHash: 'd4a7...f821', time: '15 min ago' },
  { seq: 12844, action: AuditAction.KYC_APPROVED, actor: 'compliance-01', role: Role.COMPLIANCE_OFFICER, module: ModuleCategory.KYC, target: 'identity-47', hash: 'd4a7...f821', prevHash: 'e8b3...a109', time: '30 min ago' },
  { seq: 12843, action: AuditAction.SETTLEMENT_INITIATED, actor: 'treasury-mgr-01', role: Role.TREASURY_MANAGER, module: ModuleCategory.SETTLEMENT, target: 'sett-92', hash: 'e8b3...a109', prevHash: 'f2c6...b567', time: '1 hr ago' },
  { seq: 12842, action: AuditAction.AGENT_DECISION, actor: 'agent-risk-001', role: Role.AGENT, module: ModuleCategory.RISK_AGENT, target: 'eval-301', hash: 'f2c6...b567', prevHash: 'a1d8...c234', time: '1 hr ago' },
  { seq: 12841, action: AuditAction.KEY_ROTATED, actor: 'system', role: Role.SUPER_ADMIN, module: ModuleCategory.AUTH, target: 'hsm-006', hash: 'a1d8...c234', prevHash: 'b9e4...d891', time: '2 hrs ago' },
  { seq: 12840, action: AuditAction.NAMESPACE_REGISTERED, actor: 'admin-01', role: Role.ADMIN, module: ModuleCategory.NAMESPACE, target: 'vaughan.capital', hash: 'b9e4...d891', prevHash: 'c7f2...e456', time: '3 hrs ago' },
];

export default function AuditPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sovereign-50">Audit Trail</h1>
          <p className="mt-1 text-sm text-sovereign-400">
            Hash-chained · Signed · Tamper-evident · Anchored
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={AUDIT_CHAIN_STATUS.chainValid ? 'status-dot-healthy' : 'status-dot-offline'} />
            <span className="text-sm text-sovereign-300">
              Chain Integrity: {AUDIT_CHAIN_STATUS.chainValid ? 'Valid' : 'BROKEN'}
            </span>
          </div>
          <button className="rounded border border-sovereign-600 px-3 py-1.5 text-xs text-sovereign-300 hover:bg-sovereign-800">
            Export Bundle
          </button>
        </div>
      </div>

      {/* Chain Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card">
          <div className="stat-label">Total Entries</div>
          <div className="stat-value mt-2">{AUDIT_CHAIN_STATUS.totalEntries.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="stat-label">Chain Valid</div>
          <div className="stat-value mt-2 text-accent-green">✓</div>
        </div>
        <div className="card">
          <div className="stat-label">First Entry</div>
          <div className="mt-2 font-mono text-sm text-sovereign-200">2025-06-15</div>
        </div>
        <div className="card">
          <div className="stat-label">Last Verified</div>
          <div className="mt-2 font-mono text-sm text-sovereign-200">Just now</div>
        </div>
      </div>

      {/* Audit Entries */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sovereign-100">Recent Entries</h3>
          <span className="font-mono text-xs text-sovereign-500">
            Hash chain seq #{AUDIT_CHAIN_STATUS.totalEntries}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Seq</th>
                <th className="table-header">Action</th>
                <th className="table-header">Actor</th>
                <th className="table-header">Role</th>
                <th className="table-header">Module</th>
                <th className="table-header">Target</th>
                <th className="table-header">Hash</th>
                <th className="table-header">Prev Hash</th>
                <th className="table-header">Time</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_AUDIT_ENTRIES.map((entry) => (
                <tr key={entry.seq} className="hover:bg-sovereign-800/30">
                  <td className="table-cell font-mono text-xs text-gold-400">#{entry.seq}</td>
                  <td className="table-cell">
                    <span className="badge-blue text-[10px]">{entry.action}</span>
                  </td>
                  <td className="table-cell font-mono text-xs">{entry.actor}</td>
                  <td className="table-cell text-xs">{entry.role}</td>
                  <td className="table-cell font-mono text-xs text-sovereign-400">{entry.module}</td>
                  <td className="table-cell font-mono text-xs">{entry.target}</td>
                  <td className="table-cell font-mono text-[10px] text-accent-green">{entry.hash}</td>
                  <td className="table-cell font-mono text-[10px] text-sovereign-500">{entry.prevHash}</td>
                  <td className="table-cell text-xs text-sovereign-400">{entry.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hash Chain Visual */}
        <div className="mt-4 border-t border-sovereign-800/30 pt-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {RECENT_AUDIT_ENTRIES.slice(0, 5).map((entry, idx) => (
              <div key={entry.seq} className="flex items-center">
                <div className="rounded border border-sovereign-700/50 bg-sovereign-900/50 px-3 py-2 text-center">
                  <div className="font-mono text-[10px] text-gold-400">#{entry.seq}</div>
                  <div className="font-mono text-[10px] text-accent-green">{entry.hash}</div>
                </div>
                {idx < 4 && (
                  <span className="px-2 font-mono text-xs text-sovereign-600">←</span>
                )}
              </div>
            ))}
            <span className="px-2 font-mono text-xs text-sovereign-600">← ... ← #1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
