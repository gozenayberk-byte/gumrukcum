export type SubscriptionTier = 'free' | 'entrepreneur' | 'professional' | 'corporate';

export interface UserProfile {
  id: string;
  email: string;
  credits: number;
  subscription_tier: SubscriptionTier;
}

export interface TaxInfo {
  name: string;
  rate: string;
  description: string;
}

export interface MarketData {
  fobPrice?: string;
  trSalesPrice?: string;
  emailDraft?: string;
}

export interface AIAnalysisResult {
  gtip: string;
  productName: string;
  taxes: TaxInfo[];
  documents: string[];
  riskAnalysis: string;
  marketData?: MarketData;
}

export interface QueryHistory {
  id: string;
  created_at: string;
  user_prompt: string;
  ai_response: AIAnalysisResult;
}
