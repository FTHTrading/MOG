/**
 * @sovereign/products — Declarative Product Factory
 *
 * MERGED FROM:
 *   fth-institutional-core/fth-platform/bond/ (bond lifecycle)
 *   fth-institutional-core/fth-platform/collateral/ (collateral lifecycle)
 *   fth-institutional-core/fth-platform/equity-runtime/ (equity tokens, cap table)
 *   circle-superapp/src/lib/factory/ (product config, pricing, scoring)
 *   circle-superapp/src/lib/desk/ (allocation gateway, revenue engine)
 *   mogos/structuring/ (SPV, bonds, facilities, cat bonds)
 *   mogos/rwa/ (carbon, natural capital, collateral lockbox)
 *
 * Products are CONFIG — not code. Runtime reads config, compliance-gates it,
 * then routes to the ledger.
 */

import type { SupportedChain, TokenType, Stablecoin } from '@sovereign/identity';
import type { BondState, CollateralState } from '@sovereign/ledger';

// ─── Product Types ─────────────────────────────────────────────────────────────

export enum ProductType {
  STABLECOIN = 'STABLECOIN',
  BOND = 'BOND',
  FUND = 'FUND',
  RWA = 'RWA',
  SPV = 'SPV',
  EQUITY = 'EQUITY',
  CARBON_CREDIT = 'CARBON_CREDIT',
  CAT_BOND = 'CAT_BOND',
  FACILITY = 'FACILITY',
}

// ─── Product Config (the universal schema) ─────────────────────────────────────

export interface ProductConfig {
  id: string;
  type: ProductType;
  name: string;
  version: string;

  // Chain
  chain: SupportedChain;
  currency: TokenType | Stablecoin | string;

  // Authority
  mintAuthority: string; // KeyPurpose reference
  complianceProfile: string; // RuleCategory reference

  // Lifecycle
  lifecycle: LifecycleConfig;

  // Pricing
  pricing: PricingConfig;

  // Guardrails
  guardrails: ProductGuardrails;

  // Risk
  riskProfile: RiskProfile;

  // Metadata
  jurisdiction: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────────

export interface LifecycleConfig {
  states: string[];
  initialState: string;
  terminalStates: string[];
  transitions: StateTransition[];
}

export interface StateTransition {
  from: string;
  to: string;
  requiredPermission: string;
  requiresCompliance: boolean;
  requiresApproval: boolean;
  approvalThreshold?: number; // number of approvers
}

// ─── Pricing ───────────────────────────────────────────────────────────────────

export interface PricingConfig {
  model: 'FIXED' | 'NAV' | 'MARKET' | 'DETERMINISTIC' | 'AMORTIZED';
  basePrice?: string;
  currency: string;
  feeSchedule: FeeSchedule;
  interestRate?: string;
  couponFrequency?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
}

export interface FeeSchedule {
  managementFee: string; // basis points
  performanceFee: string;
  entryFee: string;
  exitFee: string;
  custodyFee: string;
}

// ─── Guardrails ────────────────────────────────────────────────────────────────

export interface ProductGuardrails {
  dailyMintCap?: string;
  minimumInvestment?: string;
  maximumInvestment?: string;
  requireReserveValidation: boolean;
  requireKycLevel: number;
  requireAccreditation: boolean;
  concentrationLimit?: string; // max % per investor
  lockupPeriodDays?: number;
}

// ─── Risk ──────────────────────────────────────────────────────────────────────

export interface RiskProfile {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'SPECULATIVE';
  riskFactors: string[];
  stressScenarios: StressScenario[];
  collateralRequired: boolean;
  collateralRatio?: string;
}

export interface StressScenario {
  name: string;
  type: 'MARKET_CRASH' | 'LIQUIDITY_CRISIS' | 'COUNTERPARTY_DEFAULT' | 'REGULATORY_CHANGE' | 'CHAIN_OUTAGE' | 'COLLATERAL_DEPRECIATION';
  severity: number; // 0-1
  expectedImpact: string;
}

// ─── Bond Product ──────────────────────────────────────────────────────────────

export interface BondProduct extends ProductConfig {
  type: ProductType.BOND;
  bondDetails: {
    seriesId: string;
    maturityDate: string;
    couponRate: string;
    couponFrequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
    faceValue: string;
    totalIssuance: string;
    subscribedAmount: string;
    currentState: BondState;
  };
}

// ─── Fund Product ──────────────────────────────────────────────────────────────

export interface FundProduct extends ProductConfig {
  type: ProductType.FUND;
  fundDetails: {
    nav: string;
    totalAum: string;
    strategies: StrategyAllocation[];
    performanceHistory: PerformancePoint[];
    redemptionFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
    redemptionNoticeDays: number;
  };
}

export interface StrategyAllocation {
  strategyId: string;
  name: string;
  allocationPercent: string;
  currentValue: string;
}

export interface PerformancePoint {
  date: string;
  nav: string;
  returnPercent: string;
}

// ─── RWA Product ───────────────────────────────────────────────────────────────

export interface RwaProduct extends ProductConfig {
  type: ProductType.RWA;
  rwaDetails: {
    assetType: 'REAL_ESTATE' | 'CARBON_CREDIT' | 'NATURAL_CAPITAL' | 'COMMODITY' | 'RECEIVABLE' | 'INFRASTRUCTURE';
    valuationMethod: string;
    lastValuation: string;
    lastValuationDate: string;
    collateralState: CollateralState;
    custodian: string;
    legalEntity: string;
    verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'EXPIRED';
  };
}

// ─── SPV Product ───────────────────────────────────────────────────────────────

export interface SpvProduct extends ProductConfig {
  type: ProductType.SPV;
  spvDetails: {
    entityName: string;
    jurisdiction: string;
    purpose: string;
    sponsor: string;
    underlyingAssets: string[];
    trancheStructure: Tranche[];
  };
}

export interface Tranche {
  name: string;
  seniority: 'SENIOR' | 'MEZZANINE' | 'EQUITY';
  size: string;
  couponRate: string;
  riskRating: string;
}

// ─── Product Factory Interface ─────────────────────────────────────────────────

export interface ProductFactory {
  /** Create a product from config (compliance-gated) */
  create(config: ProductConfig): Promise<ProductConfig>;

  /** Get product by ID */
  get(productId: string): Promise<ProductConfig | null>;

  /** List all products */
  list(filters?: ProductFilters): Promise<ProductConfig[]>;

  /** Update product config (compliance-gated) */
  update(productId: string, updates: Partial<ProductConfig>): Promise<ProductConfig>;

  /** Transition product lifecycle state */
  transition(productId: string, toState: string, approvedBy: string): Promise<ProductConfig>;

  /** Deactivate a product */
  deactivate(productId: string, reason: string): Promise<void>;

  /** Get product dashboard metrics */
  getMetrics(productId: string): Promise<ProductMetrics>;
}

export interface ProductFilters {
  type?: ProductType;
  chain?: SupportedChain;
  isActive?: boolean;
  jurisdiction?: string;
}

export interface ProductMetrics {
  productId: string;
  totalMinted: string;
  totalBurned: string;
  outstanding: string;
  investorCount: number;
  averageInvestment: string;
  dailyVolume: string;
  lastActivity: string;
}
