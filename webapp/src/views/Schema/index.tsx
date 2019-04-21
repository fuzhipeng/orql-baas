import React from 'react';
import {RouteComponentProps} from 'react-router-dom';
import {inject, observer} from 'mobx-react';
import AppStore from '../../stores/AppStore';
import {Modal, Table, Icon, Dropdown} from 'antd';
import SchemaStore from '../../stores/SchemaStore';
import {Association, Schema} from '../../beans';
import {ColumnProps} from 'antd/lib/table';
import SchemaForm from './SchemaForm';
import AssociationForm from './AssociationForm';
import ColumnForm from './ColumnForm';
import ColumnMenu from './ColumnMenu';
import {httpGetWithData} from '../../utils/network';

interface IProps extends RouteComponentProps{
  appStore: AppStore;
  schemaStore: SchemaStore;
}

interface IState {
  currentSchemaName?: string;
  currentColumnName?: string;
  currentAssociationName?: string;
  showDialog: 'createSchema' | 'createColumn' | 'createAssociation' | 'updateSchema' | 'updateColumn' | 'updateAssociation' | 'none';
  newAssociation?: Association;
  dataSource: any;
  order?: string;
}

const SchemaTitle = (props: {selected: boolean, name: string, onClick: () => void}) => {
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

@inject('appStore', 'schemaStore')
@observer
class SchemaView extends React.Component<IProps, IState> {
  private menus = [{
    label: '新建',
    onClick: () => this.setState({
      showDialog: 'createSchema'
    })
  }, {
    label: '修改',
    onClick: () => this.setState({
      showDialog: 'updateSchema'
    })
  }, {
    label: '删除',
    onClick: () => {
      const {currentSchemaName} = this.state;
      if (!currentSchemaName) return;
      Modal.confirm({
        title: '删除schema',
        content: `是否删除${currentSchemaName} schema`,
        onOk: () => this.handleDeleteSchema(currentSchemaName)
      });
    }
  }, {
    label: '添加列',
    onClick:() => this.setState({
      showDialog: 'createColumn'
    })
  }, {
    label: '添加关联',
    onClick: () => this.setState({
      showDialog: 'createAssociation',
      newAssociation: {name: '', refName: '', type: ''}
    })
  }];
  private createSchemaForm?: any;
  private updateSchemaForm?: any;
  private createColumnForm?: any;
  private updateColumnForm?: any;
  private createAssociationForm?: any;
  private updateAssociationForm?: any;
  state: IState = {
    showDialog: 'none',
    dataSource: []
  }
  async componentDidMount() {
    const {schemaStore, appStore} = this.props;
    appStore.setAppMenus(this.menus);
    await schemaStore.load();
    if (schemaStore.schemas.length > 0) {
      await this.handleChangeSchema(schemaStore.schemas[0].name);
    }
  }
  private getCurrentSchema = () => {
    const {currentSchemaName} = this.state;
    if (!currentSchemaName) return;
    return this.props.schemaStore.getSchemaByName(currentSchemaName);
  }
  private getCurrentColumn = () => {
    const schema = this.getCurrentSchema();
    if (!schema) return;
    const {currentColumnName} = this.state;
    return schema.columns.find(column => column.name == currentColumnName);
  }
  private getCurrentAssociation = () => {
    const schema = this.getCurrentSchema();
    if (!schema) return;
    const {currentAssociationName} = this.state;
    return schema.associations.find(association => association.name == currentAssociationName);
  }
  handleAddSchema = () => {
    const {form} = this.createSchemaForm.props;
    form.validateFields(async (err, values) => {
      if (err) return;
      const {name, table} = values;
      await this.props.schemaStore.addSchema({name, table, columns: [], associations: []});
      this.setState({
        showDialog: 'none',
        currentSchemaName: name
      });
    });
  }
  handleUpdateSchema = () => {
    const {form} = this.updateSchemaForm.props;
    form.validateFields(async (err, values) => {
      if (err) return;
      const {currentSchemaName} = this.state;
      const {name, table} = values;
      await this.props.schemaStore.updateSchema(currentSchemaName!, {name, table});
      this.setState({
        showDialog: 'none',
        currentSchemaName: name
      });
    });
  }
  handleAddColumn = () => {
    const {form} = this.createColumnForm.props;
    form.validateFields(async (err, values) => {
      if (err) return;
      const column = values;
      const {schemaStore} = this.props;
      const {currentSchemaName} = this.state;
      const schema = schemaStore.getSchemaByName(currentSchemaName!)!;
      await schemaStore.addColumn(schema, column);
      this.setState({
        showDialog: 'none'
      });
    });
  }
  handleUpdateColumn = () => {
    const {form} = this.updateColumnForm.props;
    form.validateFields(async (err, values) => {
      if (err) return;
      const column = values;
      const {schemaStore} = this.props;
      const {currentSchemaName, currentColumnName} = this.state;
      await schemaStore.updateColumn(currentSchemaName!, currentColumnName!, column);
      this.setState({
        showDialog: 'none'
      });
    });
  }
  handleAddAssociation = () => {
    const {form} = this.createAssociationForm.props;
    form.validateFields(async (err, values) => {
      if (err) return;
      const association = values;
      const {schemaStore} = this.props;
      const {currentSchemaName} = this.state;
      const schema = schemaStore.getSchemaByName(currentSchemaName!)!;
      await schemaStore.addAssociation(schema, association);
      this.setState({
        showDialog: 'none'
      });
    });
  }
  handleUpdateAssociation = () => {
    const {form} = this.updateAssociationForm.props;
    form.validateFields(async (err, values) => {
      if (err) return;
      const association = values;
      const {schemaStore} = this.props;
      const {currentSchemaName, currentAssociationName} = this.state;
      await schemaStore.updateAssociation(currentSchemaName!, currentAssociationName!, association);
      this.setState({
        showDialog: 'none'
      });
    });
  }
  handleDeleteColumn = async (schemaName: string, columnName: string) => {
    await this.props.schemaStore.removeColumn(schemaName, columnName);
  }
  handleDeleteAssociation = async (schemaName: string, associationName: string) => {
    await this.props.schemaStore.removeAssociation(schemaName, associationName);
  }
  handleDeleteSchema = async (schemaName: string) => {
    const index = await this.props.schemaStore.removeSchema(schemaName);
    if (index == undefined) return;
    const {schemaStore: {schemas}} = this.props;
    if (schemas.length == 0) return;
    if (schemas.length == 1) {
      this.setState({
        currentSchemaName: schemas[0].name
      });
      return;
    }
    if (index >= schemas.length) {
      this.setState({
        currentSchemaName: schemas[index - 1].name
      });
      return;
    }
    this.setState({
      currentSchemaName: schemas[index].name
    });
  }
  handleChangeSchema = async (name: string) => {
    const schema = this.props.schemaStore.schemas.find(schema => schema.name == name);
    if (!schema) return;
    const dataSource = schema.columns.length > 0
      ?  await httpGetWithData('/_edit/queryData', {schema: schema.name})
      : [];
    this.setState({
      currentSchemaName: name,
      dataSource
    });
  }
  handleChangeOrder = async (order: string) => {
    const {currentSchemaName} = this.state;
    const schema = this.props.schemaStore.schemas.find(schema => schema.name == currentSchemaName);
    if (!schema) return;
    const dataSource = schema.columns.length > 0
      ?  await httpGetWithData('/_edit/queryData', {schema: schema.name, order})
      : [];
    this.setState({
      dataSource
    });
  }
  renderCreateSchemaDialog() {
    return (
      <Modal
        title="创建schema"
        destroyOnClose={true}
        visible={this.state.showDialog == 'createSchema'}
        okText="确定"
        cancelText="取消"
        onOk={this.handleAddSchema}
        onCancel={() => this.setState({showDialog: 'none'})}>
        <SchemaForm wrappedComponentRef={ref => this.createSchemaForm = ref} />
      </Modal>
    );
  }
  renderUpdateSchemaDialog() {
    const schema = this.getCurrentSchema();
    if (!schema) return;
    return (
      <Modal
        title="修改schema"
        visible={this.state.showDialog == 'updateSchema'}
        okText="确定"
        destroyOnClose={true}
        cancelText="取消"
        onOk={this.handleUpdateSchema}
        onCancel={() => this.setState({showDialog: 'none'})}>
        <SchemaForm
          name={schema.name}
          table={schema.table}
          wrappedComponentRef={ref => this.updateSchemaForm = ref} />
      </Modal>
    );
  }
  renderCreateColumnDialog() {
    return (
      <Modal
        title="添加列"
        destroyOnClose={true}
        visible={this.state.showDialog == 'createColumn'}
        okText="确定"
        cancelText="取消"
        onOk={this.handleAddColumn}
        onCancel={() => this.setState({showDialog: 'none'})}>
        <ColumnForm wrappedComponentRef={ref => this.createColumnForm = ref}/>
      </Modal>
    );
  }
  renderUpdateColumnDialog() {
    const column = this.getCurrentColumn();
    if (!column) return;
    return (
      <Modal
        title="修改列"
        destroyOnClose={true}
        visible={this.state.showDialog == 'updateColumn'}
        okText="确定"
        cancelText="取消"
        onOk={this.handleUpdateColumn}
        onCancel={() => this.setState({showDialog: 'none'})}>
        <ColumnForm column={column} wrappedComponentRef={ref => this.updateColumnForm = ref}/>
      </Modal>
    );
  }
  renderCreateAssociationDialog() {
    return (
      <Modal
        title="添加关联"
        destroyOnClose={true}
        visible={this.state.showDialog == 'createAssociation'}
        okText="确定"
        cancelText="取消"
        onOk={this.handleAddAssociation}
        onCancel={() => this.setState({showDialog: 'none'})}>
        <AssociationForm wrappedComponentRef={ref => this.createAssociationForm = ref} schemas={this.props.schemaStore.schemas} />
      </Modal>
    );
  }
  renderUpdateAssociationDialog() {
    const association = this.getCurrentAssociation();
    if (!association) return;
    return (
      <Modal
        title="修改关联"
        visible={this.state.showDialog == 'updateAssociation'}
        okText="确定"
        destroyOnClose={true}
        cancelText="取消"
        onOk={this.handleUpdateAssociation}
        onCancel={() => this.setState({showDialog: 'none'})}>
        <AssociationForm
          wrappedComponentRef={ref => this.updateAssociationForm = ref}
          association={association}
          schemas={this.props.schemaStore.schemas} />
      </Modal>
    );
  }
  renderTable() {
    const {schemaStore} = this.props;
    const {currentSchemaName, dataSource} = this.state;
    if (!currentSchemaName) return;
    const schema = schemaStore.getSchemaByName(currentSchemaName);
    if (!schema) return;
    const columns: ColumnProps<any>[] = [];
    schema.columns.forEach(column => columns.push({
      key: column.name,
      title: (
        <div>
          {column.name}
          <Dropdown
            overlay={<ColumnMenu onClick={key => {
              switch (key) {
                case 'update':
                  this.setState({
                    currentColumnName: column.name,
                    showDialog: 'updateColumn'
                  });
                  break;
                case 'delete':
                  Modal.confirm({
                    title: '删除列',
                    content: `是否删除${schema.name} ${column.name}列`,
                    onOk: () => this.handleDeleteColumn(schema.name, column.name)
                  });
                  break;
                case 'asc':
                case 'desc':
                  this.handleChangeOrder(`order ${column.name} ${key}`);
                  break;
              }
            }} />}
            trigger={['click']}>
            <a style={{marginLeft: 10}} className="ant-dropdown-link" href="#">
              <Icon type="caret-down" style={{color: '#bfbfbf'}}/>
            </a>
          </Dropdown>
        </div>
      ),
      dataIndex: column.name
    }));
    schema.associations.forEach(association => columns.push({
      key: association.name,
      title: (
        <div>
          {association.name}
          <Dropdown
            overlay={<ColumnMenu onClick={key => {
              switch (key) {
                case 'update':
                  this.setState({
                    showDialog: 'updateAssociation',
                    currentAssociationName: association.name
                  });
                  break;
                case 'delete':
                  Modal.confirm({
                    title: '删除列',
                    content: `是否删除${schema.name} ${association.name}`,
                    onOk: () => this.handleDeleteAssociation(schema.name, association.name)
                  });
                  break;
              }
            }}/>}
            trigger={['click']}>
            <a style={{marginLeft: 10}} className="ant-dropdown-link" href="#">
              <Icon type="caret-down" style={{color: '#bfbfbf'}}/>
            </a>
          </Dropdown>
        </div>
      ),
      dataIndex: association.name
    }));
    return (
      <Table<any>
        onHeaderRow={(column, index) => index}
        dataSource={dataSource}
        rowKey={(record, index) => index.toString()}
        columns={columns}
        size="small" />
    );
  }
  render() {
    const {schemas} = this.props.schemaStore;
    const {currentSchemaName} = this.state;
    return (
      <div style={{display: 'flex'}}>
        {this.renderCreateSchemaDialog()}
        {this.renderUpdateSchemaDialog()}
        {this.renderCreateColumnDialog()}
        {this.renderUpdateColumnDialog()}
        {this.renderCreateAssociationDialog()}
        {this.renderUpdateAssociationDialog()}
        <div style={{width: 200, marginTop: 5, height: '100%', backgroundColor: '#fefefe', borderRight: '1px solid #ebedf0'}}>
          {schemas.map((schema, index) => (
            <SchemaTitle
              key={index}
              selected={schema.name == currentSchemaName}
              name={schema.name}
              onClick={() => this.handleChangeSchema(schema.name)}/>
          ))}
        </div>
        <div style={{flex: 1, marginTop: 5}}>
          {this.renderTable()}
        </div>
      </div>
    );
  }
}

export default SchemaView;