import {Col, Form, Input, Row, Select} from 'antd';
import React from 'react';
import {FormComponentProps} from 'antd/lib/form';
import {Dialects, FormItemLayout} from '../../config';

export default Form.create()(class DatabaseForm extends React.Component<FormComponentProps> {
  render() {
    const {form: {getFieldDecorator}} = this.props;
    return (
      <Form layout="vertical" {...FormItemLayout}>
        <Row>
          <Col span={12}>
            <Form.Item label="dialect">
              {getFieldDecorator('dialect', {
                rules: [{ required: true, message: '请选择dialect'}],
                initialValue: 'mysql'
              })(
                <Select placeholder="请选择dialect">
                  {Dialects.map(name => (
                    <Select.Option key={name} value={name}>{name}</Select.Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="host">
              {getFieldDecorator('host', {
                rules: [{ required: true, message: '请输入host' }],
                initialValue: 'localhost'
              })(<Input />)}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="username">
              {getFieldDecorator('username', {
                rules: [{ required: true, message: '请输入username' }]
              })(<Input />)}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="database">
              {getFieldDecorator('database', {
                rules: [{ required: true, message: '请输入database' }]
              })(<Input />)}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="password">
              {getFieldDecorator('password', {
                rules: [{message: '请输入密码' }]
              })(<Input type="password" />)}
            </Form.Item>
          </Col>
        </Row>
      </Form>
    );
  }
});