import AppStore from './AppStore';
import SchemaStore from './SchemaStore';
import ApiStore from './ApiStore';

export default {
  appStore: new AppStore(),
  schemaStore: new SchemaStore(),
  apiStore: new ApiStore()
}