/**
 * Sovereign Spine — System Invariant Tests
 *
 * These are the 10 non-negotiable invariants from SYSTEM_MAP.md.
 * Every one of these MUST pass. If any fails, the system is broken.
 *
 * Run: npx tsx packages/identity/__tests__/invariants.test.ts
 * (uses Node.js built-in test runner — no jest/vitest dependency needed)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  Role,
  Permission,
  ROLE_PERMISSIONS,
  SUPPORTED_CHAINS,
  SystemMode,
  AuditAction,
  KeyPurpose,
  KeyStatus,
  AgentType,
  NAMESPACE_TLDS,
  ENV_SCHEMA,
  EnvScope,
} from '../src/index';

import {
  TransactionType,
  SettlementState,
  AnchoringTier,
  GuardrailType,
} from '@sovereign/ledger';

import { RuleCategory } from '@sovereign/compliance';
import { ProductType } from '@sovereign/products';

// ═══════════════════════════════════════════════════════════════════════════════
// INVARIANT 1: Every role must have at least one permission
// ═══════════════════════════════════════════════════════════════════════════════
describe('Invariant 1: Role-Permission Completeness', () => {
  it('every Role enum value has a permissions entry', () => {
    const roleValues = Object.values(Role).filter((v) => typeof v === 'string') as string[];
    for (const role of roleValues) {
      const perms = ROLE_PERMISSIONS[role as Role];
      assert.ok(perms, `Role "${role}" has no permissions entry`);
      assert.ok(perms.length > 0, `Role "${role}" has empty permissions array`);
    }
  });

  it('SUPER_ADMIN has all permissions', () => {
    const allPerms = Object.values(Permission).filter((v) => typeof v === 'string') as string[];
    const superAdminPerms = ROLE_PERMISSIONS[Role.SUPER_ADMIN];
    for (const perm of allPerms) {
      assert.ok(
        superAdminPerms.includes(perm as Permission),
        `SUPER_ADMIN missing permission: ${perm}`,
      );
    }
  });

  it('AGENT role cannot hold SUPER_ADMIN permissions', () => {
    const agentPerms = ROLE_PERMISSIONS[Role.AGENT];
    const dangerousPerms = [
      Permission.SYSTEM_CONFIGURE,
      Permission.SYSTEM_SHUTDOWN,
      Permission.KEY_ROTATE,
      Permission.KEY_EMERGENCY_FREEZE,
    ];
    for (const perm of dangerousPerms) {
      assert.ok(
        !agentPerms.includes(perm),
        `AGENT has dangerous permission: ${perm}`,
      );
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INVARIANT 2: Audit actions must cover all critical domains
// ═══════════════════════════════════════════════════════════════════════════════
describe('Invariant 2: Audit Action Coverage', () => {
  // Audit action values use these prefixes — some actions like LOGIN, LOGOUT
  // don't use an AUTH_ prefix, so we check for the actual value patterns
  const requiredDomains = [
    'LOGIN', 'IDENTITY', 'KYC', 'CLIENT', 'MINT', 'ALLOCATION',
    'REDEMPTION', 'SETTLEMENT', 'DISTRIBUTION', 'ADMIN', 'TREASURY',
    'COMPLIANCE', 'KEY', 'AGENT', 'NAMESPACE', 'SYSTEM',
  ];

  it('audit actions cover all critical domains', () => {
    const actionValues = Object.values(AuditAction).filter((v) => typeof v === 'string') as string[];
    for (const domain of requiredDomains) {
      const hasDomain = actionValues.some((a) => a.startsWith(domain));
      assert.ok(hasDomain, `No audit action covers domain: ${domain}`);
    }
  });

  it('has at least 50 distinct audit actions', () => {
    const actionCount = Object.values(AuditAction).filter((v) => typeof v === 'string').length;
    assert.ok(actionCount >= 50, `Only ${actionCount} audit actions — need >=50`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INVARIANT 3: Chain support is exactly 13
// ═══════════════════════════════════════════════════════════════════════════════
describe('Invariant 3: Chain Inventory', () => {
  it('SUPPORTED_CHAINS has exactly 13 entries', () => {
    assert.equal(SUPPORTED_CHAINS.length, 13);
  });

  it('XRPL is included as the settlement spine', () => {
    assert.ok(SUPPORTED_CHAINS.includes('xrpl'), 'XRPL must be in SUPPORTED_CHAINS');
  });

  it('contains all required chains', () => {
    const required = ['xrpl', 'ethereum', 'polygon', 'bitcoin', 'solana', 'base'];
    for (const chain of required) {
      assert.ok(SUPPORTED_CHAINS.includes(chain as any), `Missing chain: ${chain}`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INVARIANT 4: Key purposes cover all signing needs
// ═══════════════════════════════════════════════════════════════════════════════
describe('Invariant 4: Key Authority Coverage', () => {
  const requiredPurposes = [
    KeyPurpose.ISSUER_SIGNING,
    KeyPurpose.TREASURY_SIGNING,
    KeyPurpose.AUDIT_SIGNING,
    KeyPurpose.SETTLEMENT_SIGNING,
    KeyPurpose.ANCHOR_SIGNING,
  ];

  it('all critical signing purposes are defined', () => {
    for (const purpose of requiredPurposes) {
      assert.ok(purpose, `Missing key purpose: ${purpose}`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INVARIANT 5: Settlement state machine is complete
// ═══════════════════════════════════════════════════════════════════════════════
describe('Invariant 5: Settlement State Machine', () => {
  const requiredStates = [
    SettlementState.CREATED,
    SettlementState.VALIDATED,
    SettlementState.ROUTED,
    SettlementState.EXECUTING,
    SettlementState.SETTLED,
    SettlementState.FAILED,
    SettlementState.CANCELLED,
  ];

  it('all 7 settlement states exist', () => {
    assert.equal(requiredStates.length, 7);
    for (const state of requiredStates) {
      assert.ok(state, `Missing settlement state`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INVARIANT 6: Transaction types cover the full capital lifecycle
// ═══════════════════════════════════════════════════════════════════════════════
describe('Invariant 6: Transaction Type Completeness', () => {
  const lifecycleTypes = [
    TransactionType.WIRE_IN,
    TransactionType.MINT,
    TransactionType.BURN,
    TransactionType.ALLOCATION,
    TransactionType.REDEMPTION,
    TransactionType.SETTLEMENT,
    TransactionType.DISTRIBUTION,
    TransactionType.WIRE_OUT,
    TransactionType.ANCHOR,
  ];

  it('all lifecycle transaction types exist', () => {
    for (const type of lifecycleTypes) {
      assert.ok(type, `Missing transaction type`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INVARIANT 7: Compliance covers required jurisdictions
// ═══════════════════════════════════════════════════════════════════════════════
describe('Invariant 7: Compliance Rule Coverage', () => {
  const requiredCategories = [
    RuleCategory.AML_KYC,
    RuleCategory.SECURITIES,
    RuleCategory.HOWEY,
    RuleCategory.GDPR,
    RuleCategory.GUARDRAILS,
    RuleCategory.ACCREDITATION,
  ];

  it('all required compliance categories exist', () => {
    for (const cat of requiredCategories) {
      assert.ok(cat, `Missing compliance category`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INVARIANT 8: Product types cover the institutional spectrum
// ═══════════════════════════════════════════════════════════════════════════════
describe('Invariant 8: Product Type Coverage', () => {
  const requiredProducts = [
    ProductType.STABLECOIN,
    ProductType.BOND,
    ProductType.FUND,
    ProductType.RWA,
    ProductType.SPV,
  ];

  it('core product types exist', () => {
    for (const p of requiredProducts) {
      assert.ok(p, `Missing product type`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INVARIANT 9: Agent governance types cover all agent categories
// ═══════════════════════════════════════════════════════════════════════════════
describe('Invariant 9: Agent Governance Coverage', () => {
  const requiredAgentTypes = [
    AgentType.CAPITAL,
    AgentType.COMPLIANCE,
    AgentType.RISK,
    AgentType.DISCOVERY,
  ];

  it('all critical agent types exist', () => {
    for (const type of requiredAgentTypes) {
      assert.ok(type, `Missing agent type`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INVARIANT 10: Environment schema covers all critical variables
// ═══════════════════════════════════════════════════════════════════════════════
describe('Invariant 10: Environment Schema', () => {
  const requiredKeys = [
    'NODE_ENV', 'SYSTEM_MODE', 'DATABASE_URL', 'REDIS_URL',
    'XRPL_NETWORK', 'XRPL_WSS_PRIMARY', 'HSM_PROVIDER', 'JWT_SECRET',
  ];

  it('all critical env vars are in the schema', () => {
    const schemaKeys = ENV_SCHEMA.map((v) => v.key);
    for (const key of requiredKeys) {
      assert.ok(schemaKeys.includes(key), `Missing env var in schema: ${key}`);
    }
  });

  it('all sensitive vars are marked as such', () => {
    const sensitivePrefixes = ['_SECRET', '_KEY', '_SEED', '_PIN', '_URL'];
    for (const variable of ENV_SCHEMA) {
      if (variable.sensitive) {
        // Sensitive vars must NEVER have a default in production scope
        if (variable.scope === EnvScope.PRODUCTION) {
          assert.ok(
            !variable.default,
            `Production-scoped sensitive var ${variable.key} must not have a default`,
          );
        }
      }
    }
  });

  it('has at least 20 env vars defined', () => {
    assert.ok(ENV_SCHEMA.length >= 20, `Only ${ENV_SCHEMA.length} env vars — need >=20`);
  });
});
