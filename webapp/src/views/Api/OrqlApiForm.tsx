import {Col, Form, Input, InputNumber, Row, Select, Switch} from 'antd';
import React from 'react';
import {FormComponentProps} from 'antd/lib/form';
import {FormItemLayout, OrqlOps} from '../../config';
import {Api, Association, Schema} from '../../beans';
import OrqlTree, {ExpMap} from './OrqlTree';
import Parser from 'orql-parser';
import {OrqlExp, OrqlItem, OrqlLogicExp, OrqlLogicOp, OrqlNestExp, OrqlCompareExp, OrqlParam, OrqlValue, OrqlColumn, OrqlNull} from 'orql-parser/lib/OrqlNode';

const { TextArea } = Input;

export interface ApiFormProps extends FormComponentProps {
  schemas: Schema[];
  groups: string[];
  currentGroup: string;
  api?: Api;
}

interface IState {
  op: string;
  visual: boolean;
  array: boolean;
  schemaName?: string;
  selectedKeys: string[];
  expMap: ExpMap;
}

interface KeyTmp {
  key: string;
  arr: string[];
}

interface SelectItem {
  name: string;
  array: boolean;
  exp?: string;
  columns: string[];
  children: SelectItem[];
}

function orqlExpToString(orqlExp: OrqlExp): string {
  if (orqlExp instanceof OrqlNestExp) {
    return '(' + orqlExpToString(orqlExp) + ')';
  }
  if (orqlExp instanceof OrqlLogicExp) {
    const left = orqlExpToString(orqlExp.left);
    const op = orqlExp.op == OrqlLogicOp.And ? '&&' : '||';
    const right = orqlExpToString(orqlExp.right);
    return `${left} ${op} ${right}`;
  }
  if (orqlExp instanceof OrqlCompareExp) {
    let exp = orqlExp.left.name;
    exp += ` ${orqlExp.op} `;
    if (orqlExp.right instanceof OrqlParam) {
      exp += '$' + orqlExp.right.name;
    } else if (orqlExp.right instanceof OrqlValue) {
      if (orqlExp.right instanceof OrqlNull) {
        exp += 'null';
      } else {
        exp += orqlExp.right.toString();
      }
    } else if (orqlExp.right instanceof OrqlColumn) {
      exp += orqlExp.right.name;
    }
    return exp;
  }
  throw new Error('');
}

function selectItemToOrql(selectItem: SelectItem): string {
  let orql = selectItem.name;
  if (selectItem.exp) orql += '(' + selectItem.exp + ')';
  // 全放一个数组先
  let childOrqlArr = [
    ...selectItem.columns,
    ...selectItem.children
      .map(child => selectItemToOrql(child))
  ];
  if (childOrqlArr.length > 0) {
    const start = selectItem.array ? ': [' : ': {';
    const end = selectItem.array ? ']' : '}';
    orql += start + childOrqlArr.join(', ') + end;
  }
  return orql;
}

interface OrqlItemWrapper {
  path: string;
  item: OrqlItem;
  schema: Schema;
}

function isArray(association: Association) {
  return association.type == 'hasMany' || association.type == 'belongsToMany';
}

