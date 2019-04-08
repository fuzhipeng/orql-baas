import {Col, Form, Input, InputNumber, Row, Select, Switch} from 'antd';
import React from 'react';
import {FormComponentProps} from 'antd/lib/form';
import {FormItemLayout, OrqlOps} from '../../config';
import {Schema} from '../../beans';
import OrqlTree, {ExpMap} from './OrqlTree';
import {array} from 'prop-types';

const { TextArea } = Input;

export interface ApiFormProps extends FormComponentProps {
  schemas: Schema[];
  groups: string[];
  currentGroup: string;
}

interface IState {
  op: string;
  visual: boolean;
  array: boolean;
  schemaName?: string;
  selectedKeys: string[];
  expMap: ExpMap;
}

interface KeyTmp {
  key: string;
  arr: string[];
}

interface SelectItem {
  name: string;
  array: boolean;
  exp?: string;
  columns: string[];
  children: SelectItem[];
}

function selectItemToOrql(selectItem: SelectItem): string {
  let orql = selectItem.name;
  if (selectItem.exp) orql += '(' + selectItem.exp + ')';
  // 全放一个数组先
  let childOrqlArr = [
    ...selectItem.columns,
    ...selectItem.children
      .map(child => selectItemToOrql(child))
      .filter(childOrql => childOrql != '')
  ];
  if (childOrqlArr.length > 0) {
    const start = selectItem.array ? ': [' : ': {';
    const end = selectItem.array ? ']' : '}';
    orql += start + childOrqlArr.join(', ') + end;
  }
  if (orql == selectItem.name) return '';
  return orql;
}

export default Form.create()(class ApiForm extends React.Component<ApiFormProps, IState> {
  state: IState = {
    op: 'query',
    visual: false,
    array: false,
    selectedKeys: [],
    expMap: {},
  }
  private handleChangeSelectKeys = (selectedKeys: string[]) => {
    this.setState({
      selectedKeys
    }, this.genOrql);
  }
  private handleChangeExpMap = (expMap: ExpMap) => {
    this.setState({
      expMap
    }, this.genOrql);
  }
  private getParent = (root: SelectItem, arr: string[]): SelectItem => {
    let tmp = root;
    let i = 2;
    while (i < arr.length - 1) {
      let key = arr[i++];
      tmp = root.children.find(child => child.name == key)!;
    }
    return tmp;
  }
  private genOrql = () => {
    const {form: {setFieldsValue}} = this.props;
    const {op, selectedKeys, expMap, schemaName, array} = this.state;
    if (selectedKeys.length == 0) return;
    const keyTmps: KeyTmp[] = [];
    // 先切割缓存起来
    selectedKeys.forEach(key => {
      const arr = key.split('.');
      keyTmps.push({key, arr});
    });
    // 排序，避免父节点不存在
    keyTmps.sort((a, b) => a.arr.length - b.arr.length);
    // FIXME root用于全选
    if (keyTmps[0].key != schemaName) {
      keyTmps.unshift({key: schemaName!, arr: [schemaName!]})
    }
    // 重新拼装成树
    const root: SelectItem = {
      name: schemaName!,
      array,
      columns: [],
      children: [],
      exp: expMap[schemaName!]
    };
    for (let i = 1; i < keyTmps.length; i ++) {
      const keyTmp = keyTmps[i];
      // 获取父节点
      const parent = this.getParent(root, keyTmp.arr);
      if (!parent) continue;
      // 类型 array object column
      const type = keyTmp.arr[0];
      // 名称
      const name = keyTmp.arr[keyTmp.arr.length - 1];
      if (type == 'array') {
        const exp = expMap[keyTmp.key];
        parent.children.push({
          array: true,
          name,
          exp,
          children: [],
          columns: []
        });
      } else if (type == 'object') {
        const exp = expMap[keyTmp.key];
        parent.children.push({
          array: false,
          exp,
          name,
          children: [],
          columns: []
        });
      } else {
        parent.columns.push(name);
      }
    }
    const orql = op + ' ' + selectItemToOrql(root);
    setFieldsValue({orql});
  }
  render() {
    const {op, visual, schemaName, array, selectedKeys, expMap} = this.state;
    const {form: {getFieldDecorator, setFieldsValue}, schemas, groups, currentGroup} = this.props;
    return (
      <Form layout="vertical" {...FormItemLayout}>
        <Row>
          <Col span={8}>
            <Form.Item label="url">
              {getFieldDecorator('url', {
                rules: [{ required: true, message: '请输入url' }],
                initialValue: '/',
              })(<Input />)}
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="分组">
              {getFieldDecorator('group', {
                rules: [{ required: true, message: '请选择api分组'}],
                initialValue: currentGroup
              })(
                <Select placeholder="api分组">
                  {groups.map(group => (
                    <Select.Option key={group} value={group}>{group}</Select.Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="备注">
              {getFieldDecorator('comment', {
                rules: [{ required: false, message: '请输入备注' }],
              })(<Input />)}
            </Form.Item>
          </Col>
        </Row>
        <Form.Item labelCol={{span: 2}} wrapperCol={{span: 20}} label="orql">
          {getFieldDecorator('orql', {
            rules: [{ required: true, message: '请输入orql' }],
          })(<TextArea />)}
        </Form.Item>
        <Row>
          <Col span={12}>
            <Form.Item label="配置">
              {getFieldDecorator('visual', {
                initialValue: false,
              })(<Switch onChange={visual => this.setState({visual})} />)}
            </Form.Item>
          </Col>
        </Row>
        {visual && (
          <Row>
            <Col span={6}>
              <Form.Item label="操作">
                {getFieldDecorator('op', {
                  rules: [{ required: false, message: '请输入操作' }],
                  initialValue: 'query'
                })(
                  <Select<string> onSelect={op => this.setState({op})}>
                    {OrqlOps.map(op => (
                      <Select.Option key={op} value={op}>{op}</Select.Option>
                    ))}
                  </Select>
                )}
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="实体">
                {getFieldDecorator('schema', {
                  rules: [{ required: false }],
                })(
                  <Select<string> onSelect={schemaName => this.setState({schemaName})}>
                    {schemas.map(schema => (
                      <Select.Option key={schema.name} value={schema.name}>{schema.name}</Select.Option>
                    ))}
                  </Select>
                )}
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="数组">
                {getFieldDecorator('array', {
                  initialValue: false,
                })(<Switch onChange={array => this.setState({array})} />)}
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="分页">
                {getFieldDecorator('size', {
                })(<InputNumber disabled={!array} />)}
              </Form.Item>
            </Col>
            <Col span={24}>
              <OrqlTree
                schemaName={schemaName}
                schemas={schemas}
                op={op}
                expMap={expMap}
                onChangeExpMap={this.handleChangeExpMap}
                selectedKeys={selectedKeys}
                onChangeSelectKeys={this.handleChangeSelectKeys}/>
            </Col>
          </Row>
        )}
      </Form>
    );
  }
});