import {Col, Form, Input, Row, Select, Switch} from 'antd';
import React from 'react';
import {FormComponentProps} from 'antd/lib/form';
import {Association, Schema} from '../../beans';
import {FormItemLayout, RefTypes} from '../../config';

interface AssociationFormProps extends FormComponentProps {
  schemas: Schema[];
  association?: Association;
}

interface AssociationState {
  type?: string
}

export default Form.create()(class AssociationForm extends React.Component<AssociationFormProps, AssociationState> {
  state: AssociationState = {}
  render() {
    const {schemas, form: {getFieldDecorator}, association} = this.props;
    const {type} = this.state;
    return (
      <Form layout="vertical" {...FormItemLayout}>
        <Row>
          <Col span={12}>
            <Form.Item label="名称">
              {getFieldDecorator('name', {
                rules: [{required: true, message: '请输入association name'}],
                initialValue: association ? association.name : undefined
              })(<Input />)}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="类型">
              {getFieldDecorator('type', {
                rules: [{required: true, message: '请选择类型'}],
                initialValue: association ? association.type : undefined
              })(
                <Select<string> onChange={type => this.setState({type})}>
                  {RefTypes.map(type => (
                    <Select.Option key={type} value={type}>{type}</Select.Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Form.Item label="关联">
              {getFieldDecorator('refName', {
                rules: [{required: true, message: '请选择关联schema'}],
                initialValue: association ? association.refName : undefined
              })(
                <Select>
                  {schemas.map(schema => (
                    <Select.Option key={schema.name} value={schema.name}>{schema.name}</Select.Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="关联键">
              {getFieldDecorator('refKey', {
                rules: [{required: false, message: '请输入关联键'}],
                initialValue: association ? association.refKey : undefined
              })(<Input />)}
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Form.Item label="required">
              {getFieldDecorator('required', {
                valuePropName: 'checked',
                initialValue: association ? association.required : undefined
              })(
                <Switch />
              )}
            </Form.Item>
          </Col>
        </Row>
        {type == 'belongsToMany' && (
          <Row>
            <Col span={12}>
              <Form.Item label="中间关联">
                {getFieldDecorator('middle', {
                  rules: [{required: true, message: '请选择中间schema'}],
                  initialValue: association ? association.middle : undefined
                })(
                  <Select>
                    {schemas.map(schema => (
                      <Select.Option key={schema.name} value={schema.name}>{schema.name}</Select.Option>
                    ))}
                  </Select>
                )}
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="中间键">
                {getFieldDecorator('middleKey', {
                  rules: [{required: false, message: '请输入中间键'}],
                  initialValue: association ? association.middleKey : undefined
                })(<Input />)}
              </Form.Item>
            </Col>
          </Row>
        )}
      </Form>
    );
  }
});