import React from 'react';
import LogicGroupView, {LogicGroup} from './LogicGroupView';
import {Schema} from '../../beans';

interface QueryBuilderState {
  group: LogicGroup;
}

export interface QueryBuilderProps {
  schema: Schema;
}

class QueryBuilder extends React.Component<QueryBuilderProps, QueryBuilderState> {
  state: QueryBuilderState = {
    group: {
      logic: 'and',
      groups: [],
      rules: []
    }
  }
  private handleChange = (group: LogicGroup) => {
    console.log(JSON.stringify(group));
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