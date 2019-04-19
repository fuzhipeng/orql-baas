export interface Schema {
  name: string;
  table?: string;
  columns: Column[];
  associations: Association[];
}

export interface Column {
  name: string;
  type: string;
  field?: string;
  length?: number;
  required?: boolean;
  primaryKey?: boolean;
  generatedKey?: boolean;
}

export interface Association {
  name: string;
  type: string;
  refName: string;
  refKey?: string;
  required?: boolean;
  middle?: string;
  middleKey?: string;
}

export interface Api {
  url: string;
  comment?: string;
  group: string;
  orql?: string;
  fun?: string;
  options?: string;
}

export interface PluginConfig {
  name: string;
  weight?: number;
  comment?: string;
  options?: string;
  matchType: MatchType;
  matchValue: string;
}

export enum MatchType {
  Group = 'group',
  Url = 'url'
}

export interface AppMenu {
  label: string;
  onClick?: () => void;
  subMenus?: AppMenu[];
}

export interface Fun {
  name: string;
  label: string;
  options?: FunOptions;
}

export interface Plugin {
  name: string;
  label: string;
  options?: FunOptions;
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