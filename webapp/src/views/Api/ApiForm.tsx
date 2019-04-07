import {Col, Form, Input, InputNumber, Row, Select, Switch} from 'antd';
import React from 'react';
import {FormComponentProps} from 'antd/lib/form';
import {FormItemLayout, OrqlOps} from '../../config';
import {Schema} from '../../beans';
import OrqlTree from './OrqlTree';
import {array} from 'prop-types';

export interface ApiFormProps extends FormComponentProps {
  schemas: Schema[];
}

interface IState {
  op: string;
  visual: boolean;
  array: boolean;
  schemaName?: string;
}

export default Form.create()(class ApiForm extends React.Component<ApiFormProps, IState> {
  state: IState = {
    op: 'query',
    visual: false,
    array: false
  }
  render() {
    const {op, visual, schemaName, array} = this.state;
    const {form: {getFieldDecorator}, schemas} = this.props;
    return (
      <Form layout="vertical" {...FormItemLayout}>
        <Row>
          <Col span={12}>
            <Form.Item label="url">
              {getFieldDecorator('url', {
                rules: [{ required: true, message: '请输入url' }],
                initialValue: '/',
              })(<Input />)}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="备注">
              {getFieldDecorator('comment', {
                rules: [{ required: false, message: '请输入备注' }],
              })(<Input />)}
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Form.Item label="orql">
              {getFieldDecorator('orql', {
                rules: [{ required: true, message: '请输入orql' }],
              })(<Input />)}
            </Form.Item>
          </Col>
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
              <OrqlTree schemaName={schemaName} schemas={schemas} op={op}/>
            </Col>
          </Row>
        )}
      </Form>
    );
  }
});