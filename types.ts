
export enum DatasetType {
  STUDENT = 'STUDENT',
  SCHOOL_FEES = 'SCHOOL_FEES',
  REPORT_CARD = 'REPORT_CARD',
  ATTENDANCE = 'ATTENDANCE',
  COMPANY = 'COMPANY',
  PAYROLL = 'PAYROLL',
  SALES = 'SALES',
  INVENTORY = 'INVENTORY',
  HOSPITAL = 'HOSPITAL',
  BANKING = 'BANKING',
  CUSTOM = 'CUSTOM'
}

export enum DifficultyLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

export interface MessyConfig {
  missingPct: number;
  duplicatePct: number;
  extraSpaces: boolean;
  mixedCasing: boolean;
  wrongTypes: boolean;
  invalidFormats: boolean;
}

export interface ColumnDefinition {
  name: string;
  type: 'string' | 'number' | 'date' | 'currency' | 'email' | 'city' | 'boolean' | 'subject_mark' | 'category';
  description?: string;
  range?: { min: number; max: number };
  options?: string[];
}

export interface GeneratorConfig {
  type: DatasetType;
  difficulty: DifficultyLevel;
  rowCount: number;
  messy: MessyConfig;
  filename: string;
  customPrompt?: string;
  customColumns?: ColumnDefinition[];
  format: 'xlsx' | 'csv' | 'json';
}

export interface DataRow {
  [key: string]: any;
}
