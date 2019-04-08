import React from 'react';
import LogicGroupView, {LogicGroup} from './LogicGroupView';
import {Schema} from '../../beans';
import {Rule} from './RuleView';

interface QueryBuilderState {
  group: LogicGroup;
}

export interface QueryBuilderProps {
  schema: Schema;
  onChange: (exp: string) => void;
}

class QueryBuilder extends React.Component<QueryBuilderProps, QueryBuilderState> {
  state: QueryBuilderState = {
    group: {
      logic: 'and',
      groups: [],
      rules: []
    }
  }
  private groupToString = (group: LogicGroup) => {
    const {logic, rules, groups} = group;
    const exps: string[] = [];
    rules.forEach(rule => {
      const exp = this.ruleToString(rule);
      exp && exps.push(exp);
    });
    groups.forEach(child => {
      const exp = this.groupToString(child);
      exp && exps.push( '(' + exp + ')');
    });
    if (exps.length == 0) return '';
    return exps.join(` ${logic} `);
  }
  private ruleToString = (rule: Rule) => {
    const {left, op, right} = rule;
    if (left == undefined || right == undefined) return undefined;
    return `${rule.left} ${rule.op} ${rule.right}`;
  }
  private handleChange = (group: LogicGroup) => {
    const exp = this.groupToString(group);
    this.props.onChange(exp);
    this.setState({
      group
    });
  }
  render() {
    const {schema} = this.props;
    const {group} = this.state;
    return (
      <div style={{paddingLeft: 20}}>
        <LogicGroupView
          path="group-0"
          root={true}
          schema={schema}
          group={group}
          onChange={this.handleChange}
        />
      </div>
    );
  }
}

export default QueryBuilder;