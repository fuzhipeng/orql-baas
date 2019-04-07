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

export interface AppMenu {
  label: string;
  onClick: () => void;
}