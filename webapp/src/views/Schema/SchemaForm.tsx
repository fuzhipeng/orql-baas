import {Col, Form, Input, Row} from 'antd';
import React from 'react';
import {FormComponentProps} from 'antd/lib/form';
import {FormItemLayout} from '../../config';

export interface SchemaFormProps extends FormComponentProps {
  name?: string;
  table?: string;
}

export default Form.create()(class SchemaForm extends React.Component<SchemaFormProps> {
  render() {
    const {form: {getFieldDecorator}, name, table} = this.props;
    return (
      <Form layout="vertical" {...FormItemLayout}>
        <Row>
          <Col span={12}>
            <Form.Item label="name">
              {getFieldDecorator('name', {
                rules: [{ required: true, message: '请输入schema name' }],
                initialValue: name,
              })(<Input />)}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="table">
              {getFieldDecorator('table', {
                initialValue: table
              })(<Input />)}
            </Form.Item>
          </Col>
        </Row>
      </Form>
    );
  }
});