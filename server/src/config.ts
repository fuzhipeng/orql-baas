import path from "path";
import process from "process";
import * as fs from 'fs';
import {ApiConfig, ApiPlugin, Config, FunApi, Schema} from './beans';
import {readJsonSync, writeJsonSync} from './utils';

const cwd = process.cwd();
export const configPath = path.resolve(cwd, './config.json');
export const schemaPath = path.resolve(cwd, './schema.json');
export const apiPath = path.resolve(cwd, './api.json');
export const apiJsPath = path.resolve(cwd, './api.js');
export const pluginJsPath = path.resolve(cwd, './plugin.js');

if (!fs.existsSync(configPath)) {
  const exampleConfig: Config = {
    port: 3000,
    orql: {
      dialect: 'mysql',
      connection: {
        host: 'localhost',
        username: 'username',
        password: 'password',
        database: 'test'
      }
    }
  }
  writeJsonSync(configPath, exampleConfig);
  throw new Error('config.json not exist');
}
const config: Config = readJsonSync(configPath);

if (!fs.existsSync(schemaPath)) {
  console.log('schema.json not exist');
  writeJsonSync(schemaPath, []);
}

const schemas: Schema[] = readJsonSync(schemaPath);

if (!fs.existsSync(apiPath)) {
  console.log('api.json not exist');
  writeJsonSync(apiPath, {apis: [], groups: [], plugins: []});
}

const funApis: {[name: string]: FunApi} = require(apiJsPath);

const plugins: {[name: string]: ApiPlugin} = require(pluginJsPath);

const apiConfig: ApiConfig = readJsonSync(apiPath);

export {config, schemas, funApis, apiConfig, plugins};