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
      <div style={{display: 'flex'}}>

        <div style={{
          width: 200,
          marginTop: 5,
          height: '100%',
          backgroundColor: '#fefefe',
          borderRight: '1px solid #ebedf0'
        }}>
        </div>
        <div style={{flex: 1}}>
        </div>
      </div>
    );
  }
}

export default SettingView;