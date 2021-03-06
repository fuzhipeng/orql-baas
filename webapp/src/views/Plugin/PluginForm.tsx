import React from 'react';
import {Col, Form, Input, Row, Select, Switch} from 'antd';
import {FormComponentProps} from 'antd/lib/form';
import {FunOption, MatchType, Plugin, PluginConfig, Schema} from '../../beans';
import {FormItemLayout} from '../../config';
import OrqlTree from '../../components/OrqlTree';

export interface FunApiFormProps extends FormComponentProps {
  schemas: Schema[];
  groups: string[];
  plugins: Plugin[];
  config?: PluginConfig;
}

interface IState {
  pluginName?: string;
  matchType?: MatchType;
  orqlVisual?: string;
}

export default Form.create()(class PluginForm extends React.Component<FunApiFormProps, IState> {
  state: IState = {
    pluginName: this.props.config ? this.props.config.name : undefined,
    matchType: MatchType.Url
  }
  renderOption(option: FunOption, name: string, options?: any) {
    const {form: {getFieldDecorator, getFieldsValue, setFieldsValue}, config, schemas} = this.props;
    const {orqlVisual} = this.state;
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
          <Col key={name} span={12}>
            <Form.Item label={name}>
              {getFieldDecorator(`_${name}`, {
                rules: [{ required: option.required}],
                initialValue: defaultValue
              })(<Input />)}
            </Form.Item>
          </Col>
        );
      case 'select':
        return (
          <Col key={name} span={12}>
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
          </Col>
        );
      case 'orql':
        return (
          <Row key={name}>
            <Col span={12}>
              <Form.Item label={name}>
                {getFieldDecorator(`_${name}`, {
                  rules: [{ required: option.required}],
                  initialValue: defaultValue
                })(<Input />)}
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="配置">
                <Switch checked={orqlVisual == name} onChange={visual => this.setState({orqlVisual: visual? name: undefined})} />
              </Form.Item>
            </Col>
            {orqlVisual == name && (
              <OrqlTree
                schemas={schemas}
                onChange={orql => setFieldsValue({[`_${name}`]: orql})}/>
            )}
          </Row>
        );
    }
  }
  renderOptions() {
    const {pluginName} = this.state;
    if (!pluginName) return;
    const {config, plugins} = this.props;
    const options = config && config.options ? JSON.parse(config.options) : undefined;
    const plugin = plugins.find(plugin => plugin.name == pluginName);
    if (plugin == undefined || plugin.options == undefined) return;
    return Object.keys(plugin.options)
      .map(name => this.renderOption(plugin.options![name], name, options));
  }
  render() {
    const {form: {getFieldDecorator}, groups, plugins, config} = this.props;
    const {matchType} = this.state;
    return (
      <Form layout="vertical" {...FormItemLayout}>
        <Row>
          <Col span={12}>
            <Form.Item label="插件">
              {getFieldDecorator('name', {
                rules: [{ required: true, message: '请选择插件' }],
                initialValue: config && config.name
              })(
                <Select<string> onSelect={pluginName => this.setState({pluginName})}>
                  {plugins.map(plugin => (
                    <Select.Option key={plugin.name} value={plugin.name}>{plugin.label}</Select.Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="备注">
              {getFieldDecorator('comment', {
                rules: [{required: false}],
                initialValue: config && config.comment
              })(<Input />)}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="拦截">
              {getFieldDecorator('matchType', {
                rules: [{ required: true, message: '请选择拦截类型'}],
                initialValue: config ? config.matchType : MatchType.Url
              })(
                <Select<MatchType> placeholder="api分组" onSelect={matchType => this.setState({matchType})}>
                  {Object.keys(MatchType).map(key => MatchType[key]).map(type => (
                    <Select.Option key={type} value={type}>{type}</Select.Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          </Col>
          {matchType == MatchType.Url && (
            <Col span={12}>
              <Form.Item label="url">
                {getFieldDecorator('matchValue', {
                  rules: [{ required: true, message: '请输入url' }],
                  initialValue: config && config.matchValue
                })(<Input />)}
              </Form.Item>
            </Col>
          )}
          {matchType == MatchType.Group && (
            <Col span={12}>
              <Form.Item label="分组">
                {getFieldDecorator('matchValue', {
                  rules: [{required: true, message: '请选择分组'}],
                  initialValue: config && config.matchValue
                })(
                  <Select>
                    {groups.map(group => (
                      <Select.Option key={group} value={group}>{group}</Select.Option>
                    ))}
                  </Select>
                )}
              </Form.Item>
            </Col>
          )}
        </Row>
        <Row>
          {this.renderOptions()}
        </Row>
      </Form>
    );
  }
})