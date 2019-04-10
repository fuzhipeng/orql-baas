import React from 'react';
import {RouteComponentProps} from 'react-router-dom';
import {inject, observer} from 'mobx-react';
import AppStore from '../../stores/AppStore';
import {Empty} from 'antd';

interface IProps extends RouteComponentProps{
  appStore: AppStore;
}

@inject('appStore')
@observer
class PluginView extends React.Component<IProps> {
  private menus = [{
    label: '添加',
    onClick: () => console.log('添加')
  }, {
    label: '搜索',
    onClick: () => console.log('搜索')
  }];
  componentDidMount() {
    this.props.appStore.setAppMenus(this.menus);
  }
  render() {
    return (
      <div style={{width: '100%', height: '100%'}}>
        <Empty />
      </div>
    );
  }
}

export default PluginView;