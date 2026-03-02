/**
 * Environment Schema — Sovereign Spine
 *
 * Every runtime environment variable is:
 * 1. Declared here (single source of truth)
 * 2. Typed
 * 3. Validated at boot
 * 4. Never defaulted silently (fail loud, not quiet)
 *
 * This replaces scattered .env parsing across 6+ repos.
 */

// ─── Schema Definition ─────────────────────────────────────────────────────────

export enum EnvScope {
  /** Required in all environments */
  REQUIRED = 'REQUIRED',
  /** Required in production only */
  PRODUCTION = 'PRODUCTION',
  /** Optional — has a safe default */
  OPTIONAL = 'OPTIONAL',
}

export interface EnvVar {
  key: string;
  scope: EnvScope;
  description: string;
  sensitive: boolean;
  example?: string;
  default?: string;
  validator?: (value: string) => boolean;
}

// ─── Canonical Environment Variables ────────────────────────────────────────────

export const ENV_SCHEMA: EnvVar[] = [
  // ── System ──
  { key: 'NODE_ENV', scope: EnvScope.REQUIRED, description: 'Runtime environment', sensitive: false, example: 'production', validator: (v) => ['development', 'staging', 'production', 'test'].includes(v) },
  { key: 'SYSTEM_MODE', scope: EnvScope.REQUIRED, description: 'Operational mode (ISSUER | CUSTODIAN | PLATFORM | HYBRID | READONLY)', sensitive: false, validator: (v) => ['ISSUER', 'CUSTODIAN', 'PLATFORM', 'HYBRID', 'READONLY'].includes(v) },

  // ── Database ──
  { key: 'DATABASE_URL', scope: EnvScope.REQUIRED, description: 'PostgreSQL 16 connection string', sensitive: true, example: 'postgresql://user:pass@host:5432/sovereign' },
  { key: 'REDIS_URL', scope: EnvScope.REQUIRED, description: 'Redis 7 connection string', sensitive: true, example: 'redis://host:6379' },

  // ── XRPL ──
  { key: 'XRPL_NETWORK', scope: EnvScope.REQUIRED, description: 'XRPL network target', sensitive: false, validator: (v) => ['mainnet', 'testnet', 'devnet', 'amm-devnet'].includes(v) },
  { key: 'XRPL_WSS_PRIMARY', scope: EnvScope.REQUIRED, description: 'Primary XRPL WebSocket endpoint', sensitive: false, example: 'wss://s1.ripple.com' },
  { key: 'XRPL_WSS_FALLBACK', scope: EnvScope.OPTIONAL, description: 'Fallback XRPL WebSocket endpoint', sensitive: false, example: 'wss://s2.ripple.com' },
  { key: 'XRPL_ISSUER_ADDRESS', scope: EnvScope.PRODUCTION, description: 'XRPL issuer r-address', sensitive: false },
  { key: 'XRPL_TREASURY_ADDRESS', scope: EnvScope.PRODUCTION, description: 'XRPL treasury r-address', sensitive: false },
  { key: 'XRPL_ISSUER_SEED', scope: EnvScope.PRODUCTION, description: 'XRPL issuer seed (HSM-managed in prod)', sensitive: true },

  // ── Fireblocks MPC ──
  { key: 'FIREBLOCKS_API_KEY', scope: EnvScope.PRODUCTION, description: 'Fireblocks API key', sensitive: true },
  { key: 'FIREBLOCKS_API_SECRET', scope: EnvScope.PRODUCTION, description: 'Fireblocks API secret (RSA PEM)', sensitive: true },
  { key: 'FIREBLOCKS_VAULT_ACCOUNT_ID', scope: EnvScope.PRODUCTION, description: 'Fireblocks vault account ID', sensitive: false },
  { key: 'FIREBLOCKS_BASE_URL', scope: EnvScope.PRODUCTION, description: 'Fireblocks API base URL', sensitive: false, default: 'https://api.fireblocks.io' },

  // ── HSM ──
  { key: 'HSM_PROVIDER', scope: EnvScope.REQUIRED, description: 'HSM provider type', sensitive: false, validator: (v) => ['SOFT_HSM', 'AWS_CLOUD_HSM', 'AZURE_KEY_VAULT'].includes(v) },
  { key: 'HSM_SLOT', scope: EnvScope.OPTIONAL, description: 'HSM slot number (SoftHSM)', sensitive: false, default: '0' },
  { key: 'HSM_PIN', scope: EnvScope.PRODUCTION, description: 'HSM user PIN', sensitive: true },
  { key: 'AWS_KMS_KEY_ARN', scope: EnvScope.PRODUCTION, description: 'AWS KMS key ARN (for CloudHSM)', sensitive: false },

  // ── Circle (USDC) ──
  { key: 'CIRCLE_API_KEY', scope: EnvScope.PRODUCTION, description: 'Circle API key', sensitive: true },
  { key: 'CIRCLE_API_BASE', scope: EnvScope.OPTIONAL, description: 'Circle API base URL', sensitive: false, default: 'https://prd-api.circle.com' },

  // ── Authentication ──
  { key: 'JWT_SECRET', scope: EnvScope.REQUIRED, description: 'JWT signing secret (256-bit min)', sensitive: true, validator: (v) => v.length >= 32 },
  { key: 'SESSION_ENCRYPTION_KEY', scope: EnvScope.REQUIRED, description: 'Session encryption key (AES-256)', sensitive: true, validator: (v) => v.length >= 32 },

  // ── Anchoring ──
  { key: 'BITCOIN_RPC_URL', scope: EnvScope.OPTIONAL, description: 'Bitcoin RPC endpoint for Tier 1 anchoring', sensitive: true },
  { key: 'POLYGON_RPC_URL', scope: EnvScope.OPTIONAL, description: 'Polygon RPC endpoint for Tier 3 anchoring', sensitive: true },
  { key: 'IPFS_API_URL', scope: EnvScope.OPTIONAL, description: 'IPFS API endpoint for proof storage', sensitive: false, default: 'http://localhost:5001' },

  // ── Observability ──
  { key: 'LOG_LEVEL', scope: EnvScope.OPTIONAL, description: 'Log level', sensitive: false, default: 'info', validator: (v) => ['debug', 'info', 'warn', 'error'].includes(v) },
  { key: 'OTEL_EXPORTER_ENDPOINT', scope: EnvScope.OPTIONAL, description: 'OpenTelemetry collector endpoint', sensitive: false },
  { key: 'SENTRY_DSN', scope: EnvScope.OPTIONAL, description: 'Sentry error tracking DSN', sensitive: false },

  // ── Ports ──
  { key: 'API_PORT', scope: EnvScope.OPTIONAL, description: 'Fastify API port', sensitive: false, default: '4000' },
  { key: 'CONTROL_PLANE_PORT', scope: EnvScope.OPTIONAL, description: 'Control plane port', sensitive: false, default: '3100' },
];

