/**
 * POST /api/engine/anchor
 *
 * Anchor a data hash to XRPL testnet.
 * Body: { dataHash: string, metadata?: Record<string, string>, initiatedBy: string }
 *
 * Returns the XRPL transaction hash + ledger index as proof.
 */

import { NextResponse } from 'next/server';
import { engine } from '@/lib/engine';
import { AnchoringTier } from '@sovereign/ledger';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    if (!engine.initialized) {
      await engine.initialize({ skipXrpl: !process.env.XRPL_LIVE });
    }

    const body = await request.json();
    const { dataHash, metadata, initiatedBy } = body;

    if (!dataHash || !initiatedBy) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: dataHash, initiatedBy' },
        { status: 400 },
      );
    }

    const result = await engine.ledger.anchor({
      dataHash,
      tier: AnchoringTier.TIER_2_XRPL,
      metadata: metadata ?? {},
      initiatedBy,
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'Anchor failed' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/engine/anchor
 *
 * Get anchor history.
 */
export async function GET() {
  try {
    if (!engine.initialized) {
      await engine.initialize({ skipXrpl: !process.env.XRPL_LIVE });
    }

    const history = engine.anchorEngine.getHistory();
    return NextResponse.json({ ok: true, data: history });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'Failed to get anchor history' },
      { status: 500 },
    );
  }
}
