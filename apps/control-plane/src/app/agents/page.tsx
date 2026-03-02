/**
 * Agent Governance — Sovereign Control Plane
 *
 * The missing layer — now built. Tracks all AI agents:
 * - Registration & sandbox policies
 * - Decision audit trail (hash-chained)
 * - Override controls
 * - Health monitoring
 */

import { AgentType, Role } from '@sovereign/identity';

type AgentHealth = 'HEALTHY' | 'DEGRADED' | 'SUSPENDED';

const REGISTERED_AGENTS: Array<{
  agentId: string; type: AgentType; name: string; role: Role;
  isActive: boolean; actionsToday: number; maxPerDay: number;
  approvalThreshold: string; health: AgentHealth; lastAction: string;
  decisions: number; overrides: number;
}> = [
  {
    agentId: 'agent-capital-001',
    type: AgentType.CAPITAL,
    name: 'Capital Allocation Agent',
    role: Role.AGENT,
    isActive: true,
    actionsToday: 14,
    maxPerDay: 100,
    approvalThreshold: '$50,000',
    health: 'HEALTHY' as const,
    lastAction: '12 min ago',
    decisions: 847,
    overrides: 3,
  },
  {
    agentId: 'agent-compliance-001',
    type: AgentType.COMPLIANCE,
    name: 'Compliance Review Agent',
    role: Role.COMPLIANCE_OFFICER,
    isActive: true,
    actionsToday: 47,
    maxPerDay: 500,
    approvalThreshold: '$0',
    health: 'HEALTHY' as const,
    lastAction: '2 min ago',
    decisions: 2_341,
    overrides: 0,
  },
  {
    agentId: 'agent-risk-001',
    type: AgentType.RISK,
    name: 'Risk Assessment Agent',
    role: Role.AGENT,
    isActive: true,
    actionsToday: 8,
    maxPerDay: 50,
    approvalThreshold: '$100,000',
    health: 'HEALTHY' as const,
    lastAction: '1 hr ago',
    decisions: 392,
    overrides: 1,
  },
  {
    agentId: 'agent-discovery-001',
    type: AgentType.DISCOVERY,
    name: 'Funding Discovery Agent',
    role: Role.AGENT,
    isActive: true,
    actionsToday: 3,
    maxPerDay: 20,
    approvalThreshold: '$0',
    health: 'HEALTHY' as const,
    lastAction: '3 hrs ago',
    decisions: 156,
    overrides: 0,
  },
  {
    agentId: 'agent-writing-001',
    type: AgentType.WRITING,
    name: 'Proposal Writing Agent',
    role: Role.AGENT,
    isActive: false,
    actionsToday: 0,
    maxPerDay: 10,
    approvalThreshold: '$0',
    health: 'SUSPENDED' as const,
    lastAction: '2 days ago',
    decisions: 89,
    overrides: 0,
  },
  {
    agentId: 'agent-marketing-001',
    type: AgentType.MARKETING,
    name: 'Helios Marketing Agent',
    role: Role.AGENT,
    isActive: true,
    actionsToday: 5,
    maxPerDay: 30,
    approvalThreshold: '$0',
    health: 'HEALTHY' as const,
    lastAction: '45 min ago',
    decisions: 213,
    overrides: 2,
  },
];

const RECENT_DECISIONS = [
  { id: 'dec-001', agent: 'Compliance Review', action: 'KYC_EVALUATION', module: 'compliance:kyc', confidence: 0.97, approved: true, humanRequired: false, time: '2 min ago' },
  { id: 'dec-002', agent: 'Capital Allocation', action: 'ALLOCATION_RECOMMEND', module: 'capital:allocation', confidence: 0.89, approved: true, humanRequired: false, time: '12 min ago' },
  { id: 'dec-003', agent: 'Risk Assessment', action: 'RISK_SCORING', module: 'compliance:aml', confidence: 0.94, approved: true, humanRequired: false, time: '1 hr ago' },
  { id: 'dec-004', agent: 'Capital Allocation', action: 'LARGE_ALLOCATION', module: 'capital:allocation', confidence: 0.82, approved: false, humanRequired: true, time: '2 hrs ago' },
  { id: 'dec-005', agent: 'Helios Marketing', action: 'CONTENT_REVIEW', module: 'compliance:marketing', confidence: 0.91, approved: true, humanRequired: false, time: '45 min ago' },
];

