/**
 * POST /api/engine/mint
 *
 * Mint tokens into a capital account.
 * Body: { accountId: string, amount: string, currency: string, initiatedBy: string }
 *
 * All guardrails are enforced before execution.
 * Audit entry is emitted after execution.
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
    const { accountId, amount, currency, initiatedBy } = body;

    if (!accountId || !amount || !initiatedBy) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: accountId, amount, initiatedBy' },
        { status: 400 },
      );
    }

    const result = await engine.ledger.mint({
      accountId,
      amount,
      currency: currency ?? 'FTHUSD',
      reserveValidationId: `rv-${Date.now()}`,
      initiatedBy,
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'Mint failed' },
      { status: 500 },
    );
  }
}
