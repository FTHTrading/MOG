# Sovereign Spine — System Map & Compression Blueprint

> **Entity:** Men of God Development & Investments LLC
> **Generated:** 2026-03-02
> **Status:** Canonical architectural convergence plan

---

## 1. Current State — Overlap Matrix

### 1.1 Identity & RBAC (3 implementations)

| Capability | `fth-capital-os` | `circle-superapp` (mog-os) | `fth-institutional-core` |
|------------|-------------------|----------------------------|--------------------------|
| Roles | 6 (`AdminRole` enum) | 9 (`Role` type) | N/A (inherits from core types) |
| Permissions | 20 (`Permission` enum) | 42 (string union) | Mode-based (`ModePermission`) |
| Identity model | `Client` + `AdminUser` | `SovereignIdentity` + `DIDDocument` | N/A (Fireblocks identity) |
| Auth | JWT + MFA | XRPL wallet + Xaman + Email + API key | System mode guard |
| KYC levels | 2 states (`KycStatus`) | 4 levels (0-3) | N/A |
| Namespace | None | Full `.money/.capital/.vault` NFT system | None |

**Conflict:** Three different authority models. `mog-os` is the superset.

### 1.2 XRPL Modules (4 implementations)

| Capability | `fth-capital-os/xrpl/` | `circle-superapp/lib/circle/xrpl.ts` | `fth-institutional-core/fth-platform/xrpl/` | `fth-institutional-core/fth-anchor-bridge/` |
|------------|------------------------|---------------------------------------|----------------------------------------------|---------------------------------------------|
| Connection mgmt | `resilience.ts` (retry/reconnect) | Inline constants | `connection-manager.ts` (445 LOC, pool, failover, heartbeat) | `xrpl-submitter.ts` |
| Issuer mgmt | `issuer-manager.ts` | N/A | `issuer-module.ts` | N/A |
| Wallet mgmt | `wallet-manager.ts` | Wallet info types only | N/A | N/A |
| Trustline | `trustline-manager.ts` | Trustline types | `trustline-orchestrator.ts` | N/A |
| Escrow | `escrow-manager.ts` | `XrplEscrowParams` types | N/A | N/A |
| Mint/burn | `mint-service.ts` / `burn-service.ts` | N/A (Circle API) | N/A (stablecoin rail) | N/A |
| Listener | `listener.ts` | N/A | N/A | N/A |
| Anchoring | N/A | XSMP anchoring | `xrpl-anchor-engine.ts` | Genesis ceremony + submitter |
| Currency encoding | `currency.ts` (FTHUSD/USDF hex) | Token constants | N/A | N/A |
| Account control | N/A | N/A | `account-control.ts` | N/A |

**Conflict:** Four separate XRPL connection and management layers. `fth-institutional-core` has the most robust connection manager. `fth-capital-os` has the most complete operational services (mint/burn/escrow/listener).

### 1.3 Ledger / Settlement (3 implementations)

| Capability | `fth-capital-os` | `circle-superapp` | `fth-institutional-core` |
|------------|-------------------|--------------------|--------------------------|
| Ledger service | `services/ledger-service/` (double-entry, 28-decimal) | N/A (delegates) | `fth-platform/core/vault-ledger.ts` (append-only, hash-chained, SHA-256) |
| Settlement | `services/settlement-bridge/` + `core/settlement-state-machine.ts` | `lib/desk/settlement.ts` | `fth-platform/settlement/` (payment-intent, stablecoin-rail, settlement-recorder) |
| Banking | `services/banking-reconciliation/` | N/A | `fth-platform/funding/` (bank-rail-ingester, wire-reference-mapper, funding-machine) |
| Mint/burn flow | XRPL mint/burn services | Circle API mint | Stablecoin rail connectors (Circle, RLUSD, PYUSD, Tether) |
| Guardrails | `core/guardrails.ts` (daily mint cap, frozen checks, double-redemption) | N/A | `fth-platform/core/system-mode-guard.ts` (mode isolation) |
| State machines | `core/settlement-state-machine.ts` | Transaction intent types | Bond (7 states) + Collateral (10 states) + Funding (9 states) |

**Conflict:** Two competing ledger implementations. `vault-ledger.ts` (hash-chained, append-only) is more institutional. `ledger-service` has operational features. Need merge.

### 1.4 Compliance (2 implementations)

