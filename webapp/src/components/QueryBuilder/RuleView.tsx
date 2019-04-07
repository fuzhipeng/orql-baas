import React from 'react';
import {Select} from 'antd';

export interface Rule {

}

export interface RuleProps {
  path: string;
  rule: Rule;
  index: number;
}

export class RuleView extends React.Component<RuleProps> {
  render() {
    const {path, index} = this.props;
    return (
      <div style={{padding: 2}}>
        <span style={{marginRight: 10}}>规则{index + 1}</span>
        <Select size="small" style={{width: 100}}>
          <Select.Option value="1">1</Select.Option>
          <Select.Option value="2">2</Select.Option>
        </Select>
        <Select size="small" style={{width: 80, margin: '0px 10px'}} placeholder="op">
          <Select.Option value="1">1</Select.Option>
          <Select.Option value="2">2</Select.Option>
        </Select>
        <Select size="small" style={{width: 100}}>
          <Select.Option value="1">1</Select.Option>
          <Select.Option value="2">2</Select.Option>
        </Select>
      </div>
    );
  }
}

export default RuleView;