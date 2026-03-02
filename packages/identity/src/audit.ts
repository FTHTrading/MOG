/**
 * @sovereign/identity — Hash-Chained Audit Log
 *
 * MERGED FROM:
 *   4100-DR/packages/audit/ (hash-chained, signed bundles — most institutional)
 *   circle-superapp/src/lib/mog-os/types.ts AuditLogEntry (richest event taxonomy)
 *   fth-capital-os/core/audit-log.ts (AuditEventType enum)
 *
 * INVARIANT: Every audit entry is hash-chained. previousEntryHash creates
 *            a tamper-evident chain. Breaking any link invalidates downstream.
 */

import { Role, Permission, ModuleCategory } from './types';

// ─── Audit Actions (superset of all repos) ──────────────────────────────────

export enum AuditAction {
  // Auth
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_VERIFIED = 'MFA_VERIFIED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Identity
  IDENTITY_CREATED = 'IDENTITY_CREATED',
  IDENTITY_UPDATED = 'IDENTITY_UPDATED',
  IDENTITY_VERIFIED = 'IDENTITY_VERIFIED',
  IDENTITY_SUSPENDED = 'IDENTITY_SUSPENDED',
  IDENTITY_RESTORED = 'IDENTITY_RESTORED',
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',
  ROLE_REVOKED = 'ROLE_REVOKED',

  // KYC
  KYC_SUBMITTED = 'KYC_SUBMITTED',
  KYC_APPROVED = 'KYC_APPROVED',
  KYC_REJECTED = 'KYC_REJECTED',
  KYC_EXPIRED = 'KYC_EXPIRED',

  // Client
  CLIENT_CREATED = 'CLIENT_CREATED',
  CLIENT_UPDATED = 'CLIENT_UPDATED',
  CLIENT_ONBOARDED = 'CLIENT_ONBOARDED',

  // Capital
  MINT_INITIATED = 'MINT_INITIATED',
  MINT_APPROVED = 'MINT_APPROVED',
  MINT_COMPLETED = 'MINT_COMPLETED',
  MINT_REJECTED = 'MINT_REJECTED',
  BURN_INITIATED = 'BURN_INITIATED',
  BURN_APPROVED = 'BURN_APPROVED',
  BURN_COMPLETED = 'BURN_COMPLETED',

  // Allocation
  ALLOCATION_CREATED = 'ALLOCATION_CREATED',
  ALLOCATION_APPROVED = 'ALLOCATION_APPROVED',
  ALLOCATION_MODIFIED = 'ALLOCATION_MODIFIED',

  // Redemption
  REDEMPTION_REQUESTED = 'REDEMPTION_REQUESTED',
  REDEMPTION_APPROVED = 'REDEMPTION_APPROVED',
  REDEMPTION_COMPLETED = 'REDEMPTION_COMPLETED',
  REDEMPTION_REJECTED = 'REDEMPTION_REJECTED',

  // Settlement
  SETTLEMENT_INITIATED = 'SETTLEMENT_INITIATED',
  SETTLEMENT_COMPLETED = 'SETTLEMENT_COMPLETED',
  SETTLEMENT_FAILED = 'SETTLEMENT_FAILED',

  // Distribution
  DISTRIBUTION_CALCULATED = 'DISTRIBUTION_CALCULATED',
  DISTRIBUTION_APPROVED = 'DISTRIBUTION_APPROVED',
  DISTRIBUTION_PAID = 'DISTRIBUTION_PAID',

  // Admin
  ADMIN_CREATED = 'ADMIN_CREATED',
  ADMIN_UPDATED = 'ADMIN_UPDATED',
  ADMIN_DEACTIVATED = 'ADMIN_DEACTIVATED',

  // Treasury
  TREASURY_TRANSFER = 'TREASURY_TRANSFER',
  RESERVE_VALIDATED = 'RESERVE_VALIDATED',

  // Compliance
  COMPLIANCE_CHECK_PASSED = 'COMPLIANCE_CHECK_PASSED',
  COMPLIANCE_CHECK_FAILED = 'COMPLIANCE_CHECK_FAILED',
  GUARDRAIL_TRIGGERED = 'GUARDRAIL_TRIGGERED',

  // Cases (humanitarian)
  CASE_CREATED = 'CASE_CREATED',
  CASE_REVIEWED = 'CASE_REVIEWED',
  CASE_APPROVED = 'CASE_APPROVED',
  CASE_DISBURSED = 'CASE_DISBURSED',

  // Keys
  KEY_GENERATED = 'KEY_GENERATED',
  KEY_ROTATED = 'KEY_ROTATED',
  KEY_REVOKED = 'KEY_REVOKED',

  // Agents
  AGENT_DECISION = 'AGENT_DECISION',
  AGENT_OVERRIDE = 'AGENT_OVERRIDE',
  AGENT_DEPLOYED = 'AGENT_DEPLOYED',

  // Namespace
  NAMESPACE_REGISTERED = 'NAMESPACE_REGISTERED',
  NAMESPACE_TRANSFERRED = 'NAMESPACE_TRANSFERRED',

  // System
  SYSTEM_CONFIG_CHANGED = 'SYSTEM_CONFIG_CHANGED',
  SYSTEM_MODE_CHANGED = 'SYSTEM_MODE_CHANGED',
  EMERGENCY_FREEZE = 'EMERGENCY_FREEZE',
}

// ─── Audit Entry ───────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  actorId: string;
  actorRole: Role;
  module: ModuleCategory;
  targetId?: string;
  targetType?: string;

  // Hash chain
  contentHash: string;
  previousEntryHash: string;
  sequenceNumber: number;

  // Anchoring
  anchorHash?: string;
  anchorChain?: string;
  anchorTxHash?: string;

  // Details
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;

  // Timestamps
  timestamp: string;
  createdAt: string;
}

// ─── Audit Logger Interface ────────────────────────────────────────────────────

export interface AuditLogger {
  /**
   * Log an audit event. Returns the hash-chained entry.
   */
  log(params: AuditLogParams): Promise<AuditLogEntry>;

  /**
   * Verify the integrity of the audit chain from a given sequence number.
   */
  verifyChain(fromSequence?: number): Promise<AuditChainVerification>;

  /**
   * Query audit entries with filters.
   */
  query(filters: AuditQueryFilters): Promise<AuditLogEntry[]>;

  /**
   * Export audit entries as a signed bundle.
   */
  exportBundle(filters: AuditQueryFilters): Promise<AuditBundle>;
}

export interface AuditLogParams {
  action: AuditAction;
  actorId: string;
  actorRole: Role;
  module: ModuleCategory;
  targetId?: string;
  targetType?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditChainVerification {
  valid: boolean;
  totalEntries: number;
  verifiedEntries: number;
  firstBrokenLink?: number;
  verifiedAt: string;
}

export interface AuditQueryFilters {
  actions?: AuditAction[];
  actorId?: string;
  module?: ModuleCategory;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export interface AuditBundle {
  entries: AuditLogEntry[];
  bundleHash: string;
  signature: string;
  exportedAt: string;
  exportedBy: string;
}