| Capability | `fth-capital-os` | `fth-institutional-core` (4100-DR) |
|------------|-------------------|------------------------------------|
| Rule engine | `helios-marketing-compliance-engine/` (Howey, jurisdiction, claims) | `packages/compliance-engine/` (YAML rules, evaluator, middleware, drill runner) |
| Rule sets | Howey analysis, marketing compliance | 28+ YAML rules (GDPR, CCPA, FERPA, AML/KYC, Securities Act, EU AI Act, DR laws) |
| Structure | Inline TypeScript | YAML-driven declarative + evaluator |

**Conflict:** Two compliance engines with different paradigms. `4100-DR`'s YAML-driven engine is more extensible. Helios has domain-specific financial compliance.

### 1.5 Audit Logging (3 implementations)

| Capability | `fth-capital-os` | `circle-superapp` (mog-os) | `4100-DR` |
|------------|-------------------|-----------------------------|-----------|
| Event types | 25 (`AuditEventType` enum) | 38 (`AuditAction` union) | `packages/audit/` (hash-chained, signed) |
| Chain linkage | None (flat log) | `previousEntryHash` + `contentHash` | `packages/audit/src/signer.ts` + `verify.ts` |
| Tamper detection | None | SHA-256 hash per entry | Signed bundles + verification |

**Conflict:** `4100-DR`'s audit package is the most institutional (signed + verifiable). `mog-os` has the richest event taxonomy. `fth-capital-os` has the simplest but lacks integrity proofs.

### 1.6 Key Management (2 implementations)

| Capability | `fth-capital-os` | `fth-institutional-core` |
|------------|-------------------|------------------------------------|
| HSM | `core/hsm-manager.ts` (826 LOC, SoftHSM/AWS/Azure) | Fireblocks MPC (3-of-5 multisig) |
| Key rotation | `core/key-rotation.ts` | `apps/api/src/runtime/key-rotation-watcher.ts` |
| Key purposes | 5 (Issuer, Treasury, Client seed, Audit, Webhook) | 12 Fireblocks vault roles |
| Attestation | `core/hsm-attestation.ts` | N/A |

**Conflict:** Two key management systems. Both valid — HSM for signing keys, Fireblocks for custody. Need unified `KeyAuthorityService` wrapping both.

---

## 2. Canonical Package Boundaries — The Sovereign Spine

All repos converge into 5 deterministic layers, published as `@sovereign/*` packages:

```
@sovereign/identity      ← Layer 1: Identity & Authority
@sovereign/ledger        ← Layer 2: Ledger & Settlement
@sovereign/compliance    ← Layer 3: Compliance & Guardrails
@sovereign/products      ← Layer 4: Product Factory
@sovereign/ui            ← Layer 5: Distribution (apps)
```

### 2.1 `@sovereign/identity` — Single Source of Authority

**Merges from:**
- `circle-superapp/src/lib/mog-os/types.ts` → `SovereignIdentity`, `Role`, `Permission`, RBAC matrix
- `circle-superapp/src/lib/namespace/` → Namespace registry (TLD NFTs, subnames)
- `circle-superapp/src/lib/xsmp/` → XSMP protocol (wallet-native messaging)
- `fth-capital-os/core/permissions.ts` → Permission checking functions
- `fth-institutional-core/packages/vc/` → Verifiable credentials (issuer, verifier, key registry, status registry)
- `fth-institutional-core/packages/audit/` → Hash-chained, signed audit log
- `fth-capital-os/core/hsm-manager.ts` + `fth-institutional-core` Fireblocks → `KeyAuthorityService`

**Canonical Exports:**
```typescript
// @sovereign/identity
export { SovereignIdentity, Role, Permission, ROLE_PERMISSIONS }
export { hasPermission, requirePermission, getPermissions }
export { NamespaceRoot, SubnameEntry, NamespaceRegistry }
export { DIDDocument, VerifiableCredential, VCIssuer, VCVerifier }
export { AuditLogEntry, AuditAction, AuditLogger }
export { KeyAuthorityService, KeyPurpose, KeyMetadata }
export { XSMPCommit, XSMPSession, WalletIdentity, AuthChallenge }
```

**Rules:**
- Every other package imports identity types from here
- No package may redeclare `Role`, `Permission`, or `Identity` types
- Audit is append-only, hash-chained, signed
- Key authority wraps both HSM and Fireblocks MPC