export default Form.create()(class OrqlApiForm extends React.Component<ApiFormProps, IState> {

  private orqlTree = this.props.api && this.props.api.orql
    ? Parser.parse(this.props.api.orql)
    : undefined;

  private getSchema = (name: string) => {
    return this.props.schemas.find(schema => schema.name == name)!
  }

  private getDefaultSelectedKeys = () => {
    const selectedKeys: string[] = [];
    if (!this.orqlTree) return selectedKeys;
    const root = this.orqlTree.item;
    // 获取root
    selectedKeys.push(root.name);
    const stack: OrqlItemWrapper[] = [{
      item: root,
      path: root.name,
      schema: this.getSchema(root.name)
    }];
    while (stack.length > 0) {
      const {item, schema, path} = stack.pop()!;
      if (item.children) {
        for (const childItem of item.children) {
          const column = schema.columns.find(column => column.name == childItem.name);
          const childPath = `${path}.${childItem.name}`;
          if (column) {
            // 获取column
            selectedKeys.push(`column.${childPath}`);
            continue;
          }
          const association = schema.associations.find(association => association.name == childItem.name);
          if (association) {
            // 获取ref
            selectedKeys.push(`${isArray(association) ? 'array' : 'object'}.${childPath}`);
            stack.push({
              item: childItem,
              path: childPath,
              schema: this.getSchema(association.refName)
            });
          }
        }
      }
    }
    return selectedKeys;
  }

  private getDefaultExpMap = () => {
    const expMap: ExpMap = {};
    if (!this.orqlTree) return expMap;
    const root = this.orqlTree.item;
    const stack: OrqlItemWrapper[] = [{
      item: root,
      path: root.name,
      schema: this.getSchema(root.name)
    }];
    while (stack.length > 0) {
      const {item, schema, path} = stack.pop()!;
      if (item.where && item.where.exp) {
        // 获取exp
        expMap[path] = orqlExpToString(orqlExpToString(item.where.exp));
      }
      if (item.children) {
        for (const childItem of item.children) {
          const childPath = `${path}.${childItem.name}`;
          const association = schema.associations.find(association => association.name == childItem.name);
          if (association) {
            stack.push({
              item: childItem,
              path: childPath,
              schema: this.getSchema(association.refName)
            });
          }
        }
      }
    }
    return expMap;
  }

  state: IState = {
    op: 'query',
    visual: !!this.props.api,
    array: this.orqlTree ? this.orqlTree.item.isArray : false,
    selectedKeys: this.getDefaultSelectedKeys(),
    expMap: this.getDefaultExpMap(),
    schemaName: this.orqlTree ? this.orqlTree.item.name : undefined
  }

  private handleChangeSelectKeys = (selectedKeys: string[]) => {
    this.setState({
      selectedKeys
    }, this.genOrql);
  }
  private handleChangeExpMap = (expMap: ExpMap) => {
    this.setState({
      expMap
    }, this.genOrql);
  }
  private getParent = (root: SelectItem, arr: string[]): SelectItem => {
    let tmp = root;
    let i = 2;
    while (i < arr.length - 1) {
      let key = arr[i++];
      tmp = root.children.find(child => child.name == key)!;
    }
    return tmp;
  }
  private genOrql = () => {
    const {form: {setFieldsValue}} = this.props;
    const {op, selectedKeys, expMap, schemaName, array} = this.state;
    if (selectedKeys.length == 0) return;
    const keyTmps: KeyTmp[] = [];
    // 先切割缓存起来
    selectedKeys.forEach(key => {
      const arr = key.split('.');
      keyTmps.push({key, arr});
    });
    // 排序，避免父节点不存在
    keyTmps.sort((a, b) => a.arr.length - b.arr.length);
    // FIXME root用于全选
    if (keyTmps[0].key != schemaName) {
      keyTmps.unshift({key: schemaName!, arr: [schemaName!]})
    }
    // 重新拼装成树
    const root: SelectItem = {
      name: schemaName!,
      array,
      columns: [],
      children: [],
      exp: expMap[schemaName!]
    };
    for (let i = 1; i < keyTmps.length; i ++) {
      const keyTmp = keyTmps[i];
      // 获取父节点
      const parent = this.getParent(root, keyTmp.arr);
      if (!parent) continue;
      // 类型 array object column
      const type = keyTmp.arr[0];
      // 名称
      const name = keyTmp.arr[keyTmp.arr.length - 1];
      if (type == 'array') {
        const exp = expMap[keyTmp.key];
        parent.children.push({
          array: true,
          name,
          exp,
          children: [],
          columns: []
        });
      } else if (type == 'object') {
        const exp = expMap[keyTmp.key];
        parent.children.push({
          array: false,
          exp,
          name,
          children: [],
          columns: []
        });
      } else {
        parent.columns.push(name);
      }
    }
    const orql = op + ' ' + selectItemToOrql(root);
    setFieldsValue({orql});
  }
  render() {
    const {op, visual, schemaName, array, selectedKeys, expMap} = this.state;
    const {form: {getFieldDecorator, setFieldsValue}, schemas, groups, currentGroup, api} = this.props;
    return (
      <Form layout="vertical" {...FormItemLayout}>
        <Row>
          <Col span={8}>
            <Form.Item label="url">
              {getFieldDecorator('url', {
                rules: [{ required: true, message: '请输入url' }],
                initialValue: api ? api.url : '/',
              })(<Input />)}
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="分组">
              {getFieldDecorator('group', {
                rules: [{ required: true, message: '请选择api分组'}],
                initialValue: api ? api.group : currentGroup
              })(
                <Select placeholder="api分组">
                  {groups.map(group => (
                    <Select.Option key={group} value={group}>{group}</Select.Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="备注">
              {getFieldDecorator('comment', {
                rules: [{ required: false, message: '请输入备注' }],
                initialValue: api ? api.comment : undefined
              })(<Input />)}
            </Form.Item>
          </Col>
        </Row>
        <Form.Item labelCol={{span: 2}} wrapperCol={{span: 20}} label="orql">
          {getFieldDecorator('orql', {
            rules: [{ required: true, message: '请输入orql' }],
            initialValue: api ? api.orql : undefined
          })(<TextArea />)}
        </Form.Item>
        <Row>
          <Col span={12}>
            <Form.Item label="配置">
              {getFieldDecorator('visual', {
                initialValue: !!api,
              })(<Switch onChange={visual => this.setState({visual})} />)}
            </Form.Item>
          </Col>
        </Row>
        {visual && (
          <Row>
            <Col span={6}>
              <Form.Item label="操作">
                {getFieldDecorator('op', {
                  rules: [{ required: false, message: '请输入操作' }],
                  initialValue: this.orqlTree ? this.orqlTree.op : 'query'
                })(
                  <Select<string> onSelect={op => this.setState({op})}>
                    {OrqlOps.map(op => (
                      <Select.Option key={op} value={op}>{op}</Select.Option>
                    ))}
                  </Select>
                )}
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="实体">
                {getFieldDecorator('schema', {
                  rules: [{ required: false }],
                  initialValue: this.orqlTree ? this.orqlTree.item.name : undefined
                })(
                  <Select<string> onSelect={schemaName => this.setState({schemaName})}>
                    {schemas.map(schema => (
                      <Select.Option key={schema.name} value={schema.name}>{schema.name}</Select.Option>
                    ))}
                  </Select>
                )}
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="数组">
                {getFieldDecorator('array', {
                  initialValue: this.state.array,
                })(<Switch onChange={array => this.setState({array})} />)}
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="分页">
                {getFieldDecorator('size', {
                })(<InputNumber disabled={!array} />)}
              </Form.Item>
            </Col>
            <Col span={24}>
              <OrqlTree
                schemaName={schemaName}
                schemas={schemas}
                op={op}
                expMap={expMap}
                onChangeExpMap={this.handleChangeExpMap}
                selectedKeys={selectedKeys}
                onChangeSelectKeys={this.handleChangeSelectKeys}/>
            </Col>
          </Row>
        )}
      </Form>
    );
  }
});