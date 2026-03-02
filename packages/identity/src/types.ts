/**
 * @sovereign/identity — Canonical Type System
 *
 * MERGED FROM:
 *   circle-superapp/src/lib/mog-os/types.ts (superset roles/perms)
 *   fth-institutional-core/fth-platform/core/canonical-types.ts (system modes, chains, modules)
 *   fth-capital-os/core/models/index.ts (capital domain models)
 *
 * RULE: Every other @sovereign/* package imports identity types from here.
 *       No package may redeclare Role, Permission, or Identity types.
 */

// ─── System Modes ──────────────────────────────────────────────────────────────

export enum SystemMode {
  INFRA = 'INFRA',
  ISSUER = 'ISSUER',
  VENUE = 'VENUE',
  TRADING = 'TRADING',
  FUNDING = 'FUNDING',
}

// ─── Supported Chains ──────────────────────────────────────────────────────────

export const SUPPORTED_CHAINS = [
  'ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche',
  'base', 'bitcoin', 'xrpl', 'cardano', 'solana',
  'stellar', 'tron', 'bnb-chain',
] as const;

export type SupportedChain = typeof SUPPORTED_CHAINS[number];

// ─── Roles (Superset — merged from mog-os 9 roles + fth-capital-os 6 roles) ───

export enum Role {
  // Core administrative
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',

  // Operations
  STEWARD_MANAGER = 'STEWARD_MANAGER',
  TREASURY_MANAGER = 'TREASURY_MANAGER',
  OPERATIONS = 'OPERATIONS',

  // Compliance & audit
  COMPLIANCE_OFFICER = 'COMPLIANCE_OFFICER',
  AUDITOR = 'AUDITOR',

  // External parties
  CASE_WORKER = 'CASE_WORKER',
  PARTNER = 'PARTNER',
  BROKER = 'BROKER',
  DONOR = 'DONOR',
  BENEFICIARY = 'BENEFICIARY',
  AGENT = 'AGENT',

  // Read-only
  READ_ONLY = 'READ_ONLY',
}

// ─── Permissions ───────────────────────────────────────────────────────────────

export enum Permission {
  // Identity
  IDENTITY_CREATE = 'identity:create',
  IDENTITY_READ = 'identity:read',
  IDENTITY_UPDATE = 'identity:update',
  IDENTITY_DELETE = 'identity:delete',
  IDENTITY_VERIFY = 'identity:verify',

  // Client management
  CLIENT_CREATE = 'client:create',
  CLIENT_READ = 'client:read',
  CLIENT_UPDATE = 'client:update',
  CLIENT_DELETE = 'client:delete',

  // Capital operations
  MINT_INITIATE = 'mint:initiate',
  MINT_APPROVE = 'mint:approve',
  BURN_INITIATE = 'burn:initiate',
  BURN_APPROVE = 'burn:approve',
  ALLOCATION_CREATE = 'allocation:create',
  ALLOCATION_APPROVE = 'allocation:approve',
  REDEMPTION_REQUEST = 'redemption:request',
  REDEMPTION_APPROVE = 'redemption:approve',

  // Treasury
  TREASURY_VIEW = 'treasury:view',
  TREASURY_MANAGE = 'treasury:manage',
  TREASURY_TRANSFER = 'treasury:transfer',

  // KYC/AML
  KYC_REVIEW = 'kyc:review',
  KYC_APPROVE = 'kyc:approve',
  KYC_REJECT = 'kyc:reject',

  // Compliance
  COMPLIANCE_VIEW = 'compliance:view',
  COMPLIANCE_MANAGE = 'compliance:manage',
  COMPLIANCE_OVERRIDE = 'compliance:override',

  // Audit
  AUDIT_READ = 'audit:read',
  AUDIT_EXPORT = 'audit:export',
  AUDIT_CONFIGURE = 'audit:configure',

  // Settlement
  SETTLEMENT_INITIATE = 'settlement:initiate',
  SETTLEMENT_APPROVE = 'settlement:approve',
  SETTLEMENT_VIEW = 'settlement:view',

  // Cases (humanitarian/funding)
  CASE_CREATE = 'case:create',
  CASE_REVIEW = 'case:review',
  CASE_APPROVE = 'case:approve',
  CASE_DISBURSE = 'case:disburse',

  // Namespace
  NAMESPACE_REGISTER = 'namespace:register',
  NAMESPACE_MANAGE = 'namespace:manage',
  NAMESPACE_TRANSFER = 'namespace:transfer',

  // Agents
  AGENT_DEPLOY = 'agent:deploy',
  AGENT_CONFIGURE = 'agent:configure',
  AGENT_OVERRIDE = 'agent:override',

  // System
  SYSTEM_CONFIGURE = 'system:configure',
  SYSTEM_MONITOR = 'system:monitor',
  ADMIN_MANAGE = 'admin:manage',
}

