/**
 * Compliance Console — Sovereign Control Plane
 *
 * Rule engine dashboard:
 * - Active rule count by category
 * - Recent evaluations (pass/fail)
 * - Guardrail status
 * - Howey analysis summary
 */

import { RuleCategory } from '@sovereign/compliance';

const RULE_CATEGORIES = [
  { category: RuleCategory.AML_KYC, active: 8, total: 8 },
  { category: RuleCategory.SECURITIES, active: 5, total: 6 },
  { category: RuleCategory.HOWEY, active: 4, total: 4 },
  { category: RuleCategory.GDPR, active: 6, total: 6 },
  { category: RuleCategory.CCPA, active: 3, total: 3 },
  { category: RuleCategory.MARKETING_COMPLIANCE, active: 7, total: 7 },
  { category: RuleCategory.US_FEDERAL, active: 4, total: 4 },
  { category: RuleCategory.DOMINICAN_REPUBLIC, active: 2, total: 3 },
  { category: RuleCategory.GUARDRAILS, active: 6, total: 6 },
  { category: RuleCategory.ACCREDITATION, active: 3, total: 3 },
];

const RECENT_EVALUATIONS = [
  { id: 'eval-001', type: 'Transaction', subject: 'MINT $900K FTHUSD', verdict: 'PASS', rules: 12, violations: 0, time: '2 min ago' },
  { id: 'eval-002', type: 'Identity', subject: 'KYC Review — Investor #47', verdict: 'PASS', rules: 8, violations: 0, time: '15 min ago' },
  { id: 'eval-003', type: 'Marketing', subject: 'Website copy update', verdict: 'WARN', rules: 7, violations: 0, time: '1 hr ago', warnings: 2 },
  { id: 'eval-004', type: 'Product', subject: 'Bond Series B launch', verdict: 'PASS', rules: 15, violations: 0, time: '3 hrs ago' },
  { id: 'eval-005', type: 'Transaction', subject: 'ALLOCATION $450K', verdict: 'PASS', rules: 10, violations: 0, time: '4 hrs ago' },
  { id: 'eval-006', type: 'Jurisdiction', subject: 'DR investor onboard', verdict: 'BLOCK', rules: 3, violations: 1, time: '6 hrs ago' },
];

const COMPLIANCE_STATS = {
  evaluationsToday: 47,
  passRate: '95.7%',
  blockingViolations: 1,
  warnings: 3,
  activeRules: 48,
  totalRules: 50,
};

export default function CompliancePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-sovereign-50">Compliance Console</h1>
        <p className="mt-1 text-sm text-sovereign-400">
          YAML-driven rule engine + Howey analysis + guardrails
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {Object.entries(COMPLIANCE_STATS).map(([key, value]) => (
          <div key={key} className="card">
            <div className="stat-label">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
            <div className="stat-value mt-2 text-xl">{value}</div>
          </div>
        ))}
      </div>

      {/* Rule Categories */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sovereign-100">Rule Categories</h3>
          <span className="font-mono text-xs text-sovereign-500">
            {RULE_CATEGORIES.reduce((a, c) => a + c.active, 0)} active rules
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {RULE_CATEGORIES.map((cat) => (
            <div key={cat.category} className="rounded border border-sovereign-800/50 p-3">
              <div className="text-xs font-medium text-sovereign-400">{cat.category}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-mono text-lg font-bold text-sovereign-100">{cat.active}</span>
                <span className="font-mono text-xs text-sovereign-500">/ {cat.total}</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-sovereign-800">
                <div
                  className="h-1.5 rounded-full bg-accent-green"
                  style={{ width: `${(cat.active / cat.total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Evaluations */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sovereign-100">Recent Evaluations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">ID</th>
                <th className="table-header">Type</th>
                <th className="table-header">Subject</th>
                <th className="table-header">Verdict</th>
                <th className="table-header">Rules Checked</th>
                <th className="table-header">Violations</th>
                <th className="table-header">Time</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_EVALUATIONS.map((ev) => (
                <tr key={ev.id} className="hover:bg-sovereign-800/30">
                  <td className="table-cell font-mono text-xs">{ev.id}</td>
                  <td className="table-cell text-sm">{ev.type}</td>
                  <td className="table-cell text-sm">{ev.subject}</td>
                  <td className="table-cell">
                    <span className={
                      ev.verdict === 'PASS' ? 'badge-green' :
                      ev.verdict === 'WARN' ? 'badge-amber' :
                      'badge-red'
                    }>{ev.verdict}</span>
                  </td>
                  <td className="table-cell text-center font-mono">{ev.rules}</td>
                  <td className="table-cell text-center font-mono">{ev.violations}</td>
                  <td className="table-cell text-xs text-sovereign-400">{ev.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