### 2.2 `@sovereign/ledger` — Single Capital Spine

**Merges from:**
- `fth-institutional-core/fth-platform/core/vault-ledger.ts` → Hash-chained, append-only ledger
- `fth-capital-os/services/ledger-service/` → Double-entry, 28-decimal precision
- `fth-capital-os/xrpl/` → Mint/burn/escrow/trustline/listener/resilience
- `fth-institutional-core/fth-platform/xrpl/` → Connection manager, account control, issuer module
- `fth-capital-os/services/settlement-bridge/` → Settlement state machine
- `fth-institutional-core/fth-platform/settlement/` → Payment intent, stablecoin rail, recorder
- `fth-capital-os/services/banking-reconciliation/` → Wire reconciliation
- `fth-institutional-core/fth-platform/funding/` → Bank rail ingester, funding machine
- `fth-institutional-core/fth-platform/stablecoins/` → Circle, RLUSD, PYUSD, Tether connectors
- `fth-institutional-core/fth-anchor-bridge/` → Genesis ceremony, XRPL submitter
- `fth-capital-os/core/guardrails.ts` → Operational guardrails

**Canonical Interface:**
```typescript
// @sovereign/ledger — The ONE Ledger
export interface SovereignLedger {
  // Capital operations
  mint(params: MintRequest): Promise<MintResult>
  burn(params: BurnRequest): Promise<BurnResult>
  allocate(params: AllocationRequest): Promise<AllocationResult>
  redeem(params: RedemptionRequest): Promise<RedemptionResult>
  settle(params: SettlementRequest): Promise<SettlementResult>
  reconcile(params: ReconcileRequest): Promise<ReconcileResult>

  // Chain operations
  anchor(params: AnchorRequest): Promise<AnchorResult>
  escrow(params: EscrowRequest): Promise<EscrowResult>

  // Guardrails
  checkGuardrail(check: GuardrailCheck): Promise<GuardrailResult>

  // Integrity
  verifyIntegrity(): Promise<IntegrityReport>
}
```

**XRPL Module Consolidation:**
```
@sovereign/ledger/xrpl/
├── connection-manager.ts   ← from fth-institutional-core (most robust)
├── issuer-manager.ts       ← from fth-capital-os (operational)
├── wallet-manager.ts       ← from fth-capital-os
├── trustline-manager.ts    ← from fth-capital-os
├── escrow-manager.ts       ← from fth-capital-os
├── mint-service.ts         ← from fth-capital-os
├── burn-service.ts         ← from fth-capital-os
├── listener.ts             ← from fth-capital-os
├── anchor-engine.ts        ← from fth-institutional-core
├── account-control.ts      ← from fth-institutional-core
├── currency.ts             ← from fth-capital-os
└── resilience.ts           ← from fth-capital-os
```

**Rules:**
- ONE connection manager (pool, failover, heartbeat)
- ONE mint/burn path
- ONE settlement state machine
- All capital movements route through `SovereignLedger`
- Hash-chained, append-only, 28-decimal precision
- Every entry has integrity verification

### 2.3 `@sovereign/compliance` — Single Compliance Gate

**Merges from:**
- `fth-institutional-core/packages/compliance-engine/` → YAML rule engine, evaluator, middleware
- `fth-capital-os/helios-marketing-compliance-engine/` → Howey analysis, jurisdiction modes, marketing
- `fth-institutional-core/packages/compliance-engine/rules/` → 28+ YAML rule sets
- `fth-capital-os/core/guardrails.ts` → Operational guardrails
- `circle-superapp/src/lib/desk/desk-compliance.ts` → Desk compliance checks

**Canonical Interface:**
```typescript
// @sovereign/compliance
export interface ComplianceGate {
  // Product launch gate
  evaluateProduct(product: ProductConfig): Promise<ComplianceVerdict>

  // Transaction gate
  evaluateTransaction(tx: TransactionIntent): Promise<ComplianceVerdict>

  // Marketing gate
  evaluateContent(content: MarketingContent): Promise<ComplianceVerdict>

  // KYC/AML gate
  evaluateIdentity(identity: SovereignIdentity): Promise<ComplianceVerdict>

  // Jurisdiction check
  checkJurisdiction(action: string, jurisdiction: string): Promise<ComplianceVerdict>

  // Guardrails
  checkGuardrail(check: GuardrailCheck): Promise<GuardrailResult>
}

export interface ComplianceVerdict {
  allowed: boolean
  ruleResults: RuleResult[]
  requiredDisclosures: string[]
  blockingViolations: RuleViolation[]
  warnings: RuleWarning[]
  auditHash: string
}
```

