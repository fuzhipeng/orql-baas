import React from 'react';
import {Col, Form, Input, Row, Select} from 'antd';
import {FormComponentProps} from 'antd/lib/form';
import {FetchTypes, FormItemLayout} from '../../config';
import {Api} from '../../beans';

const {TextArea} = Input;

export interface UrlTestFormProps extends FormComponentProps {
  api: Api;
}

export default Form.create()(class UrlTestForm extends React.Component<UrlTestFormProps> {
  componentWillReceiveProps(nextProps: UrlTestFormProps) {
    const {form: {setFieldsValue}, api} = nextProps;
    if (api.url != this.props.api.url) {
      setFieldsValue({
        url: api.url,
        method: 'post',
        data: ''
      });
    }
  }
  render() {
    const {form: {getFieldDecorator, setFieldsValue}, api} = this.props;
    return (
      <Form layout="vertical" {...FormItemLayout}>
        <Row>
          <Col span={12}>
            <Form.Item label="method">
              {getFieldDecorator('method', {
                rules: [{ required: true, message: '请选择方法'}],
                initialValue: 'post'
              })(
                <Select placeholder="请求方法">
                  {FetchTypes.map(type => (
                    <Select.Option key={type} value={type}>{type}</Select.Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="url">
              {getFieldDecorator('url', {
                rules: [{ required: true, message: '请输入url' }],
                initialValue: api.url
              })(<Input />)}
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item labelCol={{span: 2}} wrapperCol={{span: 20}} label="数据">
              {getFieldDecorator('data', {
                rules: [{ required: false}]
              })(<TextArea />)}
            </Form.Item>
          </Col>
        </Row>
      </Form>
    );
  }
})