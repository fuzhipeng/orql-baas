import React from 'react';
import {Button, Radio} from 'antd';
import RuleView, {Rule} from './RuleView';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

export type Logic = 'and' | 'or';

const LogicButton = (props: {logic: Logic, onChange: (logic: Logic) => void}) => (
  <RadioGroup
    value={props.logic}
    size="small"
    buttonStyle="solid"
    onChange={e => props.onChange(e.target.value)}>
    <RadioButton value="and">and</RadioButton>
    <RadioButton value="or">or</RadioButton>
  </RadioGroup>
)

export interface LogicGroup {
  logic: Logic;
  groups: LogicGroup[];
  rules: Rule[];
}

export interface LogicGroupProps {
  path: string;
  group: LogicGroup;
  onChange: (group: LogicGroup) => void;
}

class LogicGroupView extends React.Component<LogicGroupProps> {
  private handleAddRule = () => {
    const {group, onChange} = this.props;
    onChange({...group, rules: [...group.rules, {}]});
  }
  private handleAddGroup = () => {
    const {group, onChange} = this.props;
    const newGroup: LogicGroup = {logic: 'and', rules: [], groups: []};
    onChange({...group, groups: [...group.groups, newGroup]});
  }
  private handleChangeChildGroup = (child: LogicGroup, index: number) => {
    const {group, onChange} = this.props;
    onChange({...group, groups: group.groups
        .map((group, _index) =>
          _index == index ? {...child} : group)});
  }
  private getRulePath = (index: number) => {
    const {path} = this.props;
    return `${path}-rule-${index}`;
  }
  private getGroupPath = (index: number) => {
    const {path} = this.props;
    return `${path}-${index}`;
  }
  render() {
    const {group, onChange, path} = this.props;
    const {logic, rules, groups} = group;
    return (
      <div id={path}>
        <LogicButton logic={logic} onChange={logic => onChange({...group, logic})}/>
        <div style={{marginLeft: 50, display: 'inline-block'}}>
          <Button size="small" onClick={this.handleAddRule}>添加规则</Button>
          <Button size="small" onClick={this.handleAddGroup}>添加分组</Button>
        </div>
        <div style={{marginLeft: 20}}>
          {group.rules.map((rule, index) => (
            <RuleView index={index} path={this.getRulePath(index)} key={index} rule={rule} />
          ))}
        </div>
        <div style={{marginLeft: 20}}>
          {groups.map((group, index) => (
            <LogicGroupView
              key={index}
              group={group}
              path={this.getGroupPath(index)}
              onChange={child => this.handleChangeChildGroup(child, index)}/>
          ))}
        </div>
      </div>
    );
  }
}

export default LogicGroupView;