**Rules:**
- Every product launch, transaction, and marketing action goes through this gate
- YAML-driven rules for extensibility
- Howey analysis for securities compliance
- Guardrails enforced at this layer, not scattered

### 2.4 `@sovereign/products` — Declarative Product Factory

**Merges from:**
- `fth-institutional-core/fth-platform/bond/` → Bond lifecycle (7 states)
- `fth-institutional-core/fth-platform/collateral/` → Collateral lifecycle (10 states)
- `fth-institutional-core/fth-platform/equity-runtime/` → Equity token, cap table, pricing
- `fth-institutional-core/fth-platform/defi/` → Aave, Chainlink, protocol registry
- `circle-superapp/src/lib/factory/` → Product factory (config, pricing, scoring, verticals)
- `circle-superapp/src/lib/desk/` → Allocation gateway, revenue engine
- `projects/mogos/src/mogos/structuring/` → SPV, bonds, facilities, cat bonds
- `projects/mogos/src/mogos/rwa/` → Carbon, natural capital, collateral lockbox

**Products become config:**
```yaml
# Example: stablecoin product
product:
  id: FTHUSD
  type: stablecoin
  chain: XRPL
  backing: USD
  mintAuthority: KEY_AUTH_TREASURY
  complianceProfile: US_SEC_STABLECOIN
  reserveModel: segregated
  guardrails:
    dailyMintCap: 10000000
    requireReserveValidation: true
    requireKycLevel: 2
```

### 2.5 `@sovereign/ui` — Distribution Layer

**No core logic. Pure interface.**

```
@sovereign/ui/
├── control-plane/        ← NEW: Sovereign Control Plane (built in Phase 2)
├── marketing/            ← circle-superapp landing page
├── client-portal/        ← fth-capital-os client portal
├── admin-portal/         ← fth-capital-os admin portal
├── backoffice/           ← circle-superapp backoffice
└── api/                  ← API routes (all delegate to @sovereign/ledger + compliance)
```

---

## 3. Trust Boundaries

```
┌─────────────────────────────────────────────────────────┐
│                    PUBLIC INTERNET                       │
│  Website · API · WebSocket · XSMP Messages              │
└───────────────────────┬─────────────────────────────────┘
                        │ TLS + JWT + Wallet Sig
┌───────────────────────▼─────────────────────────────────┐
│              IDENTITY BOUNDARY                          │
│  @sovereign/identity                                    │
│  RBAC gate · KYC gate · Namespace verify · VC check     │
└───────────────────────┬─────────────────────────────────┘
                        │ Authenticated + Authorized
┌───────────────────────▼─────────────────────────────────┐
│            COMPLIANCE BOUNDARY                          │
│  @sovereign/compliance                                  │
│  Rule evaluation · Guardrails · Jurisdiction check      │
└───────────────────────┬─────────────────────────────────┘
                        │ Compliant
┌───────────────────────▼─────────────────────────────────┐
│              PRODUCT BOUNDARY                           │
│  @sovereign/products                                    │
│  Bond · Fund · Stablecoin · RWA · SPV · Cat Bond        │
│  State machines · Config-driven lifecycle               │
└───────────────────────┬─────────────────────────────────┘
                        │ Validated intent
┌───────────────────────▼─────────────────────────────────┐
│              LEDGER BOUNDARY                            │
│  @sovereign/ledger                                      │
│  Append-only · Hash-chained · 28-decimal                │
│  Mint / Burn / Settle / Reconcile / Anchor              │
└───────────────────────┬─────────────────────────────────┘
                        │ Signed transaction
┌───────────────────────▼─────────────────────────────────┐
│               KEY AUTHORITY BOUNDARY                    │
│  HSM Manager + Fireblocks MPC + Multisig                │
│  Guardian quorum · Emergency freeze · Key rotation      │
└───────────────────────┬─────────────────────────────────┘
                        │ Hardware-signed
┌───────────────────────▼─────────────────────────────────┐
│               CHAIN BOUNDARY                            │
│  XRPL · Bitcoin · Polygon · Stellar · 9 more chains    │
│  3-tier anchoring: BTC (T1) → XRPL (T2) → Polygon (T3)│
└─────────────────────────────────────────────────────────┘
```

