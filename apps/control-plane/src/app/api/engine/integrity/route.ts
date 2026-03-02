/**
 * GET /api/engine/integrity
 *
 * Verify the entire sovereign ledger integrity:
 *   - Hash chain continuity (every entry references previous hash)
 *   - Conservation invariant (total minted = total burned + total outstanding)
 *   - Audit chain integrity
 *
 * This is the single endpoint that proves the system is sound.
 */

import { NextResponse } from 'next/server';
import { engine } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!engine.initialized) {
      await engine.initialize({ skipXrpl: !process.env.XRPL_LIVE });
    }

    const ledgerIntegrity = await engine.ledger.verifyIntegrity();
    const auditChainValid = await engine.auditLogger.verifyChain();
    const guardrailStatus = engine.guardrailEngine.getStatus();

    return NextResponse.json({
      ok: true,
      data: {
        ledger: ledgerIntegrity,
        auditChain: {
          valid: auditChainValid,
          entries: engine.auditLogger.getEntryCount(),
          latestHash: engine.auditLogger.getLatestHash(),
        },
        guardrails: {
          totalChecks: guardrailStatus.totalChecks,
          passRate: guardrailStatus.passRate,
          frozenAccounts: guardrailStatus.frozenAccounts,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'Integrity check failed' },
      { status: 500 },
    );
  }
}
