export interface SystemSetting {
  key: string;
  value: string | number | boolean | null;
  description?: string;
  updatedAt: Date;
  updatedBy: string;
}

export interface SystemSettingUpsertInput {
  key: string;
  value: string | number | boolean | null;
  description?: string;
  updatedBy: string;
}
