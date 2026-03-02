/**
 * GET /api/engine/guardrails
 *
 * Get guardrail engine status — all 7 guardrail check states,
 * total checks run, pass rate, frozen accounts.
 *
 * POST /api/engine/guardrails/check
 *
 * Run a specific guardrail check.
 * Body: { type: GuardrailType, params: Record<string, any> }
 */

import { NextResponse } from 'next/server';
import { engine } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!engine.initialized) {
      await engine.initialize({ skipXrpl: !process.env.XRPL_LIVE });
    }

    const status = engine.guardrailEngine.getStatus();
    return NextResponse.json({ ok: true, data: status });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'Guardrail status failed' },
      { status: 500 },
    );
  }
}
