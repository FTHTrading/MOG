/**
 * @sovereign/identity — Key Authority Service
 *
 * MERGED FROM:
 *   fth-capital-os/core/hsm-manager.ts (826 LOC — HSM abstraction, SoftHSM/AWS/Azure)
 *   fth-institutional-core Fireblocks MPC (3-of-5 multisig, 12 vault roles)
 *
 * RULE: No private keys in application memory.
 *       All signing goes through this service.
 */

import { FireblocksVaultRole } from './types';

// ─── Key Purpose ───────────────────────────────────────────────────────────────

export enum KeyPurpose {
  ISSUER_SIGNING = 'ISSUER_SIGNING',
  TREASURY_SIGNING = 'TREASURY_SIGNING',
  CLIENT_SEED_ENCRYPTION = 'CLIENT_SEED_ENCRYPTION',
  AUDIT_SIGNING = 'AUDIT_SIGNING',
  WEBHOOK_SIGNING = 'WEBHOOK_SIGNING',
  SETTLEMENT_SIGNING = 'SETTLEMENT_SIGNING',
  ANCHOR_SIGNING = 'ANCHOR_SIGNING',
}

export enum KeyStatus {
  ACTIVE = 'ACTIVE',
  ROTATING = 'ROTATING',
  RETIRED = 'RETIRED',
  COMPROMISED = 'COMPROMISED',
}

export enum HsmProviderType {
  SOFT_HSM = 'SOFT_HSM',
  AWS_CLOUD_HSM = 'AWS_CLOUD_HSM',
  AZURE_KEY_VAULT = 'AZURE_KEY_VAULT',
}

// ─── Key Metadata ──────────────────────────────────────────────────────────────

export interface KeyMetadata {
  keyId: string;
  purpose: KeyPurpose;
  status: KeyStatus;
  provider: HsmProviderType;
  algorithm: string;
  publicKey: string;
  createdAt: string;
  rotatedAt?: string;
  expiresAt?: string;
  version: number;
}

// ─── MPC Config (Fireblocks) ───────────────────────────────────────────────────

export interface MpcConfig {
  provider: 'FIREBLOCKS';
  vaultAccountId: string;
  vaultRole: FireblocksVaultRole;
  threshold: number; // e.g. 3
  totalSigners: number; // e.g. 5
  signerIds: string[];
}

// ─── Encrypted Payload ─────────────────────────────────────────────────────────

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  tag: string;
  keyId: string;
  algorithm: string;
  encryptedAt: string;
}

// ─── Key Authority Service Interface ───────────────────────────────────────────

export interface KeyAuthorityService {
  /**
   * Sign data using the specified key purpose. Never returns the private key.
   */
  sign(purpose: KeyPurpose, data: Buffer): Promise<SignResult>;

  /**
   * Verify a signature against the public key for the given purpose.
   */
  verify(purpose: KeyPurpose, data: Buffer, signature: string): Promise<boolean>;

  /**
   * Encrypt data using the specified key purpose.
   */
  encrypt(purpose: KeyPurpose, plaintext: Buffer): Promise<EncryptedPayload>;

  /**
   * Decrypt an encrypted payload.
   */
  decrypt(purpose: KeyPurpose, payload: EncryptedPayload): Promise<Buffer>;

  /**
   * Rotate a key. Returns the new key metadata.
   */
  rotateKey(purpose: KeyPurpose): Promise<KeyMetadata>;

  /**
   * Get metadata for all keys of a given purpose.
   */
  getKeyMetadata(purpose: KeyPurpose): Promise<KeyMetadata[]>;

  /**
   * Get HSM attestation report for regulatory compliance.
   */
  getAttestation(purpose: KeyPurpose): Promise<HsmAttestation>;

  /**
   * MPC: Initiate a multi-party signing ceremony.
   */
  initiateMpcSigning(
    config: MpcConfig,
    data: Buffer
  ): Promise<MpcSigningCeremony>;

  /**
   * Emergency: Freeze all signing operations.
   */
  emergencyFreeze(): Promise<void>;

  /**
   * Emergency: Unfreeze signing with guardian quorum.
   */
  emergencyUnfreeze(guardianSignatures: string[]): Promise<void>;
}

export interface SignResult {
  signature: string;
  keyId: string;
  algorithm: string;
  timestamp: string;
}

export interface HsmAttestation {
  provider: HsmProviderType;
  keyId: string;
  attestationReport: string;
  validUntil: string;
  fipsLevel: string;
}

export interface MpcSigningCeremony {
  ceremonyId: string;
  status: 'PENDING' | 'COLLECTING' | 'THRESHOLD_MET' | 'SIGNED' | 'FAILED';
  requiredSignatures: number;
  collectedSignatures: number;
  signers: { signerId: string; signed: boolean }[];
  result?: SignResult;
}
