/**
 * Anchor Verification — Sovereign Control Plane
 *
 * Public verification page for XRPL-anchored proofs.
 * Third parties can independently verify that a data hash
 * was timestamped on the XRP Ledger.
 *
 * No authentication required. This is a transparency tool.
 */

'use client';

import { useState } from 'react';

interface VerificationResult {
  txHash: string | null;
  dataHash: string | null;
  localMatch: boolean;
  onChainVerified: boolean | null;
  checkedAt: string;
  localReceipts: {
    txHash: string;
    ledgerIndex: number;
    dataHash: string;
    timestamp: string;
    verified: boolean;
  }[];
  verificationChain: {
    dataHash: string;
    anchoredToXrpl: string;
    ledgerIndex: number;
    anchoredAt: string;
    receiptVerified: boolean;
  } | null;
}

export default function VerifyPage() {
  const [txHash, setTxHash] = useState('');
  const [dataHash, setDataHash] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!txHash && !dataHash) {
      setError('Enter at least one field: XRPL Transaction Hash or Data Hash');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams();
      if (txHash.trim()) params.set('txHash', txHash.trim());
      if (dataHash.trim()) params.set('dataHash', dataHash.trim());

      const res = await fetch(`/api/engine/verify?${params.toString()}`);
      const json = await res.json();

      if (!json.ok) {
        setError(json.error || 'Verification failed');
        return;
      }

      setResult(json.verification);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-sovereign-50">
          Sovereign Proof Verification
        </h1>
        <p className="mt-2 text-sm text-sovereign-400">
          Independently verify that data was anchored to the XRP Ledger.
          <br />
          No login required. Cryptographically verifiable.
        </p>
      </div>

      {/* Input Form */}
      <div className="rounded-lg border border-sovereign-700 bg-sovereign-900 p-6 space-y-4">
        <div>
          <label
            htmlFor="txHash"
            className="block text-sm font-medium text-sovereign-300 mb-1"
          >
            XRPL Transaction Hash
          </label>
          <input
            id="txHash"
            type="text"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="e.g. A1B2C3D4E5F6..."
            className="w-full rounded border border-sovereign-600 bg-sovereign-950 px-4 py-2.5 font-mono text-sm text-sovereign-100 placeholder:text-sovereign-600 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
        </div>
        <div>
          <label
            htmlFor="dataHash"
            className="block text-sm font-medium text-sovereign-300 mb-1"
          >
            Data Hash (SHA-256)
          </label>
          <input
            id="dataHash"
            type="text"
            value={dataHash}
            onChange={(e) => setDataHash(e.target.value)}
            placeholder="e.g. a3f8c291d4b7e2..."
            className="w-full rounded border border-sovereign-600 bg-sovereign-950 px-4 py-2.5 font-mono text-sm text-sovereign-100 placeholder:text-sovereign-600 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
        </div>
        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full rounded bg-gold-600 py-2.5 text-sm font-semibold text-sovereign-950 hover:bg-gold-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Verifying...' : 'Verify Proof'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-700 bg-red-900/30 p-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-6">
          {/* Verdict */}
          <div
            className={`rounded-lg border p-6 text-center ${
              result.localMatch || result.onChainVerified
                ? 'border-green-600 bg-green-900/20'
                : 'border-red-600 bg-red-900/20'
            }`}
          >
            <div className="text-4xl mb-2">
              {result.localMatch || result.onChainVerified ? '✓' : '✗'}
            </div>
            <h2
              className={`text-xl font-bold ${
                result.localMatch || result.onChainVerified
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}
            >
              {result.localMatch || result.onChainVerified
                ? 'PROOF VERIFIED'
                : 'NOT FOUND'}
            </h2>
            <p className="mt-1 text-sm text-sovereign-400">
              Checked at {new Date(result.checkedAt).toLocaleString()}
            </p>
          </div>

          {/* Verification Chain */}
          {result.verificationChain && (
            <div className="rounded-lg border border-sovereign-700 bg-sovereign-900 p-6">
              <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider mb-4">
                Proof Chain
              </h3>
              <div className="space-y-3">
                <ProofRow
                  label="Data Hash"
                  value={result.verificationChain.dataHash}
                  mono
                />
                <div className="flex justify-center text-sovereign-600">↓</div>
                <ProofRow
                  label="XRPL Transaction"
                  value={result.verificationChain.anchoredToXrpl}
                  mono
                  link={`https://testnet.xrpl.org/transactions/${result.verificationChain.anchoredToXrpl}`}
                />
                <div className="flex justify-center text-sovereign-600">↓</div>
                <ProofRow
                  label="Ledger Index"
                  value={result.verificationChain.ledgerIndex.toLocaleString()}
                />
                <div className="flex justify-center text-sovereign-600">↓</div>
                <ProofRow
                  label="Anchored At"
                  value={new Date(result.verificationChain.anchoredAt).toLocaleString()}
                />
                <div className="flex justify-center text-sovereign-600">↓</div>
                <ProofRow
                  label="Receipt Verified"
                  value={result.verificationChain.receiptVerified ? 'tesSUCCESS' : 'UNCONFIRMED'}
                  highlight={result.verificationChain.receiptVerified}
                />
              </div>
            </div>
          )}

          {/* On-Chain Status */}
          {result.onChainVerified !== null && (
            <div className="rounded-lg border border-sovereign-700 bg-sovereign-900 p-6">
              <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider mb-4">
                On-Chain Verification
              </h3>
              <div className="flex items-center gap-3">
                <span
                  className={`h-3 w-3 rounded-full ${
                    result.onChainVerified ? 'bg-green-400' : 'bg-red-400'
                  }`}
                />
                <span className="text-sm text-sovereign-200">
                  {result.onChainVerified
                    ? 'Memo data on XRPL matches the provided hash'
                    : 'Memo data on XRPL does NOT match the provided hash'}
                </span>
              </div>
            </div>
          )}

          {/* All Matching Receipts */}
          {result.localReceipts.length > 0 && (
            <div className="rounded-lg border border-sovereign-700 bg-sovereign-900 p-6">
              <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider mb-4">
                Anchor Receipts ({result.localReceipts.length})
              </h3>
              <div className="space-y-3">
                {result.localReceipts.map((receipt, i) => (
                  <div
                    key={i}
                    className="rounded border border-sovereign-700 bg-sovereign-950 p-4 font-mono text-xs text-sovereign-300 space-y-1"
                  >
                    <div>
                      <span className="text-sovereign-500">txHash: </span>
                      {receipt.txHash}
                    </div>
                    <div>
                      <span className="text-sovereign-500">dataHash: </span>
                      {receipt.dataHash}
                    </div>
                    <div>
                      <span className="text-sovereign-500">ledger: </span>
                      {receipt.ledgerIndex}
                    </div>
                    <div>
                      <span className="text-sovereign-500">time: </span>
                      {new Date(receipt.timestamp).toLocaleString()}
                    </div>
                    <div>
                      <span className="text-sovereign-500">verified: </span>
                      <span className={receipt.verified ? 'text-green-400' : 'text-yellow-400'}>
                        {receipt.verified ? 'YES' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-sovereign-600 pt-8 border-t border-sovereign-800">
        Sovereign Proof System — Vaughan Capital Advisory
        <br />
        Powered by XRP Ledger · SHA-256 Hash Chains · Deterministic Anchoring
      </div>
    </div>
  );
}

function ProofRow({
  label,
  value,
  mono,
  link,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  link?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between rounded bg-sovereign-950 px-4 py-3 border border-sovereign-800">
      <span className="text-xs text-sovereign-500 uppercase tracking-wider">{label}</span>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-xs text-gold-400 hover:text-gold-300 underline ${mono ? 'font-mono' : ''}`}
        >
          {value.length > 24 ? `${value.substring(0, 12)}...${value.substring(value.length - 12)}` : value}
        </a>
      ) : (
        <span
          className={`text-xs ${
            highlight ? 'text-green-400 font-semibold' : 'text-sovereign-200'
          } ${mono ? 'font-mono' : ''}`}
        >
          {value.length > 48 ? `${value.substring(0, 16)}...${value.substring(value.length - 16)}` : value}
        </span>
      )}
    </div>
  );
}
