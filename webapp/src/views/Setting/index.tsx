import React from 'react';
import {RouteComponentProps} from 'react-router';
import {inject, observer} from 'mobx-react';
import AppStore from '../../stores/AppStore';

interface IProps extends RouteComponentProps{
  appStore: AppStore;
}

@inject('appStore')
@observer
class SettingView extends React.Component<IProps> {
  componentDidMount() {
    this.props.appStore.setAppMenus([]);
  }
  render() {
    return (
      <div>设置</div>
    );
  }
}

export default SettingView;