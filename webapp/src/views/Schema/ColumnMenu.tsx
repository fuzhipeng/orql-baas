import {Menu} from 'antd';
import React from 'react';

const ColumnMenuText = (props: {text: string}) => (
  <div style={{fontSize: 14}}>{props.text}</div>
)

export interface ColumnMenuProps {
  onClick: (key: string) => void;
}

const ColumnMenu = (props: ColumnMenuProps) => (
  <Menu>
    <Menu.Item key="update" onClick={() => props.onClick('update')}>
      <ColumnMenuText text="修改" />
    </Menu.Item>
    <Menu.Item key="delete" onClick={() => props.onClick('delete')}>
      <ColumnMenuText text="删除" />
    </Menu.Item>
    <Menu.Divider />
    <Menu.Item key="aa">
      <ColumnMenuText text="升序" />
    </Menu.Item>
    <Menu.Item key="bb">
      <ColumnMenuText text="降序"/>
    </Menu.Item>
  </Menu>
);

export default ColumnMenu;