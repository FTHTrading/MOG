/**
 * GET /api/engine/ledger
 *
 * Query ledger entries.
 * Query params:
 *   accountId?: string filter
 *   type?: TransactionType filter
 *   limit?: number (default 50)
 *
 * Returns entries + ledger stats.
 */

import { NextResponse } from 'next/server';
import { engine } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    if (!engine.initialized) {
      await engine.initialize({ skipXrpl: !process.env.XRPL_LIVE });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);

    const entries = engine.ledger.getAllEntries();
    const latest = entries.slice(-limit);

    return NextResponse.json({
      ok: true,
      data: {
        entries: latest,
        total: entries.length,
        returned: latest.length,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'Ledger query failed' },
      { status: 500 },
    );
  }
}
