import {Col, Form, Input, Row} from 'antd';
import React from 'react';
import {FormComponentProps} from 'antd/lib/form';
import {FormItemLayout} from '../../config';

export interface SchemaFormProps extends FormComponentProps {
  name?: string;
}

export default Form.create()(class GroupForm extends React.Component<SchemaFormProps> {
  render() {
    const {form: {getFieldDecorator}, name} = this.props;
    return (
      <Form layout="vertical" {...FormItemLayout}>
        <Row>
          <Col span={12}>
            <Form.Item label="名称">
              {getFieldDecorator('name', {
                rules: [{ required: true, message: '请输入分组名' }],
                initialValue: name,
              })(<Input />)}
            </Form.Item>
          </Col>
        </Row>
      </Form>
    );
  }
});