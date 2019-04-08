import React from 'react';
import {Popover, Tree} from 'antd';
import {Association, Schema} from '../../beans';
import QueryBuilder from '../../components/QueryBuilder';

const {TreeNode} = Tree;

export type ExpMap = {[key: string]: string};

export interface OrqlTreeProps {
  schemas: Schema[];
  op: string;
  schemaName?: string;
  selectedKeys: string[];
  onChangeSelectKeys: (keys: string[]) => void;
  expMap: ExpMap;
  onChangeExpMap: (expMap: ExpMap) => void;
}

function isArray(association: Association) {
  return association.type == 'hasMany' || association.type == 'belongsToMany';
}

const TreeNodeTitle = (props: {title: string, schema: Schema, path: string, defaultExp?: string, onChange: (exp) => void}) => (
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
    {props.title} <span style={{position: 'absolute'}}>{props.defaultExp ? `(${props.defaultExp})` : ''}</span>
  </Popover>
)

class OrqlTree extends React.Component<OrqlTreeProps> {
  handleCheck = (keys: any) => {
    const {op, onChangeSelectKeys} = this.props;
    // console.log(keys.checked);
    onChangeSelectKeys(keys.checked);
  }
  renderTree() {
    const {schemas, schemaName, selectedKeys, expMap, onChangeExpMap} = this.props;
    if (!schemaName) return;
    const schema = schemas.find(schema => schema.name == schemaName)!;
    return (
      <Tree
        checkable
        defaultExpandAll
        checkStrictly
        onCheck={keys => this.handleCheck(keys)}>
        <TreeNode key={schema.name} title={(
          <TreeNodeTitle
            path={schemaName}
            onChange={exp => onChangeExpMap({...expMap, [schemaName]: exp})}
            defaultExp={expMap[schemaName]}
            schema={schema}
            title={schemaName} />
        )}>
          {schema.columns.map(column => (
            <TreeNode
              key={`column.${schema.name}.${column.name}`}
              title={column.name}/>
          ))}
          {schema.associations.map(association => {
            const array = isArray(association);
            const key = `${array ? 'array' : 'object'}.${schema.name}.${association.name}`;
            return selectedKeys.indexOf(key) >= 0
              ? this.renderRefTree(
                schema.name,
                isArray(association),
                association.name,
                association.refName)
              : (
                <TreeNode
                  isLeaf
                  key={key}
                  title={(
                    <TreeNodeTitle
                      defaultExp={expMap[key]}
                      path={key}
                      onChange={exp => onChangeExpMap({...expMap, [key]: exp})}
                      title={association.name}
                      schema={schemas.find(schema => schema.name == association.refName)!}/>
                  )} />
              )
          })}
        </TreeNode>
      </Tree>
    );
  }
  renderRefTree(parentKey: string, array: boolean, refName: string, schemaName: string) {
    const {schemas, selectedKeys, expMap, onChangeExpMap} = this.props;
    const schema = schemas.find(schema => schema.name == schemaName)!;
    const key = `${array ? 'array' : 'object'}.${parentKey}.${refName}`;
    return (
      <TreeNode key={key} title={(
        <TreeNodeTitle
          path={key}
          defaultExp={expMap[key]}
          onChange={exp => onChangeExpMap({...expMap, [key]: exp})}
          title={schema.name}
          schema={schema}/>
      )}>
        {schema.columns.map(column => (
          <TreeNode
            key={`column.${parentKey}.${schema.name}.${column.name}`}
            title={column.name}/>
        ))}
        {schema.associations.map(association => (
          selectedKeys.indexOf(key) >= 0
            ? this.renderRefTree(
              `${parentKey}.${schema.name}`,
            isArray(association),
            association.name,
            association.refName)
            : (
              <TreeNode
                key={key}
                title={association.name}>
              </TreeNode>
            )
        ))}
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