import React from 'react';
import {RouteComponentProps} from 'react-router-dom';
import {inject, observer} from 'mobx-react';
import AppStore from '../../stores/AppStore';
import OrqlApiForm from './OrqlApiForm';
import SchemaStore from '../../stores/SchemaStore';
import {Button, Empty, message, Modal, Table} from 'antd';
import ApiStore from '../../stores/ApiStore';
import GroupForm from './GroupForm';
import {Api} from '../../beans';
import UrlTestForm from './UrlTestForm';
import {submitUrl} from '../../utils/network';
import FunApiForm from './FunApiForm';

interface IProps extends RouteComponentProps {
  appStore: AppStore;
  schemaStore: SchemaStore;
  apiStore: ApiStore;
}

const GroupTitle = (props: { selected: boolean, name: string, onClick: () => void }) => {
  return (
    <div
      onClick={props.onClick}
      style={{
        color: props.selected ? '#1890ff' : '#314659',
        backgroundColor: props.selected ? '#e6f7ff' : '#fff',
        borderRight: props.selected ? '3px solid #1890ff' : undefined,
        padding: '5px 20px',
        fontSize: 14,
        cursor: 'pointer'
      }}
    >{props.name}</div>
  )
}

const ApiTitle = (props: { selected: boolean, api: Api, onClick: () => void }) => {
  return (
    <div
      onClick={props.onClick}
      style={{
        color: props.selected ? '#1890ff' : '#314659',
        padding: '5px 20px',
        cursor: 'pointer'
      }}>
      <div style={{fontSize: 12}}>{props.api.url}</div>
      <div style={{fontSize: 10}}>{props.api.comment}</div>
    </div>
  )
}

type ShowDialog = 'createOrqlApi' |
  'createFunApi' |
  'createGroup' |
  'updateGroup' |
  'updateOrqlApi' |
  'updateFunApi' |
  'none';

interface IState {
  showDialog: ShowDialog;
  currentGroupName?: string;
  currentApiUrl?: string;
  submitResult?: any;
}

@inject('appStore', 'schemaStore', 'apiStore')
@observer
class ApiView extends React.Component<IProps, IState> {
  private menus = [{
    label: '新建组',
    onClick: () => this.setState({
      showDialog: 'createGroup'
    })
  }, {
    label: '编辑组',
    onClick: () => {
      const {currentGroupName} = this.state;
      if (!currentGroupName) return;
      this.setState({
        showDialog: 'updateGroup'
      });
    }
  }, {
    label: '删除组',
    onClick: () => {
      const {currentGroupName} = this.state;
      if (!currentGroupName) return;
      Modal.confirm({
        title: '删除分组',
        content: `确定删除${currentGroupName}分组`,
        onOk: () => this.handleRemoveGroup(currentGroupName)
      });
    }
  }, {
    label: '新建api',
    subMenus: [{
      label: 'orql',
      onClick: () => this.setState({
        showDialog: 'createOrqlApi'
      })
    }, {
      label: 'fun',
      onClick: () => this.setState({
        showDialog: 'createFunApi'
      })
    }]
  }, {
    label: '编辑api',
    onClick: () => {
      const {apiStore: {apis}} = this.props;
      const {currentGroupName, currentApiUrl} = this.state;
      if (!currentGroupName || !currentApiUrl) return;
      const api = apis.find(api => api.url == currentApiUrl)!;
      this.setState({
        showDialog: api.orql ? 'updateOrqlApi' : 'updateFunApi'
      });
    }
  }, {
    label: '删除api',
    onClick: () => {
      const {currentApiUrl} = this.state;
      if (!currentApiUrl) return;
      Modal.confirm({
        title: '删除api',
        content: `确定删除${currentApiUrl}`,
        onOk: () => this.handleRemoveApi(currentApiUrl)
      });
    }
  }];
  private createOrqlApiForm?: any;
  private createGroupForm?: any;
  private updateGroupForm?: any;
  private updateOrqlApiForm?: any;
  private createFunApiForm?: any;
  private updateFunApiForm?: any;
  private urlTestForm?: any;
  state: IState = {
    showDialog: 'none'
  }

  async componentDidMount() {
    const {appStore, schemaStore, apiStore} = this.props;
    appStore.setAppMenus(this.menus);
    await schemaStore.load();
    await apiStore.load();
    if (apiStore.groups.length > 0) {
      this.setState({
        currentGroupName: apiStore.groups[0]
      });
    }
  }

  handleAddOrqlApi = () => {
    const {form} = this.createOrqlApiForm.props;
    form.validateFields(async (err, values) => {
      if (err) return;
      const {apiStore} = this.props;
      const {url, comment, orql, group} = values;
      await apiStore.addApi({url, comment, orql, group});
      this.setState({
        showDialog: 'none'
      });
    });
  }

