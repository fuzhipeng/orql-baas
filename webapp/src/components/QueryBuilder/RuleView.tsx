import React from 'react';
import {Button, Input, Select} from 'antd';
import {RuleOps} from '../../config';
import {Schema} from '../../beans';

export interface Rule {
  left?: string;
  op?: string;
  right?: string;
}

export interface RuleProps {
  path: string;
  rule: Rule;
  index: number;
  schema: Schema;
  onRemove: () => void;
  onChange: (rule: Rule) => void;
}

export class RuleView extends React.Component<RuleProps> {
  render() {
    const {path, rule, index, schema, onRemove, onChange} = this.props;
    return (
      <div style={{padding: 2}}>
        <span style={{marginRight: 10}}>规则{index + 1}</span>
        <Select<string>
          value={rule.left}
          onSelect={left => onChange({...rule, left})}
          size="small"
          style={{width: 100}}>
          {schema.columns.map(column => (
            <Select.Option key={column.name} value={column.name}>{column.name}</Select.Option>
          ))}
        </Select>
        <Select
          size="small"
          value={rule.op}
          onSelect={op => onChange({...rule, op})}
          style={{width: 60, margin: '0 10px'}}
          placeholder="op">
          {RuleOps.map(op => (
            <Select.Option key={op} value={op}>{op}</Select.Option>
          ))}
        </Select>
        <Input
          value={rule.right}
          onChange={e => onChange({...rule, right: e.target.value})}
          size="small"
          style={{width: 100}} />
        <Button size="small" type="danger" style={{marginLeft: 10}} onClick={onRemove}>删除</Button>
      </div>
    );
  }
}

export default RuleView;