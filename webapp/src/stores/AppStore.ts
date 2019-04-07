import {action, observable} from 'mobx';
import {AppMenu} from '../beans';

class AppStore {
  readonly appMenus = observable<AppMenu>([]);

  @action setAppMenus(appMenus: AppMenu[]) {
    this.appMenus.replace(appMenus);
  }
}

export default AppStore;