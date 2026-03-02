/**
 * GET /api/engine/verify?txHash=...&dataHash=...
 *
 * Verify an XRPL-anchored proof.
 * Checks both:
 *   1. Local anchor history (signed receipt)
 *   2. On-chain verification (XRPL memo match)
 *
 * This is the public verification endpoint.
 * Third parties can independently verify that a data hash was anchored.
 */

import { NextResponse } from 'next/server';
import { engine } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    if (!engine.initialized) {
      await engine.initialize({ skipXrpl: !process.env.XRPL_LIVE });
    }

    const { searchParams } = new URL(request.url);
    const txHash = searchParams.get('txHash');
    const dataHash = searchParams.get('dataHash');

    if (!txHash && !dataHash) {
      return NextResponse.json(
        { ok: false, error: 'Provide txHash and/or dataHash query parameters' },
        { status: 400 },
      );
    }

    // Search local anchor history
    const history = engine.anchorEngine.getHistory();
    const localMatches = history.filter((receipt) => {
      if (txHash && dataHash) {
        return receipt.txHash === txHash && receipt.dataHash.toUpperCase() === dataHash.toUpperCase();
      }
      if (txHash) return receipt.txHash === txHash;
      if (dataHash) return receipt.dataHash.toUpperCase() === dataHash.toUpperCase();
      return false;
    });

    // On-chain verification (if both params provided)
    let onChainVerified: boolean | null = null;
    if (txHash && dataHash) {
      try {
        onChainVerified = await engine.anchorEngine.verify(txHash, dataHash);
      } catch {
        onChainVerified = null; // XRPL offline
      }
    }

    return NextResponse.json({
      ok: true,
      verification: {
        txHash: txHash ?? null,
        dataHash: dataHash ?? null,
        localReceipts: localMatches,
        localMatch: localMatches.length > 0,
        onChainVerified,
        checkedAt: new Date().toISOString(),
        verificationChain: localMatches.length > 0
          ? {
              dataHash: localMatches[0].dataHash,
              anchoredToXrpl: localMatches[0].txHash,
              ledgerIndex: localMatches[0].ledgerIndex,
              anchoredAt: localMatches[0].timestamp,
              receiptVerified: localMatches[0].verified,
            }
          : null,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Verification failed' },
      { status: 500 },
    );
  }
}
