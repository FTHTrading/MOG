/**
 * GET /api/engine/audit
 *
 * Query the hash-chained audit trail.
 * Query params:
 *   action?: AuditAction filter
 *   actorId?: string filter
 *   module?: ModuleCategory filter
 *   limit?: number (default 50)
 *
 * POST /api/engine/audit/verify
 *
 * Verify the entire audit hash chain integrity.
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
    const action = url.searchParams.get('action') ?? undefined;
    const actorId = url.searchParams.get('actorId') ?? undefined;
    const module = url.searchParams.get('module') ?? undefined;
    const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);

    const entries = await engine.auditLogger.query({
      actions: action ? [action as any] : undefined,
      actorId,
      module: module as any,
    });

    const latest = entries.slice(-limit);
    const chainValid = await engine.auditLogger.verifyChain();

    return NextResponse.json({
      ok: true,
      data: {
        entries: latest,
        total: entries.length,
        returned: latest.length,
        chainIntegrity: chainValid,
        latestHash: engine.auditLogger.getLatestHash(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'Audit query failed' },
      { status: 500 },
    );
  }
}