// ─── Role → Permission Matrix ──────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  [Role.ADMIN]: Object.values(Permission).filter(
    p => p !== Permission.SYSTEM_CONFIGURE
  ),
  [Role.STEWARD_MANAGER]: [
    Permission.IDENTITY_READ, Permission.IDENTITY_UPDATE,
    Permission.CLIENT_READ, Permission.CLIENT_UPDATE,
    Permission.CASE_CREATE, Permission.CASE_REVIEW, Permission.CASE_APPROVE, Permission.CASE_DISBURSE,
    Permission.AUDIT_READ, Permission.COMPLIANCE_VIEW,
    Permission.TREASURY_VIEW, Permission.SETTLEMENT_VIEW,
  ],
  [Role.TREASURY_MANAGER]: [
    Permission.TREASURY_VIEW, Permission.TREASURY_MANAGE, Permission.TREASURY_TRANSFER,
    Permission.MINT_INITIATE, Permission.MINT_APPROVE,
    Permission.BURN_INITIATE, Permission.BURN_APPROVE,
    Permission.ALLOCATION_CREATE, Permission.ALLOCATION_APPROVE,
    Permission.SETTLEMENT_INITIATE, Permission.SETTLEMENT_APPROVE, Permission.SETTLEMENT_VIEW,
    Permission.AUDIT_READ, Permission.CLIENT_READ,
  ],
  [Role.OPERATIONS]: [
    Permission.CLIENT_READ, Permission.CLIENT_CREATE, Permission.CLIENT_UPDATE,
    Permission.ALLOCATION_CREATE,
    Permission.REDEMPTION_REQUEST,
    Permission.TREASURY_VIEW, Permission.SETTLEMENT_VIEW,
    Permission.AUDIT_READ, Permission.COMPLIANCE_VIEW,
    Permission.SYSTEM_MONITOR,
  ],
  [Role.COMPLIANCE_OFFICER]: [
    Permission.KYC_REVIEW, Permission.KYC_APPROVE, Permission.KYC_REJECT,
    Permission.COMPLIANCE_VIEW, Permission.COMPLIANCE_MANAGE, Permission.COMPLIANCE_OVERRIDE,
    Permission.AUDIT_READ, Permission.AUDIT_EXPORT,
    Permission.CLIENT_READ, Permission.IDENTITY_READ,
    Permission.TREASURY_VIEW, Permission.SETTLEMENT_VIEW,
  ],
  [Role.AUDITOR]: [
    Permission.AUDIT_READ, Permission.AUDIT_EXPORT,
    Permission.CLIENT_READ, Permission.IDENTITY_READ,
    Permission.TREASURY_VIEW, Permission.SETTLEMENT_VIEW,
    Permission.COMPLIANCE_VIEW,
  ],
  [Role.CASE_WORKER]: [
    Permission.CASE_CREATE, Permission.CASE_REVIEW,
    Permission.CLIENT_READ, Permission.CLIENT_CREATE,
    Permission.IDENTITY_READ,
    Permission.AUDIT_READ,
  ],
  [Role.PARTNER]: [
    Permission.CLIENT_READ,
    Permission.ALLOCATION_CREATE,
    Permission.TREASURY_VIEW,
    Permission.SETTLEMENT_VIEW,
    Permission.AUDIT_READ,
  ],
  [Role.BROKER]: [
    Permission.CLIENT_CREATE, Permission.CLIENT_READ,
    Permission.ALLOCATION_CREATE,
    Permission.REDEMPTION_REQUEST,
    Permission.TREASURY_VIEW,
  ],
  [Role.DONOR]: [
    Permission.CASE_CREATE,
    Permission.TREASURY_VIEW,
    Permission.AUDIT_READ,
  ],
  [Role.BENEFICIARY]: [
    Permission.IDENTITY_READ,
    Permission.CASE_CREATE,
    Permission.AUDIT_READ,
  ],
  [Role.AGENT]: [
    Permission.CASE_CREATE, Permission.CASE_REVIEW,
    Permission.CLIENT_READ,
    Permission.AUDIT_READ,
    Permission.COMPLIANCE_VIEW,
  ],
  [Role.READ_ONLY]: [
    Permission.CLIENT_READ, Permission.IDENTITY_READ,
    Permission.AUDIT_READ, Permission.TREASURY_VIEW,
    Permission.SETTLEMENT_VIEW, Permission.COMPLIANCE_VIEW,
  ],
};

// ─── KYC ───────────────────────────────────────────────────────────────────────

export enum KycLevel {
  NONE = 0,
  BASIC = 1,
  ENHANCED = 2,
  INSTITUTIONAL = 3,
}

