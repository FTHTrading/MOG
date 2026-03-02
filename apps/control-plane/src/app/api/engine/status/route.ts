/**
 * GET /api/engine/status
 *
 * Returns full engine status: XRPL connection, ledger stats,
 * audit chain health, guardrail pass rate, anchor count.
 */

import { NextResponse } from 'next/server';
import { engine } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!engine.initialized) {
      await engine.initialize({ skipXrpl: !process.env.XRPL_LIVE });
    }

    const status = engine.getStatus();
    return NextResponse.json({ ok: true, data: status });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'Unknown error' },
      { status: 500 },
    );
  }
}
