import {Col, Form, Input, InputNumber, Row, Select, Switch} from 'antd';
import React from 'react';
import {FormComponentProps} from 'antd/lib/form';
import {ColumnTypes, FormItemLayout} from '../../config';
import {Column} from '../../beans';

export interface ColumnFormProps extends FormComponentProps {
  column?: Column;
}

export default Form.create()(class ColumnForm extends React.Component<ColumnFormProps> {
  render() {
    const {form: {getFieldDecorator}, column} = this.props;
    return (
      <Form layout="vertical" {...FormItemLayout}>
        <Row>
          <Col span={12}>
            <Form.Item label="name">
              {getFieldDecorator('name', {
                rules: [{required: true, message: '请输入column name'}],
                initialValue: column ? column.name : undefined
              })(<Input />)}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="type">
              {getFieldDecorator('type', {
                rules: [{required: true, message: '请选择类型'}],
                initialValue: column ? column.type : 'string'
              })(
                <Select>
                  {ColumnTypes.map(type => (
                    <Select.Option key={type} value={type}>{type}</Select.Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Form.Item label="length">
              {getFieldDecorator('length', {
                rules: [{type: 'number'}],
                initialValue: column ? column.length : undefined
              })(<InputNumber min={1} />)}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="required">
              {getFieldDecorator('required', {
                valuePropName: 'checked',
                initialValue: column ? column.required : undefined
              })(
                <Switch />
              )}
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Form.Item label="主键">
              {getFieldDecorator('primaryKey', {
                valuePropName: 'checked',
                initialValue: column ? column.primaryKey : undefined
              })(
                <Switch />
              )}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="自增">
              {getFieldDecorator('generatedKey', {
                valuePropName: 'checked',
                initialValue: column ? column.generatedKey : undefined
              })(
                <Switch />
              )}
            </Form.Item>
          </Col>
        </Row>
      </Form>
    );
  }
});