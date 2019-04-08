import React from 'react';
import {Button} from 'antd';
import RuleView, {Rule} from './RuleView';
import {Schema} from '../../beans';

export type Logic = 'and' | 'or';

const LogicButton = (props: {logic: Logic, onChange: (logic: Logic) => void}) => (
  <div style={{display: 'inline-block'}}>
    <Button
      onClick={() => props.onChange('and')}
      type={props.logic == 'and' ? 'primary' : 'default'}
      size="small">
      and
    </Button>
    <Button
      onClick={() => props.onChange('or')}
      type={props.logic == 'or' ? 'primary' : 'default'}
      size="small">
      or
    </Button>
  </div>
)

export interface LogicGroup {
  logic: Logic;
  groups: LogicGroup[];
  rules: Rule[];
}

export interface LogicGroupProps {
  path: string;
  schema: Schema;
  group: LogicGroup;
  onChange: (group: LogicGroup) => void;
  onRemove?: () => void;
  root: boolean;
}

class LogicGroupView extends React.Component<LogicGroupProps> {
  private handleAddRule = () => {
    const {group, onChange} = this.props;
    const newRule: Rule = {op: '=='};
    onChange({...group, rules: [...group.rules, newRule]});
  }
  private handleAddGroup = () => {
    const {group, onChange} = this.props;
    const newGroup: LogicGroup = {logic: 'and', rules: [], groups: []};
    onChange({...group, groups: [...group.groups, newGroup]});
  }
  private handleChangeChildGroup = (child: LogicGroup, index: number) => {
    const {group, onChange} = this.props;
    onChange({...group,
      groups: group.groups.map((group, _index) => _index == index ? {...child} : group)});
  }
  private handleRemoveRule = (index: number) => {
    const {group, onChange} = this.props;
    group.rules.splice(index, 1);
    onChange({...group});
  }
  private handleRemoveChildGroup = (index: number) => {
    const {group, onChange} = this.props;
    group.groups.splice(index, 1);
    onChange({...group});
  }
  private handleChangeChildRule = (child: Rule, index: number) => {
    const {group, onChange} = this.props;
    onChange({...group,
      rules: group.rules.map((rule, _index) => _index == index ? {...child} : rule)});
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
    const {schema, group, onChange, path, onRemove, root} = this.props;
    const {logic, rules, groups} = group;
    return (
      <div id={path}>
        <LogicButton logic={logic} onChange={logic => onChange({...group, logic})}/>
        <div style={{marginLeft: 50, display: 'inline-block'}}>
          <Button size="small" onClick={this.handleAddRule}>添加规则</Button>
          <Button size="small" onClick={this.handleAddGroup}>添加分组</Button>
          {!root && (
            <Button size="small" type="danger" onClick={onRemove}>删除</Button>
          )}
        </div>
        <div style={{marginLeft: 20}}>
          {group.rules.map((rule, index) => (
            <RuleView
              index={index}
              path={this.getRulePath(index)}
              schema={schema}
              key={index}
              onChange={child => this.handleChangeChildRule(child, index)}
              onRemove={() => this.handleRemoveRule(index)}
              rule={rule} />
          ))}
        </div>
        <div style={{marginLeft: 20}}>
          {groups.map((group, index) => (
            <LogicGroupView
              key={index}
              group={group}
              schema={schema}
              root={false}
              onRemove={() => this.handleRemoveChildGroup(index)}
              path={this.getGroupPath(index)}
              onChange={child => this.handleChangeChildGroup(child, index)}/>
          ))}
        </div>
      </div>
    );
  }
}

export default LogicGroupView;