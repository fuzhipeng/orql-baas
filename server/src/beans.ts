import {ConfigurationOptions} from 'orql-executor/lib/Configuration';
import {DataType} from 'orql-executor';
import {AssociationType} from 'orql-executor/lib/Schema';

export interface Config {
  port: number;
  orql: ConfigurationOptions;
}

export interface ApiConfig {
  groups: string[];
  apis: Api[];
}

export interface Api {
  url: string;
  orql: string;
  group?: string;
  comment?: string;
}

export interface Schema {
  name: string;
  table?: string;
  columns: Column[];
  associations: Association[];
}

export interface Column {
  name: string;
  type: DataType;
  field?: string;
  length?: number;
  required?: boolean;
  primaryKey?: boolean;
  generatedKey?: boolean;
}

export interface Association {
  name: string;
  type: AssociationType;
  ref?: string;
  refKey?: string;
  required?: boolean;
  middle?: string;
  middleKey?: string;
}