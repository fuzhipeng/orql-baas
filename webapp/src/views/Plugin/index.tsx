import React from 'react';
import {RouteComponentProps} from 'react-router-dom';
import {inject, observer} from 'mobx-react';
import AppStore from '../../stores/AppStore';
import {Modal} from 'antd';
import ApiStore from '../../stores/ApiStore';
import PluginForm from './PluginForm';
import PluginStore from '../../stores/PluginStore';
import {Api, PluginConfig} from '../../beans';

const PluginTitle = (props: { selected: boolean, config: PluginConfig, onClick: () => void }) => {
  return (
    <div
      onClick={props.onClick}
      style={{
        color: props.selected ? '#1890ff' : '#314659',
        padding: '5px 20px',
        cursor: 'pointer'
      }}>
      <div style={{fontSize: 12}}>{props.config.name} {props.config.comment}</div>
      <div style={{fontSize: 10}}>{props.config.matchType} {props.config.matchValue}</div>
    </div>
  )
}

interface IProps extends RouteComponentProps{
  appStore: AppStore;
  apiStore: ApiStore;
  pluginStore: PluginStore;
}

type ShowDialog = 'createPlugin' | 'updatePlugin' | 'none';

interface IState {
  showDialog: ShowDialog;
  currentPluginIndex?: number;
}

@inject('appStore', 'apiStore', 'pluginStore')
@observer
class PluginView extends React.Component<IProps, IState> {
  private menus = [{
    label: '添加',
    onClick: () => this.setState({
      showDialog: 'createPlugin'
    })
  }, {
    label: '编辑',
    onClick: () => this.setState({
      showDialog: 'updatePlugin'
    })
  }, {
    label: '删除',
    onClick: () => {
      const {currentPluginIndex} = this.state;
      if (currentPluginIndex == undefined) return;
      Modal.confirm({
        title: '删除插件',
        content: '确定删除插件',
        onOk: () => this.handleRemovePlugin(currentPluginIndex)
      })
    }
  }];
  state: IState = {
    showDialog: 'none'
  }
  private createPluginForm?: any;
  private updatePluginForm?: any;
  async componentDidMount() {
    const {appStore, pluginStore, apiStore} = this.props;
    appStore.setAppMenus(this.menus);
    await apiStore.load();
    await pluginStore.load();
    if (pluginStore.configs.length > 0) {
      this.setState({
        currentPluginIndex: 0
      });
    }
  }
  private handleCreatePlugin = () => {
    const {form} = this.createPluginForm.props;
    form.validateFields(async (err, values) => {
      if (err) return;
      const {pluginStore} = this.props;
      const {name, matchType, matchValue, comment, ...options} = values;
      for (const key in options) {
        options[key.substr(1)] = options[key];
        delete options[key];
      }
      await pluginStore.addConfig({name, matchType, matchValue, comment, options: JSON.stringify(options)});
      this.setState({
        showDialog: 'none'
      });
    });
  }
  private handleUpdatePlugin = () => {
    const {form} = this.updatePluginForm.props;
    form.validateFields(async (err, values) => {
      if (err) return;
      const {pluginStore} = this.props;
      const {currentPluginIndex} = this.state;
      const {name, matchType, matchValue, comment, ...options} = values;
      for (const key in options) {
        options[key.substr(1)] = options[key];
        delete options[key];
      }
      await pluginStore.updateConfig(currentPluginIndex!, {name, matchType, matchValue, comment, options: JSON.stringify(options)});
      this.setState({
        showDialog: 'none'
      });
    });
  }
  private handleRemovePlugin = async (index: number) => {
    const {pluginStore} = this.props;
    await pluginStore.removeConfig(index);
    this.setState({
      currentPluginIndex: undefined
    });
  }
  renderCreatePluginDialog() {
    const {apiStore: {groups}, pluginStore: {plugins}} = this.props;
    const {showDialog} = this.state;
    return (
      <Modal
        title="新建插件"
        okText="确定"
        cancelText="取消"
        destroyOnClose={true}
        onCancel={() => this.setState({showDialog: 'none'})}
        onOk={this.handleCreatePlugin}
        visible={showDialog == 'createPlugin'}>
        <PluginForm
          wrappedComponentRef={ref => this.createPluginForm = ref}
          groups={groups}
          plugins={plugins} />
      </Modal>
    );
  }
  renderUpdatePluginDialog() {
    const {apiStore: {groups}, pluginStore: {plugins, configs}} = this.props;
    const {showDialog, currentPluginIndex} = this.state;
    if (currentPluginIndex == undefined) return;
    const config = configs[currentPluginIndex];
    return (
      <Modal
        title="新建插件"
        okText="确定"
        cancelText="取消"
        destroyOnClose={true}
        onCancel={() => this.setState({showDialog: 'none'})}
        onOk={this.handleUpdatePlugin}
        visible={showDialog == 'updatePlugin'}>
        <PluginForm
          wrappedComponentRef={ref => this.updatePluginForm = ref}
          config={config}
          groups={groups}
          plugins={plugins} />
      </Modal>
    );
  }
  renderPlugin() {
    const {pluginStore: {configs}} = this.props;
    const {currentPluginIndex} = this.state;
    if (currentPluginIndex == undefined) return;
    const config = configs[currentPluginIndex];
    return JSON.stringify(config, null, 2);
  }
  render() {
    const {pluginStore: {configs}} = this.props;
    const {currentPluginIndex} = this.state;
    return (
      <div style={{display: 'flex'}}>
        {this.renderCreatePluginDialog()}
        {this.renderUpdatePluginDialog()}
        <div style={{
          width: 200,
          marginTop: 5,
          height: '100%',
          backgroundColor: '#fefefe',
          borderRight: '1px solid #ebedf0'
        }}>
          {configs.map((config, index) => (
            <PluginTitle key={index} selected={index == currentPluginIndex} onClick={() => this.setState({currentPluginIndex: index})} config={config} />
          ))}
        </div>
        <div style={{flex: 1}}>
          {this.renderPlugin()}
        </div>
      </div>
    );
  }
}

export default PluginView;