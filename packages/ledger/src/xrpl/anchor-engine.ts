/**
 * @sovereign/ledger — XRPL Anchor Engine (LIVE)
 *
 * Anchors data hashes to the XRPL as memo transactions.
 * This is Tier 2 anchoring (XRPL). Tier 1 = BTC, Tier 3 = Polygon.
 *
 * How it works:
 *   1. Take a SHA-256 hash of any data (audit entry, ledger batch, compliance verdict)
 *   2. Submit a zero-value XRPL transaction with the hash in memo fields
 *   3. Wait for validation (ledger close)
 *   4. Return the tx hash + ledger index as proof
 *
 * This is a timestamping service on a decentralized ledger.
 * The hash is permanently recorded. Anyone can verify it existed at ledger close time.
 */

import { Wallet, xrpToDrops } from 'xrpl';
import type { Payment } from 'xrpl';
import type { SovereignXrplConnectionManager } from './connection-manager';
import type { AnchorSubmission, AnchorReceipt } from './types';

// ─── Anchor Engine ─────────────────────────────────────────────────────────────

export class XrplAnchorEngine {
  private connectionManager: SovereignXrplConnectionManager;
  private wallet: Wallet | null = null;
  private anchorHistory: AnchorReceipt[] = [];

  constructor(connectionManager: SovereignXrplConnectionManager) {
    this.connectionManager = connectionManager;
  }

  /**
   * Initialize with a funded wallet.
   * In testnet: use Wallet.generate() + faucet
   * In production: use an HSM-managed key
   */
  async initialize(seed?: string): Promise<string> {
    if (seed) {
      this.wallet = Wallet.fromSeed(seed);
    } else {
      // Testnet: fund from faucet
      const client = await this.connectionManager.getClient();
      const fundResult = await client.fundWallet();
      this.wallet = fundResult.wallet;
      console.error(`[ANCHOR] Funded testnet wallet: ${this.wallet.address}`);
      console.error(`[ANCHOR] Balance: ${fundResult.balance} XRP`);
    }

    return this.wallet.address;
  }

  /**
   * Anchor a data hash to XRPL.
   *
   * Creates a self-payment (0 XRP value) with memo fields containing:
   *   - MemoType: "sovereign/anchor"
   *   - MemoData: the data hash
   *   - Memo: human-readable context
   */
  async anchor(submission: AnchorSubmission): Promise<AnchorReceipt> {
    if (!this.wallet) {
      throw new Error('[ANCHOR] Engine not initialized — call initialize() first');
    }

    const client = await this.connectionManager.getClient();

    // Convert strings to hex for XRPL memo fields
    const memoType = Buffer.from('sovereign/anchor', 'utf-8').toString('hex').toUpperCase();
    const memoData = submission.dataHash.toUpperCase();
    const memoText = Buffer.from(
      submission.memo || `SOVEREIGN_ANCHOR:${new Date().toISOString()}`,
      'utf-8',
    ).toString('hex').toUpperCase();

    // Build self-payment with memo (zero value transfer to self)
    const payment: Payment = {
      TransactionType: 'Payment',
      Account: this.wallet.address,
      Amount: xrpToDrops('0.000001'), // minimum amount — dust
      Destination: this.wallet.address,
      Memos: [
        {
          Memo: {
            MemoType: memoType,
            MemoData: memoData,
          },
        },
      ],
    };

    // Submit and wait for validation
    const prepared = await client.autofill(payment);
    const signed = this.wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    const receipt: AnchorReceipt = {
      txHash: typeof result.result.hash === 'string' ? result.result.hash : signed.hash,
      ledgerIndex: typeof result.result.ledger_index === 'number' ? result.result.ledger_index : 0,
      dataHash: submission.dataHash,
      timestamp: new Date().toISOString(),
      verified: result.result.meta !== undefined &&
        typeof result.result.meta === 'object' &&
        'TransactionResult' in result.result.meta &&
        result.result.meta.TransactionResult === 'tesSUCCESS',
    };

    this.anchorHistory.push(receipt);

    console.error(
      `[ANCHOR] Hash anchored: ${submission.dataHash.substring(0, 16)}... → tx:${receipt.txHash.substring(0, 16)}... @ ledger ${receipt.ledgerIndex}`,
    );

    return receipt;
  }

  /**
   * Verify an anchor exists on-chain.
   * Fetches the transaction and confirms the memo contains the data hash.
   */
  async verify(txHash: string, expectedDataHash: string): Promise<boolean> {
    try {
      const client = await this.connectionManager.getClient();
      const tx = await client.request({
        command: 'tx',
        transaction: txHash,
      });

      // Check memos for our data hash
      const memos = (tx.result as any).Memos;
      if (!Array.isArray(memos)) return false;

      for (const memo of memos) {
        const memoData = memo.Memo?.MemoData;
        if (memoData && memoData.toUpperCase() === expectedDataHash.toUpperCase()) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get the full anchor history for this session.
   */
  getHistory(): AnchorReceipt[] {
    return [...this.anchorHistory];
  }

  /**
   * Get wallet address (for monitoring).
   */
  getWalletAddress(): string | null {
    return this.wallet?.address ?? null;
  }
}
