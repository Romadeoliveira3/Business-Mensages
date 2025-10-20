export interface Migration {
  id: string;
  revision: string;
  down_revision: string | null;
  message: string;
  timestamp: string;
}

export interface ModelField {
  name: string;
  type: string;
  options?: string[];
}

export interface ModelDefinition {
  name: string;
  type: 'SQLAlchemy' | 'Pydantic';
  fields: ModelField[];
}

export enum View {
  Models = 'Models',
  Migrations = 'Migrations',
  ModelDetail = 'ModelDetail',
}

export interface AppConfig {
  id: string;
  projectName: string;
  dbUrl: string;
  migrationsPath: string;
  modelsPath: string;
}