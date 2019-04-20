import React from 'react';
import {Popover, Tree} from 'antd';
import {Association, Schema} from '../../beans';
import QueryBuilder from '../../components/QueryBuilder';

const {TreeNode} = Tree;

export type ExpMap = {[key: string]: string};

export type OrderMap = {[key: string]: string};

export interface OrqlTreeProps {
  schemas: Schema[];
  op: string;
  schemaName?: string;
  selectedKeys: string[];
  onChangeSelectKeys: (keys: string[]) => void;
  expMap: ExpMap;
  orderMap: OrderMap;
  onChangeExpMap: (expMap: ExpMap) => void;
  onChangeExpandedKeys: (expandedKeys: string[]) => void;
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

interface IState {
  expandedKeys: string[];
}

class OrqlTree extends React.Component<OrqlTreeProps, IState> {
  state: IState = {
    expandedKeys: []
  }
  handleCheck = (keys: any) => {
    const {op, onChangeSelectKeys} = this.props;
    // console.log(keys.checked);
    onChangeSelectKeys(keys.checked);
  }
  handleExpand = (expandedKeys: string[]) => {
    this.props.onChangeExpandedKeys(expandedKeys);
    this.setState({expandedKeys});
  }
  renderTree() {
    const {schemas, schemaName, selectedKeys, expMap, orderMap, onChangeExpMap} = this.props;
    if (!schemaName) return;
    const {expandedKeys} = this.state;
    const schema = schemas.find(schema => schema.name == schemaName)!;
    const selectAll = selectedKeys.indexOf(schemaName) >= 0;
    return (
      <Tree
        checkable
        checkStrictly
        onExpand={this.handleExpand}
        checkedKeys={selectedKeys}
        onCheck={keys => this.handleCheck(keys)}>
        <TreeNode key={schema.name} title={(
          <TreeNodeTitle
            path={schemaName}
            onChange={exp => onChangeExpMap({...expMap, [schemaName]: exp})}
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
                      onChange={exp => onChangeExpMap({...expMap, [key]: exp})}
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
    const {schemas, selectedKeys, expMap, orderMap, onChangeExpMap} = this.props;
    const {expandedKeys} = this.state;
    const schema = schemas.find(schema => schema.name == schemaName)!;
    const key = `${array ? 'array' : 'object'}.${parentKey}.${refName}`;
    const selectAll = selectedKeys.indexOf(key) >= 0;
    return (
      <TreeNode key={key} title={(
        <TreeNodeTitle
          path={key}
          defaultExp={expMap[key]}
          defaultOrder={orderMap[key]}
          onChange={exp => onChangeExpMap({...expMap, [key]: exp})}
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
    const {schemaName} = this.props;
    return (
      <div>
        <p style={{color: 'rgba(0, 0, 0, 0.65)', margin: '5px 0'}}>{schemaName ? '点击名称配置条件' : '请选择实体'}</p>
        {this.renderTree()}
      </div>
    );
  }
}

export default OrqlTree;