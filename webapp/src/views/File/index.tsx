import React from 'react';
import {RouteComponentProps} from 'react-router-dom';
import {inject, observer} from 'mobx-react';
import AppStore from '../../stores/AppStore';

interface IProps extends RouteComponentProps{
  appStore: AppStore;
}

@inject('appStore')
@observer
class FileView extends React.Component<IProps> {
  private menus = [{
    label: '上传',
    onClick: () => console.log('uyyy')
  }];
  componentDidMount() {
    this.props.appStore.setAppMenus(this.menus);
  }
  render() {
    return (
      <div>文件</div>
    );
  }
}

export default FileView;