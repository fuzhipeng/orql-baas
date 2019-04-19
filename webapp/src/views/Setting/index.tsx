import React from 'react';
import {RouteComponentProps} from 'react-router';
import {inject, observer} from 'mobx-react';
import AppStore from '../../stores/AppStore';
import DatabaseForm from './DatabaseForm';
import {Button, message} from 'antd';
import {httpPut} from '../../utils/network';

const SettingTitle = (props: { selected: boolean, name: string, onClick: () => void }) => {
  return (
    <div
      onClick={props.onClick}
      style={{
        color: props.selected ? '#1890ff' : '#314659',
        padding: '5px 20px',
        cursor: 'pointer'
      }}>
      <div style={{fontSize: 12}}>{props.name}</div>
    </div>
  )
}

interface IProps extends RouteComponentProps{
  appStore: AppStore;
}

interface IState {
  setting: string;
}

@inject('appStore')
@observer
class SettingView extends React.Component<IProps, IState> {
  state: IState = {
    setting: '数据库'
  }
  private databaseForm?: any;
  componentDidMount() {
    this.props.appStore.setAppMenus([]);
  }
  handleSaveDatabase = () => {
    const {form} = this.databaseForm.props;
    form.validateFields(async (err, values) => {
      if (err) return;
      const {dialect, ...connection} = values;
      const res = await httpPut('/_edit/config/orql', {dialect, connection});
      if (res.success) {
        message.success('保存成功');
      } else {
        message.error('保存失败');
      }
    });
  }
  renderSetting() {
    const {setting} = this.state;
    switch (setting) {
      case '数据库':
        return (
          <div>
            <DatabaseForm wrappedComponentRef={ref => this.databaseForm = ref} />
            <Button onClick={this.handleSaveDatabase} type="primary">保存</Button>
          </div>
        );
    }
  }
  render() {
    const {setting} = this.state;
    return (
      <div style={{display: 'flex'}}>
        <div style={{
          width: 200,
          marginTop: 5,
          height: '100%',
          backgroundColor: '#fefefe',
          borderRight: '1px solid #ebedf0'
        }}>
          <SettingTitle selected={setting == '数据库'} name="数据库" onClick={() => this.setState({setting: '数据库'})}/>
        </div>
        <div style={{flex: 1}}>
          {this.renderSetting()}
        </div>
      </div>
    );
  }
}

export default SettingView;