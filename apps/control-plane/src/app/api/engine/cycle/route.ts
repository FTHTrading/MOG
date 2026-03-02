/**
 * POST /api/engine/cycle
 *
 * Execute a full capital cycle: mint → settle → anchor → verify.
 *
 * This is the showcase endpoint — it demonstrates the full stack:
 *   1. Mint tokens (guardrails enforced)
 *   2. Settle 10% to treasury
 *   3. Anchor the audit hash to XRPL testnet
 *   4. Verify ledger integrity (hash chain + conservation)
 *   5. Verify audit chain (hash chain)
 *
 * Body: { amount: string, initiatedBy: string }
 *
 * Returns all 5 results in one response.
 */

import { NextResponse } from 'next/server';
import { engine } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    if (!engine.initialized) {
      await engine.initialize({ skipXrpl: !process.env.XRPL_LIVE });
    }

    const body = await request.json();
    const { amount, initiatedBy } = body;

    if (!amount || !initiatedBy) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: amount, initiatedBy' },
        { status: 400 },
      );
    }

    const result = await engine.executeCapitalCycle({ amount, initiatedBy });

    return NextResponse.json({
      ok: true,
      data: {
        ...result,
        engineStatus: engine.getStatus(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'Capital cycle failed' },
      { status: 500 },
    );
  }
}
