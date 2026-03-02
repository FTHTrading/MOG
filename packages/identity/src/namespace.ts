/**
 * @sovereign/identity — Namespace Registry
 *
 * MERGED FROM:
 *   circle-superapp/src/lib/namespace/ (XRPL-native NFT namespace system)
 *
 * Sovereign TLD registry: .money, .capital, .vault, .settlement
 * Each namespace is an XRPL NFT with subname resolution.
 */

// ─── Namespace TLDs ────────────────────────────────────────────────────────────

export const NAMESPACE_TLDS = ['.money', '.capital', '.vault', '.settlement'] as const;
export type NamespaceTLD = typeof NAMESPACE_TLDS[number];

// ─── Namespace Root ────────────────────────────────────────────────────────────

export interface NamespaceRoot {
  id: string;
  tld: NamespaceTLD;
  owner: string; // XRPL address
  nftTokenId: string;
  registeredAt: string;
  expiresAt: string;
  isActive: boolean;
  metadata: NamespaceMetadata;
}

export interface NamespaceMetadata {
  displayName?: string;
  description?: string;
  avatar?: string;
  website?: string;
  xrplAddress: string;
  linkedDid?: string;
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED';
}

// ─── Subname Entry ─────────────────────────────────────────────────────────────

export interface SubnameEntry {
  id: string;
  parentId: string; // NamespaceRoot id
  subname: string; // e.g., "treasury" in "treasury.vaughan.capital"
  fullName: string; // e.g., "treasury.vaughan.capital"
  resolvedAddress: string; // XRPL address
  recordType: SubnameRecordType;
  ttl: number;
  createdAt: string;
  updatedAt: string;
}

export enum SubnameRecordType {
  WALLET = 'WALLET',
  SERVICE = 'SERVICE',
  IDENTITY = 'IDENTITY',
  SETTLEMENT = 'SETTLEMENT',
  ESCROW = 'ESCROW',
}

// ─── Namespace Registry Interface ──────────────────────────────────────────────

export interface NamespaceRegistry {
  register(params: NamespaceRegistration): Promise<NamespaceRoot>;
  resolve(fullName: string): Promise<ResolvedNamespace | null>;
  addSubname(rootId: string, params: SubnameRegistration): Promise<SubnameEntry>;
  removeSubname(rootId: string, subname: string): Promise<void>;
  transfer(rootId: string, newOwner: string): Promise<NamespaceRoot>;
  renew(rootId: string, years: number): Promise<NamespaceRoot>;
  listByOwner(ownerAddress: string): Promise<NamespaceRoot[]>;
}

export interface NamespaceRegistration {
  name: string;
  tld: NamespaceTLD;
  ownerAddress: string;
  years: number;
  metadata?: Partial<NamespaceMetadata>;
}

export interface SubnameRegistration {
  subname: string;
  resolvedAddress: string;
  recordType: SubnameRecordType;
  ttl?: number;
}

export interface ResolvedNamespace {
  root: NamespaceRoot;
  subname?: SubnameEntry;
  resolvedAddress: string;
  chain: 'xrpl';
}
