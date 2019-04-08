import React from 'react';
import {RouteComponentProps} from 'react-router-dom';
import {inject, observer} from 'mobx-react';
import AppStore from '../../stores/AppStore';
import ApiForm from './ApiForm';
import SchemaStore from '../../stores/SchemaStore';
import {message, Modal} from 'antd';
import ApiStore from '../../stores/ApiStore';
import GroupForm from './GroupForm';

interface IProps extends RouteComponentProps{
  appStore: AppStore;
  schemaStore: SchemaStore;
  apiStore: ApiStore;
}

const GroupTitle = (props: {selected: boolean, name: string, onClick: () => void}) => {
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

interface IState {
  showDialog: 'createApi' | 'createGroup' | 'updateGroup' | 'none';
  currentGroupName?: string;
}

@inject('appStore', 'schemaStore', 'apiStore')
@observer
class ApiView extends React.Component<IProps, IState> {
  private menus = [{
    label: '新建api',
    onClick: () => this.setState({
      showDialog: 'createApi'
    })
  }, {
    label: '编辑api',
    onClick: () => console.log('xxxaaa')
  }, {
    label: '删除api',
    onClick: () => console.log('sss')
  }, {
    label: '新建组',
    onClick: () => this.setState({
      showDialog: 'createGroup'
    })
  }, {
    label: '编辑组',
    onClick: () => {
      const {currentGroupName} = this.state;
      if(!currentGroupName) {
        Modal.error({
          title: '错误',
          content: '无法编辑默认分组'
        });
        return;
      }
      this.setState({
        showDialog: 'updateGroup'
      });
    }
  }, {
    label: '删除组',
    onClick: () => {
      const {currentGroupName} = this.state;
      if (!currentGroupName) {
        Modal.error({
          title: '错误',
          content: '无法删除默认分组'
        });
        return;
      }
      Modal.confirm({
        title: '删除分组',
        content: `确定删除${currentGroupName}分组`,
        onOk: () => this.handleRemoveGroup(currentGroupName)
      });
    }
  }];
  private createApiForm?: any;
  private createGroupForm?: any;
  private updateGroupForm?: any;
  state: IState = {
    showDialog: 'none'
  }
  async componentDidMount() {
    const {appStore, schemaStore, apiStore} = this.props;
    appStore.setAppMenus(this.menus);
    await schemaStore.load();
    await apiStore.load();
  }
  handleAddApi = () => {
    const {form} = this.createApiForm.props;
    form.validateFields(async (err, values) => {
      if (err) return;
      const {apiStore} = this.props;
      const {currentGroupName} = this.state;
      const {url, comment, orql} = values;
      await apiStore.addApi({url, comment, orql, group: currentGroupName});
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
  renderCreateApiForm() {
    return (
      <Modal
        title="添加api"
        visible={this.state.showDialog == 'createApi'}
        okText="确定"
        cancelText="取消"
        width={800}
        style={{top: 20}}
        onOk={this.handleAddApi}
        onCancel={() => this.setState({showDialog: 'none'})}>
        <ApiForm
          schemas={this.props.schemaStore.schemas}
          wrappedComponentRef={ref => this.createApiForm = ref} />
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
    if(!currentGroupName) return;
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
  render() {
    const {apiStore: {groups}} = this.props;
    const {currentGroupName} = this.state;
    return (
      <div style={{display: 'flex'}}>
        {this.renderCreateApiForm()}
        {this.renderCreateGroupForm()}
        {this.renderUpdateGroupForm()}
        <div style={{width: 200, marginTop: 5, height: '100%', backgroundColor: '#fefefe', borderRight: '1px solid #ebedf0'}}>
          <GroupTitle
            selected={currentGroupName == undefined}
            name='默认'
            onClick={() => this.setState({currentGroupName: undefined})}/>
          {groups.map((group, index) => (
            <GroupTitle
              key={index}
              selected={group == currentGroupName}
              name={group}
              onClick={() => this.setState({currentGroupName: group})}/>
          ))}
        </div>
      </div>
    );
  }
}

export default ApiView;