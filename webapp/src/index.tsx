import React from 'react';
import ReactDom from 'react-dom';
import Root from './Root';
import '../node_modules/antd/dist/antd.css';
import './index.css';

ReactDom.render(
  <Root />,
  document.getElementById('app')
);