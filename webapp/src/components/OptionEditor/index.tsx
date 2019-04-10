import React from 'react';
import RadioOption from './Radio';
import TextOption from './Text';
import SelectOption from './Select';
import {Col, Form, Input, Row} from 'antd';
import {FormComponentProps} from 'antd/lib/form';

export enum OptionType {
  Radio = 'radio',
  Text = 'text',
  Select = 'select'
}

export type Options = {[key: string]: Option};

export interface Option {
  label: string;
  type: OptionType;
  values?: string[];
  defaultValue?: string;
  dep?: string;
}

export interface OptionEditorProps {
  form: FormComponentProps;
  options: Options;
}

export default class OptionEditor extends React.Component<OptionEditorProps> {
  renderItem(option: Option) {
    switch (option.type) {
      case OptionType.Text:
        return (
          <Form.Item label="url">
          </Form.Item>
        );
    }
  }
  render() {
    const {options} = this.props;
    return (
      <Row>
        {Object.keys(options).map(key => (
          <Col key={key}>
            {this.renderItem(options[key])}
          </Col>
        ))}
      </Row>
    );
  }
}