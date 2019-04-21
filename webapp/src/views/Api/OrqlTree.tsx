import React from 'react';
import {Col, Form, InputNumber, Popover, Row, Select, Switch, Tree} from 'antd';
import {Association, Schema} from '../../beans';
import QueryBuilder from '../../components/QueryBuilder';
import {OrqlOps} from '../../config';
import Parser from 'orql-parser';
import {OrqlNode, OrqlExp, OrqlItem, OrqlLogicExp, OrqlLogicOp, OrqlNestExp, OrqlCompareExp, OrqlParam, OrqlValue, OrqlColumn, OrqlNull, OrqlOrder, OrqlAllItem} from 'orql-parser/lib/OrqlNode';

const {TreeNode} = Tree;

export type ExpMap = {[key: string]: string};

export type OrderMap = {[key: string]: string};

interface OrqlItemWrapper {
  key: string;
  path: string;
  item: OrqlItem;
  schema: Schema;
  isRoot?: boolean;
}

interface KeyTmp {
  key: string;
  arr: string[];
}

function isArray(association: Association) {
  return association.type == 'hasMany' || association.type == 'belongsToMany';
}

interface TreeNodeTitleProps {
  title: string;
  schema: Schema;
  path: string;
  defaultExp?: string;
  defaultOrder?: string;
  onChange: (exp) => void;
  selectAll: boolean;
}

interface SelectItem {
  name: string;
  isArray: boolean;
  exp?: string;
  order?: string;
  columns: string[];
  children: SelectItem[];
  selectAll: boolean;
}

export function getExpAndOrder(exp?: string, order?: string) {
  if (exp && order) return `(${exp} ${order})`;
  if (exp) return `(${exp})`;
  if (order) return `(${order})`;
  return '';
}

const TreeNodeTitle = (props: TreeNodeTitleProps) => (
  <Popover
    placement="right"
    content={(
      <QueryBuilder
        defaultExp={props.defaultExp}
        schema={props.schema}
        onChange={props.onChange}/>
    )}
    title="条件"
    trigger="click">
    {props.title} {props.selectAll && '全选'}
    <span style={{position: 'absolute'}}>{getExpAndOrder(props.defaultExp, props.defaultOrder)}</span>
  </Popover>
)

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
        exp += orqlExp.right.value.toString();
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
  const childOrqlArr: string[] = [];
  if (selectItem.selectAll) {
    childOrqlArr.push('*');
    childOrqlArr.push(...selectItem.columns.map(column => '!' + column));
  } else {
    childOrqlArr.push(...selectItem.columns);
  }
  childOrqlArr.push(...selectItem.children.map(child => selectItemToOrql(child)));
  if (childOrqlArr.length > 0) {
    const start = selectItem.isArray ? ': [' : ': {';
    const end = selectItem.isArray ? ']' : '}';
    orql += start + childOrqlArr.join(', ') + end;
  }
  return orql;
}

export interface OrqlTreeProps {
  schemas: Schema[];
  orql?: string;
  onChange: (orql: string) => void;
}

interface IState {
  schemaName?: string;
  expandedKeys: string[];
  selectedKeys: string[];
  op: string;
  isArray: boolean;
  expMap: ExpMap;
  orderMap: OrderMap;
}

class OrqlTree extends React.Component<OrqlTreeProps, IState> {

  private getOrqlParseObject = (orql?: string): {selectedKeys: string[], expandedKeys: string[], expMap: ExpMap, orderMap: OrderMap, tree?: OrqlNode} => {
    const selectedKeys: string[] = [];
    const expandedKeys: string[] = [];
    const expMap: ExpMap = {};
    const orderMap: OrderMap = {};
    if (!orql) return {selectedKeys, expandedKeys, expMap, orderMap};
    const orqlTree = Parser.parse(orql);
    const root = orqlTree.item;
    // 展开父节点
    expandedKeys.push(root.name);
    const stack: OrqlItemWrapper[] = [{
      item: root,
      path: root.name,
      key: root.name,
      schema: this.getSchema(root.name)
    }];
    while (stack.length > 0) {
      const {item, schema, path, key} = stack.pop()!;
      if (item.where && item.where.exp) {
        // 获取exp
        expMap[path] = orqlExpToString(item.where.exp);
      }
      if (item.where && item.where.orders && item.where.orders.length > 0) {
        orderMap[path] = orqlOrdersToString(item.where.orders);
      }
      if (item.children) {
        for (const childItem of item.children) {
          if (childItem instanceof OrqlAllItem) {
            // 全选
            selectedKeys.push(key);
            continue;
          }
          const childPath = `${path}.${childItem.name}`;
          const column = schema.columns.find(column => column.name == childItem.name);
          if (column) {
            // 获取column
            selectedKeys.push(`column.${childPath}`);
            continue;
          }
          const association = schema.associations.find(association => association.name == childItem.name);
          if (association) {
            // 获取ref
            const key = `${isArray(association) ? 'array' : 'object'}.${childPath}`;
            // selectedKeys.push(key);
            expandedKeys.push(key);
            stack.push({
              item: childItem,
              path: childPath,
              key,
              schema: this.getSchema(association.refName)
            });
          }
        }
      }
    }
    return {selectedKeys, expandedKeys, expMap, orderMap, tree: orqlTree};
  }

