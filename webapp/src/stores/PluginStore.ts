import {action, observable} from 'mobx';
import {Api, PluginConfig, Plugin} from '../beans';

export default class PluginStore {

  readonly plugins = observable<Plugin>([]);

  readonly configs = observable<PluginConfig>([]);

  @action async load() {

  }

  @action async addConfig(config: PluginConfig) {
    this.configs.push(config);
  }

  @action async updateConfig(index: number, config: PluginConfig) {
    this.configs[index] = config;
  }

  @action async removeConfig(index: number) {
    this.configs.splice(index, 1);
  }
}