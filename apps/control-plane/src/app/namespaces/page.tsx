/**
 * Namespace Manager — Sovereign Control Plane
 */

import { NAMESPACE_TLDS, SubnameRecordType } from '@sovereign/identity';

const REGISTERED_NAMESPACES = [
  { name: 'vaughan', tld: '.capital', owner: 'rHb9CJ...4ksK', nftTokenId: '000800...A1B2', status: 'VERIFIED', subnames: 4, registered: '2025-08-01', expires: '2028-08-01' },
  { name: 'mog', tld: '.money', owner: 'rHb9CJ...4ksK', nftTokenId: '000800...C3D4', status: 'VERIFIED', subnames: 3, registered: '2025-07-15', expires: '2028-07-15' },
  { name: 'fth', tld: '.vault', owner: 'rHb9CJ...4ksK', nftTokenId: '000800...E5F6', status: 'VERIFIED', subnames: 2, registered: '2025-09-01', expires: '2028-09-01' },
  { name: 'settle', tld: '.settlement', owner: 'rHb9CJ...4ksK', nftTokenId: '000800...G7H8', status: 'PENDING', subnames: 0, registered: '2026-02-20', expires: '2029-02-20' },
];

const SUBNAMES = [
  { fullName: 'treasury.vaughan.capital', type: SubnameRecordType.WALLET, address: 'rPT1A...x9Q2', parent: 'vaughan.capital' },
  { fullName: 'escrow.vaughan.capital', type: SubnameRecordType.ESCROW, address: 'rEsc7...b3M1', parent: 'vaughan.capital' },
  { fullName: 'api.vaughan.capital', type: SubnameRecordType.SERVICE, address: 'rApi2...k8N5', parent: 'vaughan.capital' },
  { fullName: 'kevan.vaughan.capital', type: SubnameRecordType.IDENTITY, address: 'rKev9...m4P7', parent: 'vaughan.capital' },
  { fullName: 'donations.mog.money', type: SubnameRecordType.WALLET, address: 'rDon3...x1A8', parent: 'mog.money' },
  { fullName: 'cases.mog.money', type: SubnameRecordType.SERVICE, address: 'rCas5...y2B9', parent: 'mog.money' },
  { fullName: 'aid.mog.money', type: SubnameRecordType.WALLET, address: 'rAid7...z3C0', parent: 'mog.money' },
  { fullName: 'reserve.fth.vault', type: SubnameRecordType.SETTLEMENT, address: 'rRes4...w4D1', parent: 'fth.vault' },
  { fullName: 'cold.fth.vault', type: SubnameRecordType.WALLET, address: 'rCol6...v5E2', parent: 'fth.vault' },
];

export default function NamespacesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-sovereign-50">Namespaces</h1>
        <p className="mt-1 text-sm text-sovereign-400">
          XRPL-native namespace NFT registry — {NAMESPACE_TLDS.join(' · ')}
        </p>
      </div>

      {/* TLD Overview */}
      <div className="grid grid-cols-4 gap-4">
        {NAMESPACE_TLDS.map((tld) => {
          const count = REGISTERED_NAMESPACES.filter(n => n.tld === tld).length;
          return (
            <div key={tld} className="card text-center">
              <div className="font-mono text-lg font-bold text-gold-400">{tld}</div>
              <div className="mt-2 font-mono text-2xl font-bold text-sovereign-100">{count}</div>
              <div className="text-xs text-sovereign-500">registered</div>
            </div>
          );
        })}
      </div>

      {/* Registered Namespaces */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sovereign-100">Registered Namespaces</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Owner</th>
                <th className="table-header">NFT Token</th>
                <th className="table-header">Status</th>
                <th className="table-header">Subnames</th>
                <th className="table-header">Registered</th>
                <th className="table-header">Expires</th>
              </tr>
            </thead>
            <tbody>
              {REGISTERED_NAMESPACES.map((ns) => (
                <tr key={ns.name + ns.tld} className="hover:bg-sovereign-800/30">
                  <td className="table-cell">
                    <span className="font-mono font-bold text-gold-400">{ns.name}{ns.tld}</span>
                  </td>
                  <td className="table-cell font-mono text-xs">{ns.owner}</td>
                  <td className="table-cell font-mono text-xs text-sovereign-400">{ns.nftTokenId}</td>
                  <td className="table-cell">
                    <span className={ns.status === 'VERIFIED' ? 'badge-green' : 'badge-amber'}>{ns.status}</span>
                  </td>
                  <td className="table-cell text-center font-mono">{ns.subnames}</td>
                  <td className="table-cell text-xs text-sovereign-400">{ns.registered}</td>
                  <td className="table-cell text-xs text-sovereign-400">{ns.expires}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subname Resolution */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sovereign-100">Subname Registry</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Full Name</th>
                <th className="table-header">Type</th>
                <th className="table-header">Resolved Address</th>
                <th className="table-header">Parent</th>
              </tr>
            </thead>
            <tbody>
              {SUBNAMES.map((sub) => (
                <tr key={sub.fullName} className="hover:bg-sovereign-800/30">
                  <td className="table-cell font-mono text-sm text-sovereign-100">{sub.fullName}</td>
                  <td className="table-cell">
                    <span className="badge-blue">{sub.type}</span>
                  </td>
                  <td className="table-cell font-mono text-xs text-sovereign-300">{sub.address}</td>
                  <td className="table-cell font-mono text-xs text-sovereign-400">{sub.parent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
