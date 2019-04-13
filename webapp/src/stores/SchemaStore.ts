import {action, observable, toJS} from 'mobx';
import {Association, Column, Schema} from '../beans';
import {httpDelete, httpGetWithData, httpPost, httpPut} from '../utils/network';
import {message} from 'antd';

export default class SchemaStore {

  readonly schemas = observable<Schema>([]);

  private sync() {
    httpPut('/_edit/sync')
      .then(res => console.log('sync', res));
  }

  @action async load() {
    const schemas = await httpGetWithData<Schema[]>('/_edit/schemas');
    this.schemas.replace(schemas!);
  }

  @action async addSchema(schema: Schema) {
    console.log('addSchema', schema);
    const res = await httpPost('/_edit/schemas', schema);
    if (!res.success) {
      message.error(res.msg);
      return;
    }
    this.schemas.push(schema);
  }

  @action async updateSchema(name: string, data: {name: string, table?: string}) {
    console.log('updateSchema', 'name', name, 'data', data);
    const schema = this.schemas.find(schema => schema.name == name)!;
    const res = await httpPut(`/_edit/schemas/${name}`, data);
    if (!res.success) {
      message.error(res.msg);
      return;
    }
    schema.name = data.name;
    schema.table = data.table;
  }

  @action async removeSchema(name: string) {
    const index = this.schemas.findIndex(schema => schema.name == name);
    if (index < 0) return;
    const res = await httpDelete(`/_edit/schemas/${name}`);
    if (!res.success) {
      message.error(res.msg);
      return;
    }
    this.schemas.splice(index, 1);
    return index;
  }

  getSchemaByName(name: string) {
    return this.schemas.find(schema => schema.name == name);
  }

  @action async addColumn(schema: Schema, column: Column) {
    const res = await httpPost(`/_edit/schemas/${schema.name}/columns`, column);
    if (!res.success) {
      message.error(res.msg);
      return;
    }
    schema.columns.push(column);
  }

  @action async updateColumn(schemaName: string, columnName: string, column: Column) {
    const schema = this.getSchemaByName(schemaName);
    if (!schema) return;
    const index = schema.columns.findIndex(column => column.name == columnName);
    if (index < 0) return;
    const res = await httpPut(`/_edit/schemas/${schemaName}/columns/${columnName}`, column);
    if (!res.success) {
      message.error(res.msg);
      return;
    }
    schema.columns[index] = column;
  }

  @action async removeColumn(schemaName: string, columnName: string) {
    const schema = this.getSchemaByName(schemaName);
    if (!schema) return;
    const index = schema.columns.findIndex(column => column.name == columnName);
    if (index < 0) return;
    const res = await httpDelete(`/_edit/schemas/${schemaName}/columns/${columnName}`);
    if (!res.success) {
      message.error(res.msg);
      return;
    }
    schema.columns.splice(index, 1);
  }

  @action async removeAssociation(schemaName: string, associationName: string) {
    const schema = this.getSchemaByName(schemaName);
    if (!schema) return;
    const index = schema.associations.findIndex(association => association.name == associationName);
    if (index < 0) return;
    const res = await httpDelete(`/_edit/schemas/${schemaName}/${associationName}`);
    if (!res.success) {
      message.error(res.msg);
      return;
    }
    schema.associations.splice(index, 1);
  }

  @action async addAssociation(schema: Schema, association: Association) {
    const res = await httpPost(`/_edit/schemas/${schema.name}/associations`, association);
    if (!res.success) {
      message.error(res.msg);
      return;
    }
    schema.associations.push(association);
  }

  @action async updateAssociation(schemaName: string, associationName: string, association: Association) {
    const schema = this.getSchemaByName(schemaName);
    if (!schema) return;
    const index = schema.associations.findIndex(association => association.name == associationName);
    if (index < 0) return;
    const res = await httpPut(`/_edit/schemas/${schemaName}/associations/${associationName}`, association);
    if (!res.success) {
      message.error(res.msg);
      return;
    }
    schema.associations[index] = association;
  }

}