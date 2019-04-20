import {Col, Form, Input, InputNumber, Row, Select, Switch} from 'antd';
import React from 'react';
import {FormComponentProps} from 'antd/lib/form';
import {FormItemLayout, OrqlOps} from '../../config';
import {Api, Association, Schema} from '../../beans';
import OrqlTree, {ExpMap, getExpAndOrder, OrderMap} from './OrqlTree';
import Parser from 'orql-parser';
import {OrqlNode, OrqlExp, OrqlItem, OrqlLogicExp, OrqlLogicOp, OrqlNestExp, OrqlCompareExp, OrqlParam, OrqlValue, OrqlColumn, OrqlNull, OrqlOrder} from 'orql-parser/lib/OrqlNode';

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
  orderMap: OrderMap;
  expandedKeys: string[];
}

interface KeyTmp {
  key: string;
  arr: string[];
}

interface SelectItem {
  name: string;
  array: boolean;
  exp?: string;
  order?: string;
  columns: string[];
  children: SelectItem[];
  selectAll: boolean;
}

// orql表达式转string
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

// orql orders转string
function orqlOrdersToString(orders: OrqlOrder[]): string {
  return 'order ' + orders.map(order => `${order.columns.map(column => column.name).join(' ')} ${order.sort}`).join(', ');
}

// select item转orql
function selectItemToOrql(selectItem: SelectItem): string {
  let orql = selectItem.name;
  orql += getExpAndOrder(selectItem.exp, selectItem.order);
  // 全放一个数组先
  // const childOrqlArr = [
  //   ...selectItem.columns,
  //   ...selectItem.children
  //     .map(child => selectItemToOrql(child))
  // ];
  const childOrqlArr: string[] = [];
  if (selectItem.selectAll) {
    childOrqlArr.push('*');
    childOrqlArr.push(...selectItem.columns.map(column => '!' + column));
  } else {
    childOrqlArr.push(...selectItem.columns);
  }
  childOrqlArr.push(...selectItem.children.map(child => selectItemToOrql(child)));
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
  isRoot?: boolean;
}

function isArray(association: Association) {
  return association.type == 'hasMany' || association.type == 'belongsToMany';
}

