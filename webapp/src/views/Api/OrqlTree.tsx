import React from 'react';
import {Button, Popover, Tree} from 'antd';
import {Schema} from '../../beans';
import QueryBuilder from '../../components/QueryBuilder';

const {TreeNode} = Tree;

export interface OrqlTreeProps {
  schemas: Schema[];
  op: string;
  schemaName?: string;
}

interface IState {
  expandRefs: string[];
}

const TreeNodeTitle = (props: {title: string, schema: Schema}) => (
  <Popover
    placement="right"
    content={<QueryBuilder defaultExp="id = $id" schema={props.schema} onChange={exp => console.log(exp)}/>}
    title="条件"
    trigger="click">
    {props.title}
  </Popover>
)

class OrqlTree extends React.Component<OrqlTreeProps, IState> {
  state: IState = {
    expandRefs: []
  }
  handleCheck = (keys: string[]) => {
    const {op} = this.props;
    if (op != 'query' && op != 'count') return;
    this.setState({
      expandRefs: keys.filter(key => key.indexOf('ref') == 0)
    });
  }
  renderTree() {
    const {schemas, schemaName} = this.props;
    if (!schemaName) return;
    const {expandRefs} = this.state;
    const schema = schemas.find(schema => schema.name == schemaName)!;
    return (
      <Tree
        checkable
        defaultExpandAll
        autoExpandParent
        onCheck={keys => this.handleCheck(keys as string[])}>
        <TreeNode key={schema.name} title={<TreeNodeTitle schema={schema} title={schema.name} />}>
          {schema.columns.map(column => (
            <TreeNode
              key={`column.${schema.name}.${column.name}`}
              title={column.name}/>
          ))}
          {schema.associations.map(association => (
            expandRefs.indexOf(`ref.${schema.name}.${association.name}`) >= 0
              ? this.renderRefTree(schema.name, association.name, association.refName)
              : (
                <TreeNode
                  isLeaf
                  key={`ref.${schema.name}.${association.name}`}
                  title={association.name} />
              )
          ))}
        </TreeNode>
      </Tree>
    );
  }
  renderRefTree(parentKey: string, refName: string, schemaName: string) {
    // console.log('renderRefTree', 'parentKey', parentKey, 'schemaName', schemaName);
    const {schemas} = this.props;
    const {expandRefs} = this.state;
    const schema = schemas.find(schema => schema.name == schemaName)!;
    return (
      <TreeNode key={`ref.${parentKey}.${refName}`} title={schema.name}>
        {schema.columns.map(column => (
          <TreeNode
            key={`column.${parentKey}.${schema.name}.${column.name}`}
            title={column.name}/>
        ))}
        {schema.associations.map(association => (
          expandRefs.indexOf(`ref.${parentKey}.${schema.name}.${association.name}`) >= 0
            ? this.renderRefTree(`${parentKey}.${schema.name}`, association.name, association.refName)
            : (
              <TreeNode
                isLeaf
                key={`ref.${parentKey}.${schema.name}.${association.name}`}
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