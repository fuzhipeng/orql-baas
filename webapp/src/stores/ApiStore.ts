import {action, observable} from 'mobx';
import {Api} from '../beans';
import {httpDelete, httpGetWithData, httpPost, httpPut} from '../utils/network';

export default class ApiStore {

  readonly groups = observable<string>([]);

  readonly apis = observable<Api>([]);

  @action async load() {
    const groups = await httpGetWithData<string[]>('/_edit/apiGroups');
    this.groups.replace(groups!);
  }

  @action async addApi(api: Api) {
    console.log('api', api);
    if(this.apis.find(_api => _api.url == api.url)) {
      console.error(`url: ${api.url} exists`);
      return;
    }
    this.apis.push(api);
  }

  @action async addGroup(name: string) {
    console.log('group', name);
    if (this.groups.find(group => group == name)) {
      console.error(`group ${name} exists`);
      return;
    }
    const res = await httpPost('/_edit/apiGroups', {name});
    if (res.success) {
      this.groups.push(name);
    }
  }

  groupHasApi(group: string) {
    const index = this.groups.findIndex(group => group == name);
    if (index >= 0) {
      const app = this.apis.find(api => api.group == name);
      if (app) return true;
    }
    return false;
  }

  @action async removeGroup(name: string) {
    const index = this.groups.findIndex(group => group == name);
    if (index >= 0) {
      const res = await httpDelete(`/_edit/apiGroups/${name}`);
      if (res.success) {
        this.groups.splice(index, 1);
      }
    }
  }

  @action async updateGroup(old: string, name: string) {
    console.log('updateGroup', 'old', old, 'name', name);
    const index = this.groups.findIndex(group => group == old);
    if (index >= 0) {
      const res = await httpPut(`/_edit/apiGroups/${old}`, {name});
      if (res.success) {
        this.groups[index] = name;
        this.apis
          .filter(api => api.group == old)
          .forEach(api => api.group = name);
      }
    }
  }

}