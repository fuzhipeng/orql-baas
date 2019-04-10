import React from 'react';
import {Col, Form, Input, Radio, Row, Select} from 'antd';
import {FormComponentProps} from 'antd/lib/form';
import {Api, Fun, FunOption} from '../../beans';
import {FormItemLayout} from '../../config';

export interface FunApiFormProps extends FormComponentProps {
  groups: string[];
  currentGroup: string;
  funs: Fun[];
  api?: Api;
}

interface IState {
  funName?: string;
}

export default Form.create()(class FunApiForm extends React.Component<FunApiFormProps, IState> {
  state: IState = {
    funName: this.props.api ? this.props.api.fun : undefined
  }
  renderOption(option: FunOption, name: string, options?: any) {
    const {form: {getFieldDecorator, getFieldsValue}, api} = this.props;
    if (option.dep) {
      const arr = option.dep.split('.');
      const field = '_' + arr[0];
      const depValue = getFieldsValue([field])[field];
      if (depValue != arr[1]) return;
    }
    const defaultValue = options ? options[name] : option.defaultValue;
    switch (option.type) {
      case 'text':
        return (
          <Form.Item label={name}>
            {getFieldDecorator(`_${name}`, {
              rules: [{ required: option.required}],
              initialValue: defaultValue
            })(<Input />)}
          </Form.Item>
        );
      case 'select':
        return (
          <Form.Item label={name}>
            {getFieldDecorator(`_${name}`, {
              rules: [{ required: option.required }],
              initialValue: defaultValue
            })(
              <Select>
                {option.values!.map(value => (
                  <Select.Option key={value} value={value}>{value}</Select.Option>
                ))}
              </Select>
            )}
          </Form.Item>
        );
    }
  }
  renderOptions() {
    const {funName} = this.state;
    if (!funName) return;
    const {funs, api} = this.props;
    const options = api && api.options ? JSON.parse(api.options) : undefined;
    const fun = funs.find(fun => fun.name == funName);
    if (fun == undefined || fun.options == undefined) return;
    return Object.keys(fun.options).
    map(name => <Col span={8} key={name}>{this.renderOption(fun.options![name], name, options)}</Col>);
  }
  render() {
    const {form: {getFieldDecorator}, api, currentGroup, groups, funs} = this.props;
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
          <Col span={8}>
            <Form.Item label="fun">
              {getFieldDecorator('fun', {
                rules: [{ required: true, message: '请选择fun' }],
                initialValue: api ? api.fun : undefined
              })(
                <Select<string> onSelect={funName => this.setState({funName})}>
                  {funs.map(fun => (
                    <Select.Option key={fun.name} value={fun.name}>{fun.label}</Select.Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          </Col>
        </Row>
        <Row>
          {this.renderOptions()}
        </Row>
      </Form>
    );
  }
})