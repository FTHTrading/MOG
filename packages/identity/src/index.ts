/**
 * @sovereign/identity — Barrel Export
 *
 * Single entry point for all identity types, RBAC, audit, keys, agents, namespace.
 * Every other @sovereign/* package imports from here.
 */

// Types — canonical type system
export {
  // System
  SystemMode,
  SUPPORTED_CHAINS,
  type SupportedChain,

  // Roles & permissions
  Role,
  Permission,
  ROLE_PERMISSIONS,

  // KYC
  KycLevel,
  KycStatus,
  AccreditationStatus,

  // Identity
  type SovereignIdentity,

  // DID / VC
  type DIDDocument,
  type VerificationMethod,
  type VerifiableCredential,
  type CredentialProof,

  // Tokens & stablecoins
  TokenType,
  Stablecoin,

  // Custody
  CustodyProvider,
  FireblocksVaultRole,

  // Failure
  FailureSeverity,
  FailureDomain,
  type SystemFailure,

  // Modules
  ModuleCategory,
} from './types';

// RBAC — permission checking
export {
  roleHasPermission,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getPermissions,
  requirePermission,
  requireAllPermissions,
  PermissionDeniedError,
} from './rbac';

// Audit — hash-chained, signed audit log
export {
  AuditAction,
  type AuditLogEntry,
  type AuditLogger,
  type AuditLogParams,
  type AuditChainVerification,
  type AuditQueryFilters,
  type AuditBundle,
} from './audit';

// Keys — HSM + MPC key authority
export {
  KeyPurpose,
  KeyStatus,
  HsmProviderType,
  type KeyMetadata,
  type MpcConfig,
  type EncryptedPayload,
  type KeyAuthorityService,
  type SignResult,
  type HsmAttestation,
  type MpcSigningCeremony,
} from './keys';

// Agents — AI agent governance
export {
  AgentType,
  type AgentGovernancePolicy,
  type AgentDecisionRecord,
  type AgentRegistry,
  type SandboxCheckResult,
  type AgentDecisionFilters,
  type AgentStatus,
} from './agents';

// Namespace — XRPL-native TLD registry
export {
  NAMESPACE_TLDS,
  type NamespaceTLD,
  type NamespaceRoot,
  type NamespaceMetadata,
  type SubnameEntry,
  SubnameRecordType,
  type NamespaceRegistry,
  type NamespaceRegistration,
  type SubnameRegistration,
  type ResolvedNamespace,
} from './namespace';

// Environment — schema + validation
export {
  EnvScope,
  type EnvVar,
  ENV_SCHEMA,
  type EnvValidationResult,
  validateEnvironment,
  enforceEnvironment,
} from './env';