---

## 4. State Machine Map

### 4.1 Capital Flow State Machine
```
WIRE_IN → RECONCILED → KYC_PASSED → MINTED → ALLOCATED → PERFORMING →
DISTRIBUTION → [loop or] → REDEMPTION_REQUESTED → APPROVED →
BURNED → WIRE_OUT
```

### 4.2 Bond Lifecycle (7 states)
```
DRAFT → APPROVED → SUBSCRIPTION → FUNDED → ACTIVE → MATURED → REDEEMED
```

### 4.3 Collateral Lifecycle (10 states)
```
UNENCUMBERED → PLEDGED → VERIFIED → VALUED → LIEN_PLACED →
ESCROWED → ACTIVE → MARGIN_CALL → RELEASED → LIQUIDATED
```

### 4.4 Funding Lifecycle (9 states)
```
INITIATED → PENDING_KYC → KYC_APPROVED → FIAT_RECEIVED →
MINTING → RESERVE_VALIDATED → CREDITED → FAILED → REVERSED
```

### 4.5 Settlement Intent (7 states)
```
CREATED → VALIDATED → ROUTED → EXECUTING → SETTLED → FAILED → CANCELLED
```

### 4.6 Case Lifecycle (mog-os, 10 states)
```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → FUNDED →
IN_PROGRESS → COMPLETED → REPORTED → ARCHIVED → REJECTED
```

### 4.7 Identity Lifecycle (5 states)
```
UNVERIFIED → PENDING → VERIFIED → RESTRICTED → ARCHIVED
```

### 4.8 XSMP Message Lifecycle
```
RECEIVED → ANCHORED → READ → REPLIED → ARCHIVED → FLAGGED
```

---

## 5. AI Agent Governance (Missing — To Build)

### Current agent inventory:
| Agent | Location | Governance |
|-------|----------|------------|
| Discovery Agent | `mogos/discovery/agents/` | None |
| Compliance Agent | `mogos/discovery/agents/` | None |
| Risk Agent | `mogos/discovery/agents/` | None |
| Writing Agent | `mogos/discovery/agents/` | None |
| Orchestrator | `mogos/discovery/agents/` | None |
| Capital Agent | `circle-superapp/lib/mog-os/agents.ts` | Confidence threshold + risk threshold |
| Helios Engine | `fth-capital-os/helios-marketing-compliance-engine/` | None |

### Required: `@sovereign/identity/agents/`
```typescript
export interface AgentGovernancePolicy {
  agentId: string
  type: AgentType
  // Sandbox
  allowedActions: AgentAction[]
  prohibitedActions: AgentAction[]
  maxAutoActionsPerDay: number
  requireHumanApprovalAbove: number // USD threshold
  // Audit
  logAllDecisions: boolean
  hashInputsOutputs: boolean
  anchorDecisions: boolean
  // Compliance
  complianceCheckRequired: boolean
  jurisdictionRestrictions: string[]
}
```

---

## 6. Migration Plan

### Phase 1: Extract & Compress (2 weeks)

| Step | Action | Source → Target |
|------|--------|-----------------|
| 1.1 | Extract unified type system | `mog-os/types.ts` + `canonical-types.ts` + `models/index.ts` → `@sovereign/identity/types.ts` |
| 1.2 | Extract RBAC | `mog-os/types.ts` ROLE_PERMISSIONS (superset) → `@sovereign/identity/rbac.ts` |
| 1.3 | Extract namespace | `circle-superapp/lib/namespace/` → `@sovereign/identity/namespace/` |
| 1.4 | Extract XSMP | `circle-superapp/lib/xsmp/` → `@sovereign/identity/xsmp/` |
| 1.5 | Extract VC | `4100-DR/packages/vc/` → `@sovereign/identity/vc/` |
| 1.6 | Extract audit | `4100-DR/packages/audit/` + `mog-os` events → `@sovereign/identity/audit/` |
| 1.7 | Merge key authority | `fth-capital-os/core/hsm-manager.ts` + Fireblocks → `@sovereign/identity/keys/` |
| 1.8 | Consolidate XRPL | 4 XRPL modules → `@sovereign/ledger/xrpl/` (one connection manager, one mint/burn) |
| 1.9 | Merge ledger | VaultLedger + LedgerService → `@sovereign/ledger/core/` |
| 1.10 | Merge compliance | Helios + YAML engine → `@sovereign/compliance/` |