export default function AgentsPage() {
  const activeAgents = REGISTERED_AGENTS.filter(a => a.isActive).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sovereign-50">Agent Governance</h1>
          <p className="mt-1 text-sm text-sovereign-400">
            AI agent registry — sandbox enforcement — decision audit trail
          </p>
        </div>
        <span className="badge-green">{activeAgents}/{REGISTERED_AGENTS.length} Active</span>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {REGISTERED_AGENTS.map((agent) => (
          <div
            key={agent.agentId}
            className={`card ${!agent.isActive ? 'border-sovereign-700/30 opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={agent.health === 'HEALTHY' ? 'status-dot-healthy' : agent.health === 'DEGRADED' ? 'status-dot-degraded' : 'status-dot-offline'} />
                <h3 className="font-semibold text-sovereign-100">{agent.name}</h3>
              </div>
              <span className={agent.isActive ? 'badge-green' : 'badge-red'}>
                {agent.health}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-sovereign-500">Type</div>
                <div className="text-sm text-sovereign-200">{agent.type}</div>
              </div>
              <div>
                <div className="text-xs text-sovereign-500">Role</div>
                <div className="text-sm text-sovereign-200">{agent.role}</div>
              </div>
              <div>
                <div className="text-xs text-sovereign-500">Actions Today</div>
                <div className="font-mono text-sm text-sovereign-200">
                  {agent.actionsToday} / {agent.maxPerDay}
                </div>
              </div>
              <div>
                <div className="text-xs text-sovereign-500">Approval Threshold</div>
                <div className="font-mono text-sm text-sovereign-200">{agent.approvalThreshold}</div>
              </div>
              <div>
                <div className="text-xs text-sovereign-500">Total Decisions</div>
                <div className="font-mono text-sm text-sovereign-200">{agent.decisions.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-sovereign-500">Human Overrides</div>
                <div className="font-mono text-sm text-sovereign-200">{agent.overrides}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-sovereign-800/30 pt-3">
              <span className="text-xs text-sovereign-500">Last action: {agent.lastAction}</span>
              <button className="text-xs text-accent-red hover:text-accent-red/80">
                {agent.isActive ? 'Suspend' : 'Reactivate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Decisions */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sovereign-100">Recent Decisions (Hash-Chained)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">ID</th>
                <th className="table-header">Agent</th>
                <th className="table-header">Action</th>
                <th className="table-header">Module</th>
                <th className="table-header">Confidence</th>
                <th className="table-header">Status</th>
                <th className="table-header">Human Required</th>
                <th className="table-header">Time</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_DECISIONS.map((dec) => (
                <tr key={dec.id} className="hover:bg-sovereign-800/30">
                  <td className="table-cell font-mono text-xs">{dec.id}</td>
                  <td className="table-cell text-sm">{dec.agent}</td>
                  <td className="table-cell font-mono text-xs">{dec.action}</td>
                  <td className="table-cell font-mono text-xs">{dec.module}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-sovereign-800">
                        <div
                          className={`h-1.5 rounded-full ${dec.confidence > 0.9 ? 'bg-accent-green' : 'bg-accent-amber'}`}
                          style={{ width: `${dec.confidence * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs">{(dec.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={dec.approved ? 'badge-green' : 'badge-amber'}>
                      {dec.approved ? 'EXECUTED' : 'PENDING'}
                    </span>
                  </td>
                  <td className="table-cell text-center">
                    {dec.humanRequired ? <span className="badge-amber">YES</span> : <span className="text-xs text-sovereign-500">No</span>}
                  </td>
                  <td className="table-cell text-xs text-sovereign-400">{dec.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
