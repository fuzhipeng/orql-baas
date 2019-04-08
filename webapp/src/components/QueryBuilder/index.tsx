import React from 'react';
import LogicGroupView, {LogicGroup} from './LogicGroupView';
import {Schema} from '../../beans';
import {Rule} from './RuleView';
import Parser from 'orql-parser';
import {OrqlExp, OrqlLogicExp, OrqlNestExp, OrqlLogicOp, OrqlCompareExp, OrqlParam, OrqlColumn, OrqlValue, OrqlNull} from 'orql-parser/lib/OrqlNode';

function expToGroup(exp: string): LogicGroup {
  const node = Parser.parseExp(exp);
  const result = expNodeToGroup(node);
  if ('op' in result) {
    return {logic: '&&', rules: [result], groups: []};
  }
  return result as LogicGroup;
}

function expNodeToGroup(node: OrqlExp): LogicGroup | Rule {
  if (node instanceof OrqlLogicExp) {
    const logic = OrqlLogicOp.And ? '&&' : '||';
    const group: LogicGroup = {logic, groups: [], rules: []};
    const left = expNodeToGroup(node.left);
    const right = expNodeToGroup(node.right);
    if ('op' in left) {
      group.rules.push(left);
    } else if ('logic' in left) {
      group.groups.push(left);
    }
    if ('op' in right) {
      group.rules.push(right);
    } else if ('logic' in right) {
      group.groups.push(right);
    }
  } else if (node instanceof OrqlNestExp) {
    const group: LogicGroup = {logic: '&&', groups: [], rules: []};
    const child = expNodeToGroup(node.exp);
    if ('op' in child) {
      group.rules.push(child);
    } else if ('logic' in child) {
      group.groups.push(child);
    }
    return group;
  } else if (node instanceof OrqlCompareExp) {
    const rule: Rule = {left: node.left.name, op: node.op};
    if (node.right instanceof OrqlParam) {
      rule.right = '$' + node.right.name;
    } else if (node.right instanceof OrqlColumn) {
      rule.right = node.right.name;
    } else if (node.right instanceof OrqlValue) {
      if (node.right instanceof OrqlNull) {
        rule.right = 'null';
      } else {
        rule.right = node.right.value;
      }
    }
    return rule;
  }
  throw new Error('');
}

interface QueryBuilderState {
  group: LogicGroup;
}

export interface QueryBuilderProps {
  schema: Schema;
  defaultExp?: string;
  onChange: (exp: string) => void;
}

class QueryBuilder extends React.Component<QueryBuilderProps, QueryBuilderState> {
  state: QueryBuilderState = {
    group: this.props.defaultExp
      ? expToGroup(this.props.defaultExp)
      : {logic: '&&', groups: [], rules: []}
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