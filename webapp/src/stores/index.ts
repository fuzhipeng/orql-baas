import AppStore from './AppStore';
import SchemaStore from './SchemaStore';
import ApiStore from './ApiStore';
import PluginStore from './PluginStore';

export default {
  appStore: new AppStore(),
  schemaStore: new SchemaStore(),
  apiStore: new ApiStore(),
  pluginStore: new PluginStore()
}