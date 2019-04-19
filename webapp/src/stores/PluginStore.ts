import {action, observable} from 'mobx';
import {Api, PluginConfig, Plugin} from '../beans';
import {httpDelete, httpGetWithData, httpPost, httpPut} from '../utils/network';

export default class PluginStore {

  readonly plugins = observable<Plugin>([]);

  readonly configs = observable<PluginConfig>([]);

  @action async load() {
    const plugins = await httpGetWithData<Plugin[]>('/_edit/plugins');
    const configs = await httpGetWithData<PluginConfig[]>('/_edit/pluginConfigs');
    this.plugins.replace(plugins!);
    this.configs.replace(configs!);
  }

  @action async addConfig(config: PluginConfig) {
    const res = await httpPost('/_edit/pluginConfigs', config);
    res.success && this.configs.push(config);
  }

  @action async updateConfig(index: number, config: PluginConfig) {
    const res = await httpPut('/_edit/pluginConfigs/' + index, config);
    res.success && (this.configs[index] = config);
  }

  @action async removeConfig(index: number) {
    const res = await httpDelete('/_edit/pluginConfigs/' + index);
    res.success && this.configs.splice(index, 1);
  }
}