import start, {ServerOptions} from './server';
import {configJsonPath, schemaJsonPath, apiJsonPath, plugins, indexJsPath, pluginJsonPath} from './config';

export {start, configJsonPath, schemaJsonPath, apiJsonPath, plugins, indexJsPath, pluginJsonPath};

// const options: ServerOptions = {};
// options.dev = process.argv.findIndex(arg => arg == '--dev') >= 0;
//
// start(options)
//   .catch(err => console.error(err));