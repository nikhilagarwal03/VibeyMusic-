export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureFlagCreateInput {
  key: string;
  enabled: boolean;
  description?: string;
}

export interface FeatureFlagUpdateInput {
  enabled?: boolean;
  description?: string;
}
