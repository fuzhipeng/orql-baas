import React from 'react';
import {RouteComponentProps, Link, Switch, Route} from 'react-router-dom';
import SchemaView from '../Schema';
import ApiView from '../Api';
import {inject, observer} from 'mobx-react';
import AppStore from '../../stores/AppStore';
import FileView from '../File';
import SettingView from '../Setting';
import {Dropdown, Menu} from 'antd';
import {AppMenu} from '../../beans';
import PluginView from '../Plugin';

interface IProps extends RouteComponentProps {
  appStore: AppStore;
}

const DropMenu = () => (
  <Menu>
    <Menu.Item>
      <div>orql</div>
    </Menu.Item>
    <Menu.Item>
      <div>fun</div>
    </Menu.Item>
  </Menu>
)

const ItemLink = (props: {label: string, to: string}) => (
  <Link to={props.to} style={{fontSize: 16, color: '#fff', marginRight: 20, textDecoration: 'none'}}>{props.label}</Link>
)

const AppMenuView = (props: {label: string, onClick?: () => void, subMenus?: AppMenu[]}) => {
  if (props.subMenus) {
    return (
      <Dropdown overlay={(
        <Menu>
          {props.subMenus.map((subMenu, index) => (
            <Menu.Item key={index} onClick={subMenu.onClick}>{subMenu.label}</Menu.Item>
          ))}
        </Menu>
      )}>
        <span style={{fontSize: 14, color: '#fff', marginLeft: 10, cursor: 'pointer'}}>{props.label}</span>
      </Dropdown>
    );
  }
  return (
    <span
      onClick={props.onClick}
      style={{fontSize: 14, color: '#fff', marginLeft: 10, cursor: 'pointer'}}>{props.label}</span>
  );
}

@inject('appStore')
@observer
class HomeView extends React.Component<IProps> {
  componentDidMount() {
    if (this.props.location.pathname == '/') {
      this.props.history.replace('/schema');
    }
  }
  render() {
    return (
      <div style={{width: '100%', height: '100%'}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: 50, backgroundColor: '#1890ff'}}>
          <div>
            <span style={{fontSize: 18, color: '#fff', marginLeft: 20}}>orql baas</span>
            {this.props.appStore.appMenus.map((appMenu, index) =>
              <AppMenuView key={index} label={appMenu.label} onClick={appMenu.onClick} subMenus={appMenu.subMenus}/>
            )}
          </div>
          <div>
            <ItemLink label="schema" to="/schema"/>
            <ItemLink label="api" to="/api"/>
            <ItemLink label="插件" to="/plugin"/>
            <ItemLink label="文件" to="/file" />
            <ItemLink label="设置" to="/setting" />
          </div>
        </div>
        <div>
          <Switch>
            <Route path="/schema" component={SchemaView} />
            <Route path="/api" component={ApiView} />
            <Route path="/plugin" component={PluginView} />
            <Route path="/file" component={FileView} />
            <Route path="/setting" component={SettingView} />
          </Switch>
        </div>
      </div>
    );
  }
}

export default HomeView;