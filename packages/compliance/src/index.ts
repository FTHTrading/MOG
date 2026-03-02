/**
 * @sovereign/compliance — Unified Compliance Gate
 *
 * MERGED FROM:
 *   fth-institutional-core/packages/compliance-engine/ (YAML rule engine, 28+ rule sets)
 *   fth-capital-os/helios-marketing-compliance-engine/ (Howey analysis, marketing)
 *   fth-capital-os/core/guardrails.ts (operational guardrails)
 *   circle-superapp/src/lib/desk/desk-compliance.ts (desk compliance)
 *
 * RULE: Every product launch, transaction, and marketing action goes through this gate.
 */

import type { SovereignIdentity, ModuleCategory } from '@sovereign/identity';

// ─── Rule Engine ───────────────────────────────────────────────────────────────

export enum RuleCategory {
  // Financial
  AML_KYC = 'AML_KYC',
  SECURITIES = 'SECURITIES',
  HOWEY = 'HOWEY',
  ACCREDITATION = 'ACCREDITATION',

  // Privacy
  GDPR = 'GDPR',
  CCPA = 'CCPA',
  FERPA = 'FERPA',

  // Industry
  TITLE_IV = 'TITLE_IV',
  TITLE_IX = 'TITLE_IX',
  EU_AI_ACT = 'EU_AI_ACT',

  // Marketing
  MARKETING_COMPLIANCE = 'MARKETING_COMPLIANCE',
  ADVERTISING = 'ADVERTISING',

  // Jurisdiction
  US_FEDERAL = 'US_FEDERAL',
  US_STATE = 'US_STATE',
  DOMINICAN_REPUBLIC = 'DOMINICAN_REPUBLIC',
  EU = 'EU',
  UK = 'UK',

  // Operational
  GUARDRAILS = 'GUARDRAILS',
  NIL = 'NIL',
}

export interface ComplianceRule {
  id: string;
  name: string;
  category: RuleCategory;
  version: string;
  description: string;
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
  jurisdictions: string[];
  conditions: RuleCondition[];
  actions: RuleAction[];
  isActive: boolean;
}

export interface RuleCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in' | 'contains' | 'matches';
  value: unknown;
}

export interface RuleAction {
  type: 'BLOCK' | 'WARN' | 'REQUIRE_DISCLOSURE' | 'REQUIRE_APPROVAL' | 'LOG' | 'REWRITE';
  message: string;
  metadata?: Record<string, unknown>;
}

// ─── Compliance Verdict ────────────────────────────────────────────────────────

export interface ComplianceVerdict {
  allowed: boolean;
  ruleResults: RuleResult[];
  requiredDisclosures: string[];
  blockingViolations: RuleViolation[];
  warnings: RuleWarning[];
  requiredApprovals: string[];
  auditHash: string;
  evaluatedAt: string;
  evaluatedBy: string; // module or agent
}

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  passed: boolean;
  message: string;
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
}

export interface RuleViolation {
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  message: string;
  remediationSteps: string[];
}

export interface RuleWarning {
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  message: string;
}

// ─── Howey Analysis (Securities Compliance) ────────────────────────────────────

export interface HoweyAnalysis {
  isSecurityLikely: boolean;
  investmentOfMoney: HoweyProng;
  commonEnterprise: HoweyProng;
  expectationOfProfits: HoweyProng;
  fromEffortsOfOthers: HoweyProng;
  overallScore: number; // 0-1
  recommendation: string;
  requiredDisclosures: string[];
}

export interface HoweyProng {
  name: string;
  triggered: boolean;
  confidence: number;
  evidence: string[];
  mitigatingFactors: string[];
}

// ─── Marketing Compliance ──────────────────────────────────────────────────────

export interface MarketingContent {
  id: string;
  type: 'WEBPAGE' | 'EMAIL' | 'SOCIAL_MEDIA' | 'DOCUMENT' | 'ADVERTISEMENT';
  title: string;
  body: string;
  audience: string;
  jurisdiction: string;
  claims: string[];
}

export interface MarketingComplianceResult {
  verdict: ComplianceVerdict;
  howeyAnalysis?: HoweyAnalysis;
  claimAnalysis: ClaimAnalysis[];
  suggestedRewrites?: string[];
}

export interface ClaimAnalysis {
  claim: string;
  type: 'PERFORMANCE' | 'GUARANTEE' | 'SAFETY' | 'RETURN' | 'RISK' | 'FACTUAL';
  compliant: boolean;
  issue?: string;
  suggestedRewrite?: string;
}

// ─── Compliance Gate Interface ─────────────────────────────────────────────────

export interface ComplianceGate {
  /** Gate: evaluate a product configuration before launch */
  evaluateProduct(product: ProductComplianceInput): Promise<ComplianceVerdict>;

  /** Gate: evaluate a transaction before execution */
  evaluateTransaction(tx: TransactionComplianceInput): Promise<ComplianceVerdict>;

  /** Gate: evaluate marketing content */
  evaluateContent(content: MarketingContent): Promise<MarketingComplianceResult>;

  /** Gate: evaluate identity for KYC/AML */
  evaluateIdentity(identity: SovereignIdentity): Promise<ComplianceVerdict>;

  /** Check jurisdiction for a specific action */
  checkJurisdiction(action: string, jurisdiction: string): Promise<ComplianceVerdict>;

  /** Howey test for securities analysis */
  analyzeHowey(params: HoweyInput): Promise<HoweyAnalysis>;

  /** Load/reload YAML rule sets */
  loadRules(rules: ComplianceRule[]): Promise<void>;

  /** Get all active rules for a category */
  getRules(category?: RuleCategory): Promise<ComplianceRule[]>;

  /** Get compliance summary/dashboard data */
  getSummary(): Promise<ComplianceSummary>;
}

export interface ProductComplianceInput {
  productId: string;
  productType: string;
  jurisdiction: string;
  targetAudience: string;
  claims: string[];
  terms: Record<string, unknown>;
}

export interface TransactionComplianceInput {
  transactionType: string;
  amount: string;
  currency: string;
  sourceIdentity: SovereignIdentity;
  destinationIdentity?: SovereignIdentity;
  jurisdiction: string;
  metadata?: Record<string, unknown>;
}

export interface HoweyInput {
  productDescription: string;
  investmentStructure: string;
  profitMechanism: string;
  managerRole: string;
  investorRights: string[];
}

export interface ComplianceSummary {
  totalRules: number;
  activeRules: number;
  evaluationsToday: number;
  passRate: number;
  blockingViolationsToday: number;
  warningsToday: number;
  rulesByCategory: Record<RuleCategory, number>;
  lastUpdated: string;
}