  private getSchema = (name: string) => {
    return this.props.schemas.find(schema => schema.name == name)!
  }

  private orql = this.props.orql;

  private parseObject = this.getOrqlParseObject(this.orql);

  private root = this.parseObject.tree ? this.parseObject.tree.item : undefined;

  state: IState = {
    schemaName: this.root ? this.root.name : undefined,
    expandedKeys: this.parseObject.expandedKeys,
    selectedKeys: this.parseObject.selectedKeys,
    op: this.parseObject.tree ? this.parseObject.tree.op : 'query',
    isArray: this.root ? this.root.isArray : false,
    expMap: this.parseObject.expMap,
    orderMap: this.parseObject.orderMap
  }

  handleCheck = (keys: any) => {
    this.setState({
      selectedKeys: keys.checked
    }, this.genOrql);
  }

  handleExpand = (expandedKeys: string[]) => {
    this.setState({expandedKeys});
  }

  handleArrayChange = (isArray: boolean) => {
    this.setState({
      isArray
    }, this.genOrql);
  }

  handleChangeExpMap = (expMap: ExpMap) => {
    this.setState({
      expMap
    }, this.genOrql);
  }

  handleChangeSchema = (name: string) => {
    this.setState({
      schemaName: name,
      expandedKeys: [name],
      selectedKeys: [],
      expMap: {},
      orderMap: {}
    });
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
    const {op, selectedKeys, expandedKeys, expMap, orderMap, schemaName, isArray} = this.state;
    if (selectedKeys.length == 0) return;
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
    // 重新拼装成树
    const root: SelectItem = {
      name: schemaName!,
      isArray,
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
          isArray: true,
          name,
          exp: expMap[keyTmp.key],
          children: [],
          columns: [],
          selectAll
        });
      } else if (type == 'object') {
        parent.children.push({
          isArray: false,
          exp: expMap[keyTmp.key],
          name,
          children: [],
          columns: [],
          selectAll
        });
      }
    }
    for (const keyTmp of selectedKeyTmps) {
      // 获取父节点
      const parent = this.getParent(root, keyTmp.arr)!;
      // 类型 array object column
      const type = keyTmp.arr[0];
      // 名称
      const name = keyTmp.arr[keyTmp.arr.length - 1];
      if (type == 'column') {
        parent.columns.push(name);
      }
    }
    const orql = op + ' ' + selectItemToOrql(root);
    this.orql = orql;
    console.log('gen orql: ' + orql);
    this.props.onChange(orql);
  }

  componentWillReceiveProps(nextProps: OrqlTreeProps) {
    if (nextProps.orql != this.orql) {
      try {
        const parseObject = this.getOrqlParseObject(nextProps.orql);
        this.orql = nextProps.orql;
        const root = parseObject.tree!;
        this.setState({
          op: root.op,
          isArray: root.item.isArray,
          selectedKeys: parseObject.selectedKeys,
          expandedKeys: parseObject.expandedKeys,
          expMap: parseObject.expMap,
          orderMap: parseObject.orderMap
        });
      } catch (e) {
        console.log('parse error');
      }
    }
  }

  renderTree() {
    const {schemas} = this.props;
    const {schemaName, selectedKeys, expandedKeys, expMap, orderMap} = this.state;
    if (!schemaName) return;
    const schema = schemas.find(schema => schema.name == schemaName)!;
    const selectAll = selectedKeys.indexOf(schemaName) >= 0;
    return (
      <Tree
        checkable
        checkStrictly
        onExpand={this.handleExpand}
        checkedKeys={selectedKeys}
        expandedKeys={expandedKeys}
        onCheck={keys => this.handleCheck(keys)}>
        <TreeNode key={schema.name} title={(
          <TreeNodeTitle
            path={schemaName}
            onChange={exp => this.handleChangeExpMap({...expMap, [schemaName]: exp})}
            defaultExp={expMap[schemaName]}
            defaultOrder={orderMap[schemaName]}
            schema={schema}
            selectAll={selectAll}
            title={schemaName} />
        )}>
          {schema.columns.map(column => {
            const key = `column.${schema.name}.${column.name}`;
            return (
              <TreeNode
                key={key}
                title={column.name + (selectAll && selectedKeys.indexOf(key) >= 0 ? '忽略' : '')}/>
            );
          })}
          {schema.associations.map(association => {
            const array = isArray(association);
            const key = `${array ? 'array' : 'object'}.${schema.name}.${association.name}`;
            return expandedKeys.indexOf(key) >= 0
              ? this.renderRefTree(
                schema.name,
                isArray(association),
                association.name,
                association.refName)
              : (
                <TreeNode
                  isLeaf={false}
                  key={key}
                  title={(
                    <TreeNodeTitle
                      defaultExp={expMap[key]}
                      defaultOrder={orderMap[key]}
                      path={key}
                      onChange={exp => this.handleChangeExpMap({...expMap, [key]: exp})}
                      title={association.name}
                      schema={schemas.find(schema => schema.name == association.refName)!}
                      selectAll={selectedKeys.indexOf(key) >= 0}/>
                  )} />
              )
          })}
        </TreeNode>
      </Tree>
    );
  }
  renderRefTree(parentKey: string, array: boolean, refName: string, schemaName: string) {
    const {schemas} = this.props;
    const {expandedKeys, selectedKeys, expMap, orderMap} = this.state;
    const schema = schemas.find(schema => schema.name == schemaName)!;
    const key = `${array ? 'array' : 'object'}.${parentKey}.${refName}`;
    const selectAll = selectedKeys.indexOf(key) >= 0;
    return (
      <TreeNode key={key} title={(
        <TreeNodeTitle
          path={key}
          defaultExp={expMap[key]}
          defaultOrder={orderMap[key]}
          onChange={exp => this.handleChangeExpMap({...expMap, [key]: exp})}
          title={refName}
          schema={schema}
          selectAll={selectAll}/>
      )}>
        {schema.columns.map(column => {
          const key = `column.${parentKey}.${refName}.${column.name}`;
          return (
            <TreeNode
              key={key}
              title={column.name + (selectAll && selectedKeys.indexOf(key) >= 0 ? '忽略' : '')}/>
          );
        })}
        {schema.associations.map(association => {
          const childKey = `${isArray(association) ? 'array' : 'object'}.${parentKey}.${refName}.${association.name}`;

          if (expandedKeys.indexOf(childKey) >= 0) {
            return this.renderRefTree(
              `${parentKey}.${refName}`,
              isArray(association),
              association.name,
              association.refName)
          }
          return (
            <TreeNode
              isLeaf={false}
              key={childKey}
              title={association.name}>
            </TreeNode>
          )
        })}
      </TreeNode>
    );
  }
  render() {
    const {schemas} = this.props;
    const {schemaName, isArray, op} = this.state;
    return (
      <div>
        <p style={{color: 'rgba(0, 0, 0, 0.65)', margin: '5px 0'}}>{schemaName ? '点击名称配置条件' : '请选择实体'}</p>
        <Row>
          <Col span={6}>
            <Form.Item label="操作">
              <Select<string> value={op} onSelect={op => this.setState({op})}>
                {OrqlOps.map(op => (
                  <Select.Option key={op} value={op}>{op}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="实体">
              <Select<string> value={schemaName} onSelect={this.handleChangeSchema}>
                {schemas.map(schema => (
                  <Select.Option key={schema.name} value={schema.name}>{schema.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="数组">
              <Switch defaultChecked={isArray} onChange={this.handleArrayChange} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="分页">
              <InputNumber disabled={!isArray} />
            </Form.Item>
          </Col>
        </Row>
        {this.renderTree()}
      </div>
    );
  }
}

export default OrqlTree;