export enum KycStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum AccreditationStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  ACCREDITED = 'ACCREDITED',
  QUALIFIED_PURCHASER = 'QUALIFIED_PURCHASER',
  INSTITUTIONAL = 'INSTITUTIONAL',
  EXPIRED = 'EXPIRED',
}

// ─── Sovereign Identity ─────────────────────────────────────────────────────────

export interface SovereignIdentity {
  id: string;
  displayName: string;
  roles: Role[];
  kycLevel: KycLevel;
  kycStatus: KycStatus;
  accreditationStatus: AccreditationStatus;
  xrplAddress?: string;
  walletAddresses: Record<SupportedChain, string>;
  did?: string;
  namespaceEntry?: string; // e.g. "kevan.capital"
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  metadata: Record<string, unknown>;
}

// ─── DID / Verifiable Credentials ──────────────────────────────────────────────

export interface DIDDocument {
  id: string;
  controller: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertionMethod: string[];
  created: string;
  updated: string;
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase?: string;
  publicKeyJwk?: Record<string, unknown>;
}

export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: Record<string, unknown>;
  proof: CredentialProof;
}

export interface CredentialProof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  proofValue: string;
}

// ─── Token Types ───────────────────────────────────────────────────────────────

export enum TokenType {
  FTHUSD = 'FTHUSD',
  USDF = 'USDF',
}

// ─── Stablecoins ───────────────────────────────────────────────────────────────

export enum Stablecoin {
  USDC = 'USDC',
  USDT = 'USDT',
  RLUSD = 'RLUSD',
  PYUSD = 'PYUSD',
  USYC = 'USYC',
  DAI = 'DAI',
  FRAX = 'FRAX',
  BUSD = 'BUSD',
}

// ─── Custody ───────────────────────────────────────────────────────────────────

export enum CustodyProvider {
  FIREBLOCKS = 'FIREBLOCKS',
  ANCHORAGE = 'ANCHORAGE',
  BITGO = 'BITGO',
}

export enum FireblocksVaultRole {
  TREASURY = 'TREASURY',
  OMNIBUS = 'OMNIBUS',
  RESERVE = 'RESERVE',
  COLLATERAL = 'COLLATERAL',
  ESCROW = 'ESCROW',
  SETTLEMENT = 'SETTLEMENT',
  FEE_COLLECTION = 'FEE_COLLECTION',
  REDEMPTION = 'REDEMPTION',
  COLD_STORAGE = 'COLD_STORAGE',
  HOT_WALLET = 'HOT_WALLET',
  STAKING = 'STAKING',
  INSURANCE = 'INSURANCE',
}

// ─── Failure Taxonomy ──────────────────────────────────────────────────────────

export enum FailureSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum FailureDomain {
  CHAIN = 'CHAIN',
  CUSTODY = 'CUSTODY',
  COMPLIANCE = 'COMPLIANCE',
  SETTLEMENT = 'SETTLEMENT',
  IDENTITY = 'IDENTITY',
  FUNDING = 'FUNDING',
}

export interface SystemFailure {
  id: string;
  severity: FailureSeverity;
  domain: FailureDomain;
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  metadata: Record<string, unknown>;
}

// ─── Module Categories ─────────────────────────────────────────────────────────

export enum ModuleCategory {
  // Infrastructure
  XRPL_CONNECTION = 'xrpl:connection',
  XRPL_ISSUER = 'xrpl:issuer',
  XRPL_WALLET = 'xrpl:wallet',
  XRPL_TRUSTLINE = 'xrpl:trustline',
  XRPL_ESCROW = 'xrpl:escrow',
  XRPL_LISTENER = 'xrpl:listener',
  XRPL_ANCHOR = 'xrpl:anchor',

  // Capital
  LEDGER = 'capital:ledger',
  MINT = 'capital:mint',
  BURN = 'capital:burn',
  ALLOCATION = 'capital:allocation',
  REDEMPTION = 'capital:redemption',
  SETTLEMENT = 'capital:settlement',
  DISTRIBUTION = 'capital:distribution',

  // Products
  BOND = 'product:bond',
  FUND = 'product:fund',
  STABLECOIN = 'product:stablecoin',
  RWA = 'product:rwa',
  SPV = 'product:spv',
  EQUITY = 'product:equity',

  // Compliance
  KYC = 'compliance:kyc',
  AML = 'compliance:aml',
  MARKETING = 'compliance:marketing',
  JURISDICTION = 'compliance:jurisdiction',
  GUARDRAILS = 'compliance:guardrails',

  // Identity
  AUTH = 'identity:auth',
  RBAC = 'identity:rbac',
  NAMESPACE = 'identity:namespace',
  DID = 'identity:did',
  VC = 'identity:vc',

  // Agents
  AI_AGENT = 'agent:ai',
  DISCOVERY = 'agent:discovery',
  COMPLIANCE_AGENT = 'agent:compliance',
  RISK_AGENT = 'agent:risk',
}