export default Form.create()(class OrqlApiForm extends React.Component<ApiFormProps, IState> {

  private getSchema = (name: string) => {
    return this.props.schemas.find(schema => schema.name == name)!
  }

  private getOrqlParseObject = (orql?: string): {selectedKeys: string[], expMap: ExpMap, orderMap: OrderMap, tree?: OrqlNode} => {
    const selectedKeys: string[] = [];
    const expMap: ExpMap = {};
    const orderMap: OrderMap = {};
    if (!orql) return {selectedKeys, expMap, orderMap};
    const orqlTree = Parser.parse(orql);
    const root = orqlTree.item;
    // 获取root
    selectedKeys.push(root.name);
    const stack: OrqlItemWrapper[] = [{
      item: root,
      path: root.name,
      schema: this.getSchema(root.name)
    }];
    while (stack.length > 0) {
      const {item, schema, path} = stack.pop()!;
      if (item.where && item.where.exp) {
        // 获取exp
        expMap[path] = orqlExpToString(item.where.exp);
      }
      if (item.where && item.where.orders && item.where.orders.length > 0) {
        orderMap[path] = orqlOrdersToString(item.where.orders);
      }
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
    return {selectedKeys, expMap, orderMap, tree: orqlTree};
  }

  private orql = this.props.api ? this.props.api.orql : undefined;

  private parseObject = this.getOrqlParseObject(this.orql);

  private root = this.parseObject.tree ? this.parseObject.tree.item : undefined;

  state: IState = {
    op: 'query',
    visual: !!this.orql,
    array: this.root ? this.root.isArray : false,
    selectedKeys: this.parseObject.selectedKeys,
    expMap: this.parseObject.expMap,
    orderMap: this.parseObject.orderMap,
    schemaName: this.root ? this.root.name : undefined,
    expandedKeys: []
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
  private getParent = (root: SelectItem, arr: string[]): SelectItem | undefined => {
    let tmp = root;
    let i = 2;
    // console.log('arr', arr);
    while (i < arr.length - 1) {
      let key = arr[i];
      // console.log('i', i, 'key', key);
      i ++;
      // console.log('parent', JSON.stringify(tmp));
      if (!tmp) return undefined;
      tmp = tmp.children.find(child => child.name == key)!;
      // console.log('tmp', JSON.stringify(tmp));
    }
    return tmp;
  }
  private genOrql = () => {
    const {form: {setFieldsValue}} = this.props;
    const {op, selectedKeys, expandedKeys, expMap, orderMap, schemaName, array} = this.state;
    if (selectedKeys.length == 0) return;
    console.log(expandedKeys);
    const selectedKeyTmps: KeyTmp[] = [];
    const expandedKeyTmps: KeyTmp[] = [];
    // 先切割缓存起来
    selectedKeys.forEach(key => {
      const arr = key.split('.');
      selectedKeyTmps.push({key, arr});
    });
    expandedKeys.forEach(key => {
      const arr = key.split('.');
      expandedKeyTmps.push({key, arr});
    });
    // 排序，避免父节点不存在
    expandedKeyTmps.sort((a, b) => a.arr.length - b.arr.length);
    // 排序，用于记录全选
    // selectedKeyTmps.sort((a, b) => a.arr.length - b.arr.length);
    // // 排序，避免父节点不存在
    // selectedKeyTmps.sort((a, b) => a.arr.length - b.arr.length);
    // // FIXME root用于全选
    // if (selectedKeyTmps[0].key != schemaName) {
    //   selectedKeyTmps.unshift({key: schemaName!, arr: [schemaName!]})
    // }
    // 重新拼装成树
    const root: SelectItem = {
      name: schemaName!,
      array,
      columns: [],
      children: [],
      exp: expMap[schemaName!],
      order: orderMap[schemaName!],
      selectAll: selectedKeys.indexOf(schemaName!) >= 0
    };
    for (const keyTmp of expandedKeyTmps) {
      // 获取父节点
      const parent = this.getParent(root, keyTmp.arr)!;
      // 类型 array object column
      const type = keyTmp.arr[0];
      // 名称
      const name = keyTmp.arr[keyTmp.arr.length - 1];
      // 根据key路径把keys exp order放回去
      const selectAll = selectedKeys.indexOf(keyTmp.key) >= 0;
      if (type == 'array') {
        parent.children.push({
          array: true,
          name,
          exp: expMap[keyTmp.key],
          children: [],
          columns: [],
          selectAll
        });
      } else if (type == 'object') {
        parent.children.push({
          array: false,
          exp: expMap[keyTmp.key],
          name,
          children: [],
          columns: [],
          selectAll
        });
      }
    }
    for (let i = 0; i < selectedKeyTmps.length; i ++) {
      const keyTmp = selectedKeyTmps[i];
      // 获取父节点
      const parent = this.getParent(root, keyTmp.arr);
      if (!parent) {
        // console.log('root', JSON.stringify(root));
        // console.log('keyTmps', JSON.stringify(keyTmps));
        console.warn(`key: ${keyTmp.key} parent not exists`);
        continue;
      }
      // 类型 array object column
      const type = keyTmp.arr[0];
      // 名称
      const name = keyTmp.arr[keyTmp.arr.length - 1];
      // // 根据key路径把keys exp order放回去
      // if (type == 'array') {
      //   parent.children.push({
      //     array: true,
      //     name,
      //     exp: expMap[keyTmp.key],
      //     children: [],
      //     columns: []
      //   });
      // } else if (type == 'object') {
      //   parent.children.push({
      //     array: false,
      //     exp: expMap[keyTmp.key],
      //     name,
      //     children: [],
      //     columns: []
      //   });
      // } else {
      //   parent.columns.push(name);
      // }
      if (type == 'column') {
        parent.columns.push(name);
      }
    }
    const orql = op + ' ' + selectItemToOrql(root);
    setFieldsValue({orql});
  }
  private handleOrqlChange = (orql: string) => {
    try {
      const orqlTree = Parser.parse(orql);
      const parserObject = this.getOrqlParseObject(orql);
      this.setState({
        expMap: parserObject.expMap,
        orderMap: parserObject.orderMap,
        selectedKeys: parserObject.selectedKeys
      });
    } catch (e) {
      // console.log(e);
    }
  }
  private handleArrayChange = (array: boolean) => {
    this.setState({
      array
    }, this.genOrql);
  }
  render() {
    const {op, visual, schemaName, array, selectedKeys, expMap, orderMap} = this.state;
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
            initialValue: this.orql
          })(<TextArea onChange={e => this.handleOrqlChange(e.target.value)} />)}
        </Form.Item>
        <Row>
          <Col span={12}>
            <Form.Item label="配置">
              {getFieldDecorator('visual', {
                initialValue: !!api,
              })(<Switch defaultChecked={!!api} onChange={visual => this.setState({visual})} />)}
            </Form.Item>
          </Col>
        </Row>
        {visual && (
          <Row>
            <Col span={6}>
              <Form.Item label="操作">
                {getFieldDecorator('op', {
                  rules: [{ required: false, message: '请输入操作' }],
                  initialValue: this.parseObject.tree ? this.parseObject.tree.op : 'query'
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
                  initialValue: this.parseObject.tree ? this.parseObject.tree.item.name : undefined
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
                  initialValue: array,
                })(<Switch defaultChecked={array} onChange={this.handleArrayChange} />)}
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
                orderMap={orderMap}
                onChangeExpMap={this.handleChangeExpMap}
                selectedKeys={selectedKeys}
                onChangeSelectKeys={this.handleChangeSelectKeys}
                onChangeExpandedKeys={expandedKeys => this.setState({expandedKeys})}/>
            </Col>
          </Row>
        )}
      </Form>
    );
  }
});