### Phase 2: Sovereign Control Plane (1 week)

Build `sovereign-control-plane/` — the unified operator cockpit:

| Page | Purpose |
|------|---------|
| `/` | System health dashboard (all chains, all services) |
| `/capital` | Capital flow visualizer (wire→mint→allocate→distribute→redeem→burn→wire) |
| `/keys` | Key authority dashboard (HSM status, MPC signers, rotation schedule) |
| `/compliance` | Compliance console (rule evaluation, violations, guardrail status) |
| `/chains` | Chain health monitor (13 chains, connection status, ledger lag) |
| `/namespaces` | Namespace manager (TLD registry, subname administration) |
| `/agents` | Agent governance panel (decisions log, sandbox enforcement, overrides) |
| `/audit` | Audit timeline explorer (hash-verified, filterable, exportable) |
| `/settlement` | Settlement dashboard (state machine visualization, pending intents) |
| `/risk` | Risk exposure heatmap (by chain, by product, by counterparty) |

### Phase 3: Formal Product Layer (1 week)

Convert all products to YAML config + runtime:
- Stablecoin (FTHUSD, USDF)
- Bonds (series lifecycle)
- Funds (allocation + performance)
- RWA (carbon, natural capital)
- SPVs (structured vehicles)

---

## 7. Cross-Repo Dependency Map

```
@sovereign/identity ←── no dependencies (foundation)
       ↑
@sovereign/ledger ←──── imports identity types, key authority
       ↑
@sovereign/compliance ← imports identity types, ledger types
       ↑
@sovereign/products ←── imports ledger interface, compliance gate, identity
       ↑
@sovereign/ui ←──────── imports everything, exports nothing
```

**Rule:** Dependencies flow UP only. No circular imports. No cross-layer leakage.

---

## 8. What Gets Deleted

After convergence, these modules become deprecated:

| Deprecated | Replaced By |
|-----------|-------------|
| `fth-capital-os/core/permissions.ts` | `@sovereign/identity/rbac.ts` |
| `fth-capital-os/core/audit-log.ts` | `@sovereign/identity/audit/` |
| `fth-capital-os/core/models/index.ts` | `@sovereign/identity/types.ts` |
| `fth-capital-os/xrpl/` (all) | `@sovereign/ledger/xrpl/` |
| `circle-superapp/src/lib/circle/xrpl.ts` | `@sovereign/ledger/xrpl/` |
| `fth-institutional-core/fth-platform/xrpl/` | `@sovereign/ledger/xrpl/` |
| `fth-institutional-core/fth-anchor-bridge/` | `@sovereign/ledger/xrpl/anchor-engine.ts` |
| `fth-capital-os/helios-marketing-compliance-engine/` | `@sovereign/compliance/howey/` |
| `fth-capital-os/core/guardrails.ts` | `@sovereign/compliance/guardrails/` |
| `circle-superapp/src/lib/mog-os/types.ts` (identity subset) | `@sovereign/identity/types.ts` |
| `circle-superapp/src/lib/namespace/` | `@sovereign/identity/namespace/` |
| `circle-superapp/src/lib/xsmp/` | `@sovereign/identity/xsmp/` |

**Nothing gets thrown away.** Code migrates into canonical packages. Old locations become re-exports during transition, then get removed.

---

## 9. Invariants (System-Wide)

These hold true across the entire converged system:

1. **No capital movement without identity verification** — `@sovereign/identity` gate
2. **No capital movement without compliance check** — `@sovereign/compliance` gate
3. **No mint without reserve validation** — `@sovereign/ledger` guardrail
4. **No private keys in application memory** — `@sovereign/identity/keys/` HSM/MPC boundary
5. **Every ledger entry hash-chained** — `@sovereign/ledger` integrity
6. **Every audit entry hash-chained and signed** — `@sovereign/identity/audit/` integrity
7. **AI agents cannot exceed governance thresholds** — `@sovereign/identity/agents/` sandbox
8. **Dependencies flow one direction only** — identity ← ledger ← compliance ← products ← ui
9. **3-tier anchoring for all high-value operations** — BTC (T1) → XRPL (T2) → Polygon (T3)
10. **One XRPL connection manager** — pool, failover, heartbeat, no duplicates
