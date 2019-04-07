import React from 'react';
import LogicGroupView, {LogicGroup} from './LogicGroupView';

interface QueryBuilderState {
  group: LogicGroup;
}

class QueryBuilder extends React.Component<{}, QueryBuilderState> {
  state: QueryBuilderState = {
    group: {
      logic: 'and',
      groups: [],
      rules: []
    }
  }
  render() {
    const {group} = this.state;
    return (
      <div style={{paddingLeft: 20}}>
        <LogicGroupView
          path="group-0"
          group={group}
          onChange={group => this.setState({group})}
        />
      </div>
    );
  }
}

export default QueryBuilder;