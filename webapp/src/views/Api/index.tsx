import React from 'react';
import {RouteComponentProps} from 'react-router-dom';
import {inject, observer} from 'mobx-react';
import AppStore from '../../stores/AppStore';
import ApiForm from './ApiForm';
import SchemaStore from '../../stores/SchemaStore';
import {Modal} from 'antd';
import QueryBuilder from '../../components/QueryBuilder';

interface IProps extends RouteComponentProps{
  appStore: AppStore;
  schemaStore: SchemaStore;
}

interface IState {
  showDialog: 'createApi' | 'none';
}

@inject('appStore', 'schemaStore')
@observer
class ApiView extends React.Component<IProps, IState> {
  private menus = [{
    label: '新建',
    onClick: () => this.setState({
      showDialog: 'createApi'
    })
  }, {
    label: '编辑',
    onClick: () => console.log('test')
  }, {
    label: '删除',
    onClick: () => console.log('xxx')
  }];
  private createApiForm?: any;
  state: IState = {
    showDialog: 'none'
  }
  async componentDidMount() {
    const {appStore, schemaStore} = this.props;
    appStore.setAppMenus(this.menus);
    await schemaStore.load();
  }
  handleAddApi = () => {
    const {form} = this.createApiForm.props;
    form.validateFields(async (err, values) => {
      if (err) return;
      this.setState({
        showDialog: 'none'
      });
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
  render() {
    return (
      <div>
        <QueryBuilder />
        {this.renderCreateApiForm()}
      </div>
    );
  }
}

export default ApiView;