  handleUpdateOrqlApi = () => {
    const {form} = this.updateOrqlApiForm.props;
    form.validateFields(async (err, values) => {
      if (err) return;
      const {apiStore} = this.props;
      const {currentApiUrl} = this.state;
      const {url, comment, orql, group} = values;
      await apiStore.updateApi(currentApiUrl!, {url, comment, orql, group});
      this.setState({
        showDialog: 'none',
        currentApiUrl: url
      });
    });
  }

  handleAddFunApi = () => {
    const {form} = this.createFunApiForm.props;
    form.validateFields(async (err, values) => {
      if (err) return;
      const {apiStore} = this.props;
      const {url, comment, fun, group, ...options} = values;
      for (const key in options) {
        options[key.substr(1)] = options[key];
        delete options[key];
      }
      await apiStore.addApi({url, comment, fun, group, options: JSON.stringify(options)});
      this.setState({
        showDialog: 'none'
      });
    });
  }

  handleUpdateFunApi = () => {
    const {form} = this.updateFunApiForm.props;
    form.validateFields(async (err, values) => {
      if (err) return;
      const {apiStore} = this.props;
      const {currentApiUrl} = this.state;
      const {url, comment, fun, group, ...options} = values;
      for (const key in options) {
        options[key.substr(1)] = options[key];
        delete options[key];
      }
      await apiStore.updateApi(currentApiUrl!, {url, comment, fun, group, options: JSON.stringify(options)});
      this.setState({
        showDialog: 'none'
      });
    });
  }

  handleAddGroup = () => {
    const {form} = this.createGroupForm.props;
    form.validateFields(async (err, values) => {
      if (err) return;
      const {apiStore} = this.props;
      const {name} = values;
      await apiStore.addGroup(name);
      this.setState({
        showDialog: 'none',
        currentGroupName: name
      });
    });
  }
  handleUpdateGroup = () => {
    const {form} = this.updateGroupForm.props;
    form.validateFields(async (err, values) => {
      if (err) return;
      const {currentGroupName} = this.state;
      const {apiStore} = this.props;
      const {name} = values;
      if (name == currentGroupName) return;
      await apiStore.updateGroup(currentGroupName!, name);
      this.setState({
        showDialog: 'none',
        currentGroupName: name
      });
    });
  }
  handleRemoveGroup = async (name: string) => {
    const {apiStore} = this.props;
    if (apiStore.groupHasApi(name)) {
      message.error(`分组${name}有api，无法删除`);
      return;
    }
    await apiStore.removeGroup(name);
    this.setState({
      currentGroupName: undefined
    });
  }
  handleRemoveApi = async (url: string) => {
    const {apiStore} = this.props;
    await apiStore.removeApi(url);
    this.setState({
      currentApiUrl: undefined
    });
  }

  handleSubmitUrl = () => {
    const {form} = this.urlTestForm.props;
    form.validateFields(async (err, values) => {
      if (err) return;
      const {method, url, data} = values;
      console.log(method, url, data);
      this.setState({
        submitResult: undefined
      });
      const result = await submitUrl(method, url, data ? JSON.parse(data): null);
      console.log('result', result);
      this.setState({
        submitResult: result
      });
    });
  }

  renderCreateOrqlApiForm() {
    const {apiStore: {groups}} = this.props;
    const {currentGroupName} = this.state;
    if (!currentGroupName) return;
    return (
      <Modal
        title="添加api"
        visible={this.state.showDialog == 'createOrqlApi'}
        okText="确定"
        cancelText="取消"
        width={800}
        style={{top: 20}}
        onOk={this.handleAddOrqlApi}
        onCancel={() => this.setState({showDialog: 'none'})}>
        <OrqlApiForm
          groups={groups}
          currentGroup={currentGroupName}
          schemas={this.props.schemaStore.schemas}
          wrappedComponentRef={ref => this.createOrqlApiForm = ref}/>
      </Modal>
    );
  }

  renderUpdateOrqlApiForm() {
    const {apiStore: {groups, apis}} = this.props;
    const {currentGroupName, currentApiUrl} = this.state;
    if (!currentGroupName || !currentApiUrl) return;
    const api = apis.find(api => api.url == currentApiUrl);
    return (
      <Modal
        title="编辑api"
        visible={this.state.showDialog == 'updateOrqlApi'}
        okText="确定"
        cancelText="取消"
        width={800}
        style={{top: 20}}
        onOk={this.handleUpdateOrqlApi}
        onCancel={() => this.setState({showDialog: 'none'})}>
        <OrqlApiForm
          api={api}
          groups={groups}
          currentGroup={currentGroupName}
          schemas={this.props.schemaStore.schemas}
          wrappedComponentRef={ref => this.updateOrqlApiForm = ref}/>
      </Modal>
    );
  }

  renderCreateFunApiForm() {
    const {apiStore: {groups, funs}} = this.props;
    const {currentGroupName} = this.state;
    if (!currentGroupName) return;
    return (
      <Modal
        title="添加fun api"
        visible={this.state.showDialog == 'createFunApi'}
        okText="确定"
        cancelText="取消"
        width={800}
        style={{top: 20}}
        onOk={this.handleAddFunApi}
        onCancel={() => this.setState({showDialog: 'none'})}>
        <FunApiForm
          groups={groups}
          currentGroup={currentGroupName}
          funs={funs}
          wrappedComponentRef={ref => this.createFunApiForm = ref}/>
      </Modal>
    );
  }

