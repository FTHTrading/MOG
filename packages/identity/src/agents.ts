/**
 * @sovereign/identity — Agent Governance
 *
 * NEW MODULE — fills the "AI Agent Governance" gap identified in the blueprint.
 *
 * Every AI agent in the system must register here and operate within
 * its sandbox. No agent can exceed its governance thresholds without
 * human approval.
 */

import { Role, Permission, ModuleCategory, SupportedChain } from './types';

// ─── Agent Types ───────────────────────────────────────────────────────────────

export enum AgentType {
  CAPITAL = 'CAPITAL',
  COMPLIANCE = 'COMPLIANCE',
  RISK = 'RISK',
  DISCOVERY = 'DISCOVERY',
  WRITING = 'WRITING',
  ORCHESTRATOR = 'ORCHESTRATOR',
  MARKETING = 'MARKETING',
  SETTLEMENT = 'SETTLEMENT',
}

// ─── Agent Governance Policy ───────────────────────────────────────────────────

export interface AgentGovernancePolicy {
  agentId: string;
  type: AgentType;
  name: string;
  version: string;

  // Identity
  assignedRole: Role;
  allowedPermissions: Permission[];

  // Sandbox boundaries
  allowedModules: ModuleCategory[];
  allowedChains: SupportedChain[];
  maxAutoActionsPerHour: number;
  maxAutoActionsPerDay: number;
  requireHumanApprovalAboveUsd: number;

  // Prohibited actions
  prohibitedActions: string[];

  // Audit
  logAllDecisions: boolean;
  hashInputsOutputs: boolean;
  anchorDecisions: boolean;

  // Compliance
  complianceCheckRequired: boolean;
  jurisdictionRestrictions: string[];

  // Operational
  isActive: boolean;
  deployedAt: string;
  lastHealthCheck: string;
}

// ─── Agent Decision Record ─────────────────────────────────────────────────────

export interface AgentDecisionRecord {
  id: string;
  agentId: string;
  agentType: AgentType;

  // Decision
  action: string;
  module: ModuleCategory;
  inputHash: string;
  outputHash: string;
  confidence: number; // 0-1
  reasoning: string;

  // Governance
  withinSandbox: boolean;
  humanApprovalRequired: boolean;
  humanApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  humanApprovalBy?: string;

  // Audit chain
  contentHash: string;
  previousDecisionHash: string;
  sequenceNumber: number;

  // Anchor
  anchorHash?: string;
  anchorChain?: string;

  timestamp: string;
}

// ─── Agent Registry Interface ──────────────────────────────────────────────────

export interface AgentRegistry {
  /**
   * Register a new agent with its governance policy.
   */
  register(policy: AgentGovernancePolicy): Promise<void>;

  /**
   * Get the governance policy for an agent.
   */
  getPolicy(agentId: string): Promise<AgentGovernancePolicy | null>;

  /**
   * Update an agent's governance policy.
   */
  updatePolicy(agentId: string, updates: Partial<AgentGovernancePolicy>): Promise<void>;

  /**
   * Check if an agent action is within its sandbox.
   */
  checkSandbox(agentId: string, action: string, module: ModuleCategory): Promise<SandboxCheckResult>;

  /**
   * Record an agent decision (hash-chained).
   */
  recordDecision(decision: Omit<AgentDecisionRecord, 'id' | 'contentHash' | 'previousDecisionHash' | 'sequenceNumber'>): Promise<AgentDecisionRecord>;

  /**
   * Query agent decisions with filters.
   */
  queryDecisions(filters: AgentDecisionFilters): Promise<AgentDecisionRecord[]>;

  /**
   * Suspend an agent immediately.
   */
  suspend(agentId: string, reason: string): Promise<void>;

  /**
   * List all registered agents with status.
   */
  listAgents(): Promise<AgentStatus[]>;
}

export interface SandboxCheckResult {
  allowed: boolean;
  violations: string[];
  requiresHumanApproval: boolean;
  dailyActionsRemaining: number;
}

export interface AgentDecisionFilters {
  agentId?: string;
  agentType?: AgentType;
  module?: ModuleCategory;
  humanApprovalRequired?: boolean;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

export interface AgentStatus {
  agentId: string;
  type: AgentType;
  name: string;
  isActive: boolean;
  actionsToday: number;
  lastAction: string;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'SUSPENDED' | 'OFFLINE';
}
