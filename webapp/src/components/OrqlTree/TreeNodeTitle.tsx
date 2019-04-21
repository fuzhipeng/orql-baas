import React from 'react';
import {Popover} from 'antd';
import QueryBuilder from '../QueryBuilder';
import {getExpAndOrder} from './util';
import {Schema} from '../../beans';

export interface TreeNodeTitleProps {
  title: string;
  schema: Schema;
  path: string;
  defaultExp?: string;
  defaultOrder?: string;
  onChange: (exp) => void;
  selectAll: boolean;
}

const TreeNodeTitle = (props: TreeNodeTitleProps) => (
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
    {props.title} {props.selectAll && '全选'}
    <span style={{position: 'absolute'}}>{getExpAndOrder(props.defaultExp, props.defaultOrder)}</span>
  </Popover>
)

export default TreeNodeTitle;