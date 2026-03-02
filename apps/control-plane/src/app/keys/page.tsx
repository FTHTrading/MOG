/**
 * Key Authority Dashboard — Sovereign Control Plane
 *
 * Unified view of all signing infrastructure:
 * - HSM status (SoftHSM / AWS CloudHSM / Azure Key Vault)
 * - Fireblocks MPC signers (3-of-5 quorum)
 * - Key rotation schedule
 * - Emergency freeze controls
 */

import { KeyPurpose, KeyStatus, HsmProviderType, FireblocksVaultRole } from '@sovereign/identity';

const HSM_KEYS = [
  { keyId: 'hsm-001', purpose: KeyPurpose.ISSUER_SIGNING, status: KeyStatus.ACTIVE, provider: HsmProviderType.AWS_CLOUD_HSM, algo: 'ECDSA-P256', rotatedAt: '2026-01-15', expiresAt: '2027-01-15', version: 3 },
  { keyId: 'hsm-002', purpose: KeyPurpose.TREASURY_SIGNING, status: KeyStatus.ACTIVE, provider: HsmProviderType.AWS_CLOUD_HSM, algo: 'ECDSA-P256', rotatedAt: '2026-02-01', expiresAt: '2027-02-01', version: 2 },
  { keyId: 'hsm-003', purpose: KeyPurpose.AUDIT_SIGNING, status: KeyStatus.ACTIVE, provider: HsmProviderType.AWS_CLOUD_HSM, algo: 'EdDSA', rotatedAt: '2025-12-01', expiresAt: '2026-12-01', version: 5 },
  { keyId: 'hsm-004', purpose: KeyPurpose.CLIENT_SEED_ENCRYPTION, status: KeyStatus.ACTIVE, provider: HsmProviderType.AZURE_KEY_VAULT, algo: 'AES-256-GCM', rotatedAt: '2026-01-20', expiresAt: '2027-01-20', version: 2 },
  { keyId: 'hsm-005', purpose: KeyPurpose.WEBHOOK_SIGNING, status: KeyStatus.ACTIVE, provider: HsmProviderType.SOFT_HSM, algo: 'HMAC-SHA256', rotatedAt: '2026-02-15', expiresAt: '2027-02-15', version: 1 },
  { keyId: 'hsm-006', purpose: KeyPurpose.SETTLEMENT_SIGNING, status: KeyStatus.ROTATING, provider: HsmProviderType.AWS_CLOUD_HSM, algo: 'ECDSA-P256', rotatedAt: '2026-03-01', expiresAt: '2027-03-01', version: 4 },
  { keyId: 'hsm-007', purpose: KeyPurpose.ANCHOR_SIGNING, status: KeyStatus.ACTIVE, provider: HsmProviderType.AWS_CLOUD_HSM, algo: 'EdDSA', rotatedAt: '2026-02-10', expiresAt: '2027-02-10', version: 1 },
];

const MPC_SIGNERS = [
  { id: 'signer-1', name: 'Guardian Alpha', online: true, lastSigned: '2 hrs ago' },
  { id: 'signer-2', name: 'Guardian Beta', online: true, lastSigned: '4 hrs ago' },
  { id: 'signer-3', name: 'Guardian Gamma', online: true, lastSigned: '1 day ago' },
  { id: 'signer-4', name: 'Guardian Delta', online: false, lastSigned: '3 days ago' },
  { id: 'signer-5', name: 'Guardian Epsilon', online: true, lastSigned: '12 hrs ago' },
];

const FIREBLOCKS_VAULTS = [
  { role: FireblocksVaultRole.TREASURY, balance: '$8,200,000', txToday: 3 },
  { role: FireblocksVaultRole.OMNIBUS, balance: '$4,100,000', txToday: 12 },
  { role: FireblocksVaultRole.RESERVE, balance: '$12,600,000', txToday: 0 },
  { role: FireblocksVaultRole.ESCROW, balance: '$3,200,000', txToday: 2 },
  { role: FireblocksVaultRole.SETTLEMENT, balance: '$890,000', txToday: 7 },
  { role: FireblocksVaultRole.COLD_STORAGE, balance: '$25,000,000', txToday: 0 },
];

export default function KeyAuthorityPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sovereign-50">Key Authority</h1>
          <p className="mt-1 text-sm text-sovereign-400">
            HSM + Fireblocks MPC — Unified signing infrastructure
          </p>
        </div>
        <button className="rounded border border-accent-red/50 bg-accent-red/10 px-4 py-2 text-sm font-medium text-accent-red hover:bg-accent-red/20">
          Emergency Freeze
        </button>
      </div>

      {/* MPC Quorum */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sovereign-100">Fireblocks MPC Quorum — 3 of 5</h3>
          <span className="badge-green">{MPC_SIGNERS.filter(s => s.online).length}/5 Online</span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {MPC_SIGNERS.map((signer) => (
            <div
              key={signer.id}
              className={`rounded border p-3 text-center ${
                signer.online
                  ? 'border-accent-green/30 bg-accent-green/5'
                  : 'border-sovereign-700/30 bg-sovereign-900/30'
              }`}
            >
              <div className={`mx-auto h-3 w-3 rounded-full ${signer.online ? 'bg-accent-green' : 'bg-sovereign-600'}`} />
              <div className="mt-2 text-sm font-medium text-sovereign-200">{signer.name}</div>
              <div className="mt-1 text-xs text-sovereign-500">{signer.lastSigned}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Fireblocks Vaults */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sovereign-100">Fireblocks Vault Accounts</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {FIREBLOCKS_VAULTS.map((vault) => (
            <div key={vault.role} className="rounded border border-sovereign-800/50 p-4">
              <div className="text-xs font-medium uppercase tracking-wider text-sovereign-400">{vault.role}</div>
              <div className="mt-2 font-mono text-xl font-bold text-sovereign-100">{vault.balance}</div>
              <div className="mt-1 text-xs text-sovereign-500">{vault.txToday} tx today</div>
            </div>
          ))}
        </div>
      </div>

      {/* HSM Keys */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sovereign-100">HSM Key Inventory</h3>
          <span className="font-mono text-xs text-sovereign-500">{HSM_KEYS.length} keys</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Key ID</th>
                <th className="table-header">Purpose</th>
                <th className="table-header">Status</th>
                <th className="table-header">Provider</th>
                <th className="table-header">Algorithm</th>
                <th className="table-header">Version</th>
                <th className="table-header">Rotated</th>
                <th className="table-header">Expires</th>
              </tr>
            </thead>
            <tbody>
              {HSM_KEYS.map((key) => (
                <tr key={key.keyId} className="hover:bg-sovereign-800/30">
                  <td className="table-cell font-mono text-xs">{key.keyId}</td>
                  <td className="table-cell text-sm">{key.purpose}</td>
                  <td className="table-cell">
                    <span className={key.status === KeyStatus.ACTIVE ? 'badge-green' : 'badge-amber'}>
                      {key.status}
                    </span>
                  </td>
                  <td className="table-cell text-xs">{key.provider}</td>
                  <td className="table-cell font-mono text-xs">{key.algo}</td>
                  <td className="table-cell text-center">v{key.version}</td>
                  <td className="table-cell text-xs text-sovereign-400">{key.rotatedAt}</td>
                  <td className="table-cell text-xs text-sovereign-400">{key.expiresAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
