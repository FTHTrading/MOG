# ═══════════════════════════════════════════════════════════════════════════════
#  SOVEREIGNTY DEPRECATION MANIFEST
#  sovereign-spine / FTHTrading/MOG
# ═══════════════════════════════════════════════════════════════════════════════
#
#  This document declares which repositories, modules, and code paths are
#  SUPERSEDED by the sovereign-spine monorepo. Once migration is complete,
#  these should be archived (not deleted — we keep receipts).
#
#  Status Key:
#    SUPERSEDED  — Logic now lives in @sovereign/*. Stop importing.
#    DEPRECATED  — Still referenced but scheduled for removal.
#    ARCHIVED    — Frozen. Read-only. Will not receive updates.
#    ACTIVE      — Still in use, not yet migrated.
#
# ═══════════════════════════════════════════════════════════════════════════════


# ─── Repository-Level Deprecation ────────────────────────────────────────────

## fth-capital-os
Status:       DEPRECATED → SUPERSEDED (Phase 1 target)
Replaced By:  @sovereign/identity, @sovereign/ledger
What Moves:
  - core/permissions.ts       → @sovereign/identity (rbac.ts)
  - core/models/index.ts      → @sovereign/identity (types.ts)
  - core/audit-log.ts         → @sovereign/identity (audit.ts)
  - core/hsm-manager.ts       → @sovereign/identity (keys.ts)
  - core/guardrails.ts        → @sovereign/ledger (types.ts — GuardrailType)
  - xrpl/                     → @sovereign/ledger (xrpl/types.ts)
  - services/ledger-service   → @sovereign/ledger (sovereign-ledger.ts)
  - services/settlement       → @sovereign/ledger (sovereign-ledger.ts)
What Stays (temporarily):
  - Fastify API routes (until API layer is built in sovereign-spine)
  - Prisma schema (until DB migration layer is added)
  - Admin/Client portals (until control-plane replaces them)
Action:       Archive after API + DB migration layers are built.

## fth-institutional-core
Status:       DEPRECATED → SUPERSEDED (Phase 1 target)
Replaced By:  @sovereign/identity, @sovereign/ledger, @sovereign/compliance
What Moves:
  - fth-platform/core/canonical-types.ts    → @sovereign/identity (types.ts)
  - fth-platform/xrpl/connection-manager.ts → @sovereign/ledger (xrpl/types.ts)
  - fth-anchor-bridge/                      → @sovereign/ledger (anchoring)
  - compliance/rules/*.yaml                 → @sovereign/compliance (rule engine)
  - packages/audit/                         → @sovereign/identity (audit.ts)
  - packages/vc/                            → @sovereign/identity (types.ts — VC)
  - bond-runtime, collateral-runtime        → @sovereign/products
Action:       Archive after compliance YAML migration.

## circle-superapp (mensofgod.com)
Status:       ACTIVE (production site)
Replaced By:  Partially — identity layer only
What Moves:
  - src/lib/mog-os/index.ts (type system)  → @sovereign/identity (types.ts)
  - src/lib/circle/xrpl.ts                 → @sovereign/ledger (xrpl/types.ts)
  - XSMP logic                             → @sovereign/identity (namespace.ts)
What Stays:
  - All Next.js pages/routes (production UI)
  - API routes (will import from @sovereign/* instead of local lib/)
  - Tailwind / marketing content
Action:       Refactor imports to @sovereign/* packages. Do NOT archive.

## 4100-DR
Status:       DEPRECATED
Replaced By:  @sovereign/identity (audit, vc, merkle), @sovereign/compliance
What Moves:
  - packages/audit/                         → @sovereign/identity (audit.ts)
  - packages/compliance/                    → @sovereign/compliance
  - packages/vc/                            → @sovereign/identity (types.ts)
  - packages/merkle/                        → @sovereign/ledger (integrity)
  - IPFS anchoring (100+ CIDs)             → @sovereign/ledger (anchoring)
Action:       Archive. IPFS CIDs are immutable and self-referencing.

## projects/mogos (Python)
Status:       ACTIVE (separate runtime)
Replaced By:  Not directly — Python stays Python
Integration:  Will call @sovereign/* via REST API or gRPC bridge
What Stays:   Everything (discovery agents, structuring, sovereign adapters)
Action:       Build API bridge. Do not archive.

## kevan-burns-empire
Status:       ACTIVE (marketing site)
Replaced By:  Nothing — standalone Next.js marketing
Action:       Keep as-is. No migration needed.

## MOG-LLC
Status:       ARCHIVED (empty repo)
Action:       Delete or point to FTHTrading/MOG.

## UnyXRPL, unykorn-*, soulbound, spectral-ledger, multi-chain-infrastructure
Status:       ARCHIVED (experimental)
Replaced By:  @sovereign/ledger (XRPL), @sovereign/identity (namespace)
Action:       Archive. Reference only.


# ─── Module-Level Deprecation ────────────────────────────────────────────────

## RBAC Systems (3 → 1)
  KILLED: fth-capital-os/core/permissions.ts (6 roles, 20 perms)
  KILLED: circle-superapp/lib/mog-os/index.ts (9 roles, 42 perms)
  KILLED: fth-institutional-core canonical-types.ts (mode-based)
  CANONICAL: @sovereign/identity/rbac.ts (14 roles, 44 perms)

## XRPL Modules (4 → 1)
  KILLED: fth-capital-os/xrpl/
  KILLED: circle-superapp/lib/circle/xrpl.ts
  KILLED: fth-institutional-core/fth-platform/xrpl/
  KILLED: fth-institutional-core/fth-anchor-bridge/
  CANONICAL: @sovereign/ledger/xrpl/types.ts

## Ledger Implementations (2 → 1)
  KILLED: fth-capital-os/services/ledger-service (double-entry, 28-decimal)
  KILLED: fth-institutional-core vault-ledger (hash-chained, append-only)
  CANONICAL: @sovereign/ledger/sovereign-ledger.ts (merged: both properties)

## Audit Systems (3 → 1)
  KILLED: fth-capital-os/core/audit-log.ts (flat log)
  KILLED: fth-institutional-core/packages/audit (hash-chained)
  KILLED: 4100-DR/packages/audit (signed bundles)
  CANONICAL: @sovereign/identity/audit.ts (hash-chained + signed + anchored)

## Key Management (2 → 1)
  KILLED: fth-capital-os/core/hsm-manager.ts (826 LOC, HSM only)
  KILLED: fth-institutional-core Fireblocks integration (MPC only)
  CANONICAL: @sovereign/identity/keys.ts (HSM + MPC unified)

## Compliance Engines (2 → 1)
  KILLED: fth-capital-os Helios compliance (Howey + marketing)
  KILLED: fth-institutional-core YAML rules (28+ files)
  CANONICAL: @sovereign/compliance (merged: Howey + YAML + guardrails)


# ─── Timeline ────────────────────────────────────────────────────────────────

Phase 1 (NOW):
  ✅ Canonical packages built
  ✅ Control plane scaffolded
  ✅ FTHTrading/MOG repo created
  ⬜ Invariant tests passing
  ⬜ CI pipeline enforcing

Phase 2 (Next 2 weeks):
  ⬜ circle-superapp imports refactored to @sovereign/*
  ⬜ fth-capital-os API routes migrated
  ⬜ fth-institutional-core compliance YAML migrated
  ⬜ 4100-DR archived

Phase 3 (Next 4 weeks):
  ⬜ fth-capital-os archived
  ⬜ fth-institutional-core archived
  ⬜ Live XRPL testnet wired
  ⬜ Real audit hash anchoring
  ⬜ Production environment validated