  renderUpdateFunApiForm() {
    const {apiStore: {groups, funs, apis}} = this.props;
    const {currentGroupName, currentApiUrl} = this.state;
    if (!currentGroupName || !currentApiUrl) return;
    const api = apis.find(api => api.url == currentApiUrl)!;
    return (
      <Modal
        title="编辑fun api"
        visible={this.state.showDialog == 'updateFunApi'}
        okText="确定"
        cancelText="取消"
        width={800}
        style={{top: 20}}
        onOk={this.handleUpdateFunApi}
        onCancel={() => this.setState({showDialog: 'none'})}>
        <FunApiForm
          groups={groups}
          currentGroup={currentGroupName}
          api={api}
          funs={funs}
          wrappedComponentRef={ref => this.updateFunApiForm = ref}/>
      </Modal>
    );
  }

  renderCreateGroupForm() {
    return (
      <Modal
        title="添加分组"
        visible={this.state.showDialog == 'createGroup'}
        okText="确定"
        cancelText="取消"
        onOk={this.handleAddGroup}
        onCancel={() => this.setState({showDialog: 'none'})}>
        <GroupForm wrappedComponentRef={ref => this.createGroupForm = ref}/>
      </Modal>
    );
  }

  renderUpdateGroupForm() {
    const {currentGroupName} = this.state;
    if (!currentGroupName) return;
    return (
      <Modal
        title="编辑分组"
        visible={this.state.showDialog == 'updateGroup'}
        okText="确定"
        cancelText="取消"
        onOk={this.handleUpdateGroup}
        onCancel={() => this.setState({showDialog: 'none'})}>
        <GroupForm name={currentGroupName} wrappedComponentRef={ref => this.updateGroupForm = ref}/>
      </Modal>
    );
  }

  renderTest() {
    const {currentApiUrl, submitResult} = this.state;
    if (!currentApiUrl) return;
    const {apiStore: {apis}} = this.props;
    const api = apis.find(api => api.url == currentApiUrl);
    if (!api) return;
    return (
      <div style={{padding: 10}}>
        <p>url: {api.url}</p>
        {api.orql && <p>orql: {api.orql}</p>}
        {api.options && <p>options: {api.options}</p>}
        <p>备注: {api.comment}</p>
        <div style={{marginTop: 20}}>
          <UrlTestForm wrappedComponentRef={ref => this.urlTestForm = ref} api={api}/>
        </div>
        <Button type="primary" onClick={this.handleSubmitUrl}>提交</Button>
        <div style={{marginTop: 20}}>
          {this.renderResult()}
        </div>
      </div>
    );
  }

  renderResult() {
    const {submitResult} = this.state;
    if (!submitResult) return;
    if (submitResult.data instanceof Array && submitResult.data.length > 0) {
      const columns = Object.keys(submitResult.data[0]).map(key => ({
        title: key,
        dataIndex: key,
      }));
      return (
        <Table
          columns={columns}
          dataSource={submitResult.data}
          rowKey={(record, index) => index.toString()}
          pagination={false} />
      );
    }
    return (
      <p>结果: {JSON.stringify(submitResult, null, 2)}</p>
    );
  }

  render() {
    const {apiStore: {groups, apis}} = this.props;
    const {currentGroupName, currentApiUrl} = this.state;
    const groupApi = apis.filter(api => api.group == currentGroupName);
    return (
      <div style={{display: 'flex'}}>
        {this.renderCreateOrqlApiForm()}
        {this.renderUpdateOrqlApiForm()}
        {this.renderCreateFunApiForm()}
        {this.renderUpdateFunApiForm()}
        {this.renderCreateGroupForm()}
        {this.renderUpdateGroupForm()}
        <div style={{
          width: 200,
          marginTop: 5,
          height: '100%',
          backgroundColor: '#fefefe',
          borderRight: '1px solid #ebedf0'
        }}>
          {groups.map((group, index) => (
            <GroupTitle
              key={index}
              selected={group == currentGroupName}
              name={group}
              onClick={() => this.setState({currentGroupName: group})}/>))}
        </div>
        <div style={{
          width: 300,
          marginTop: 5,
          height: '100%',
          backgroundColor: '#fefefe',
          borderRight: '1px solid #ebedf0'
        }}>
          {groupApi.length > 0
            ? groupApi.map(api => (
              <ApiTitle
                key={api.url}
                selected={currentApiUrl == api.url}
                api={api}
                onClick={() => this.setState({currentApiUrl: api.url})}/>
            ))
            : <Empty />}
        </div>
        <div style={{flex: 1}}>
          {this.renderTest()}
        </div>
      </div>
    );
  }
}

export default ApiView;