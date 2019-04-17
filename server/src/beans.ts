import {ConfigurationOptions} from 'orql-executor/lib/Configuration';
import {DataType} from 'orql-executor';
import {AssociationType} from 'orql-executor/lib/Schema';

export interface Config {
  port: number;
  orql: ConfigurationOptions;
}

export interface ApiObject {
  groups: string[];
  apis: ApiConfig[];
}

export interface ApiConfig {
  url: string;
  orql?: string;
  fun?: string;
  options?: string;
  group: string;
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

export interface FunApi {
  label: string;
  options?: FunOptions;
  handle: (any) => void;
}

export enum OptionType {
  Radio = 'radio',
  Text = 'text',
  Select = 'select'
}

export type FunOptions = {[key: string]: FunOption}

export interface FunOption {
  label: string;
  type: OptionType;
  values?: string[];
  defaultValue?: string;
  dep?: string;
  required?: boolean;
}