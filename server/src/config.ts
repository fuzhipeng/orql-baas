import path from "path";
import process from "process";
import * as fs from 'fs';
import {ApiObject, Config, Plugin, PluginConfig, Schema} from './beans';
import {readJsonSync} from './utils';

const cwd = process.cwd();
export const configJsonPath = path.resolve(cwd, './config.json');
export const schemaJsonPath = path.resolve(cwd, './schema.json');
export const apiJsonPath = path.resolve(cwd, './api.json');
export const indexJsPath = path.resolve(cwd, './index.js');
export const pluginJsonPath = path.resolve(cwd, './plugin.json');

if (!fs.existsSync(configJsonPath)) {
  console.warn('config.json not exist');
}
const config: Config = readJsonSync(configJsonPath) || {orql: {}};

if (!fs.existsSync(schemaJsonPath)) {
  console.warn('schema.json not exist');
}

const schemas: Schema[] = readJsonSync(schemaJsonPath) || [];

if (!fs.existsSync(apiJsonPath)) {
  console.warn('api.json not exist');
}

if (!fs.existsSync(pluginJsonPath)) {
  console.warn('plugin.json not exist');
}

const apiObject: ApiObject = readJsonSync(apiJsonPath) || {};

const plugins: {[name: string]: Plugin} = {};

const pluginConfigs: PluginConfig[] = readJsonSync(pluginJsonPath) || [];

export {config, schemas, plugins, apiObject, pluginConfigs};