// ─── Validation Engine ──────────────────────────────────────────────────────────

export interface EnvValidationResult {
  valid: boolean;
  missing: EnvVar[];
  invalid: Array<{ variable: EnvVar; value: string; reason: string }>;
  warnings: string[];
  resolved: Record<string, string>;
}

/**
 * Validate environment against schema.
 * Call this ONCE at boot. If it fails, the process should exit.
 */
export function validateEnvironment(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
  mode: 'development' | 'staging' | 'production' | 'test' = (env.NODE_ENV as any) ?? 'development',
): EnvValidationResult {
  const missing: EnvVar[] = [];
  const invalid: Array<{ variable: EnvVar; value: string; reason: string }> = [];
  const warnings: string[] = [];
  const resolved: Record<string, string> = {};

  for (const variable of ENV_SCHEMA) {
    const value = env[variable.key];

    // Check required-ness
    if (!value && !variable.default) {
      if (variable.scope === EnvScope.REQUIRED) {
        missing.push(variable);
        continue;
      }
      if (variable.scope === EnvScope.PRODUCTION && mode === 'production') {
        missing.push(variable);
        continue;
      }
      if (variable.scope === EnvScope.OPTIONAL) {
        // Fine — it's optional with no default
        continue;
      }
    }

    const finalValue = value ?? variable.default;
    if (!finalValue) continue;

    // Run validator
    if (variable.validator && !variable.validator(finalValue)) {
      invalid.push({
        variable,
        value: variable.sensitive ? '***' : finalValue,
        reason: `Failed validation for ${variable.key}`,
      });
      continue;
    }

    resolved[variable.key] = finalValue;
  }

  // Warn about sensitive vars in non-prod
  if (mode !== 'production') {
    for (const variable of ENV_SCHEMA) {
      if (variable.sensitive && env[variable.key]) {
        warnings.push(`⚠ Sensitive variable ${variable.key} is set in ${mode} mode`);
      }
    }
  }

  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    warnings,
    resolved,
  };
}

/**
 * Boot guard — call at process start. Exits with code 1 if env is invalid.
 */
export function enforceEnvironment(
  env?: Record<string, string | undefined>,
  mode?: 'development' | 'staging' | 'production' | 'test',
): Record<string, string> {
  const result = validateEnvironment(env, mode);

  if (!result.valid) {
    console.error('\n╔══════════════════════════════════════════════════════════════╗');
    console.error('║  SOVEREIGN SPINE — ENVIRONMENT VALIDATION FAILED            ║');
    console.error('╚══════════════════════════════════════════════════════════════╝\n');

    if (result.missing.length > 0) {
      console.error('Missing variables:');
      for (const v of result.missing) {
        console.error(`  ✗ ${v.key} [${v.scope}] — ${v.description}`);
      }
    }

    if (result.invalid.length > 0) {
      console.error('\nInvalid values:');
      for (const v of result.invalid) {
        console.error(`  ✗ ${v.variable.key} = ${v.value} — ${v.reason}`);
      }
    }

    console.error('');
    process.exit(1);
  }

  for (const warning of result.warnings) {
    console.warn(warning);
  }

  return result.resolved;
}
