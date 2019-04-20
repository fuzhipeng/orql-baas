import {Col, Form, Input, InputNumber, Row, Select, Switch} from 'antd';
import React from 'react';
import {FormComponentProps} from 'antd/lib/form';
import {FormItemLayout, OrqlOps} from '../../config';
import {Api, Association, Schema} from '../../beans';
import OrqlTree from './OrqlTree';

const { TextArea } = Input;

export interface ApiFormProps extends FormComponentProps {
  schemas: Schema[];
  groups: string[];
  currentGroup: string;
  api?: Api;
}

interface IState {
  visual: boolean;
  orql?: string;
}

export default Form.create()(class OrqlApiForm extends React.Component<ApiFormProps, IState> {

  private orql = this.props.api ? this.props.api.orql : undefined;

  state: IState = {
    visual: !!this.orql,
    orql: this.orql
  }

  handleOrqlChange = (orql: string) => {
    const {form: {setFieldsValue}} = this.props;
    setFieldsValue({orql});
    this.setState({
      orql
    });
  }

  render() {
    const {visual, orql} = this.state;
    const {form: {getFieldDecorator, setFieldsValue}, schemas, groups, currentGroup, api} = this.props;
    return (
      <Form layout="vertical" {...FormItemLayout}>
        <Row>
          <Col span={8}>
            <Form.Item label="url">
              {getFieldDecorator('url', {
                rules: [{ required: true, message: '请输入url' }],
                initialValue: api ? api.url : '/',
              })(<Input />)}
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="分组">
              {getFieldDecorator('group', {
                rules: [{ required: true, message: '请选择api分组'}],
                initialValue: api ? api.group : currentGroup
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
                initialValue: api ? api.comment : undefined
              })(<Input />)}
            </Form.Item>
          </Col>
        </Row>
        <Form.Item labelCol={{span: 2}} wrapperCol={{span: 20}} label="orql">
          {getFieldDecorator('orql', {
            rules: [{ required: true, message: '请输入orql' }],
            initialValue: this.orql
          })(<TextArea onChange={e => this.handleOrqlChange(e.target.value)} />)}
        </Form.Item>
        <Row>
          <Col span={12}>
            <Form.Item label="配置">
              {getFieldDecorator('visual', {
                initialValue: !!api,
              })(<Switch defaultChecked={!!api} onChange={visual => this.setState({visual})} />)}
            </Form.Item>
          </Col>
        </Row>
        {visual && (
          <Row>
            <Col span={24}>
              <OrqlTree
                schemas={schemas}
                orql={orql}
                onChange={this.handleOrqlChange}/>
            </Col>
          </Row>
        )}
      </Form>
    );
  }
});