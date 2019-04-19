import path from "path";
import process from "process";
import * as fs from 'fs';
import {ApiObject, Config, FunApi, Schema} from './beans';
import {readJsonSync, writeJsonSync} from './utils';

const cwd = process.cwd();
export const configJsonPath = path.resolve(cwd, './config.json');
export const schemaJsonPath = path.resolve(cwd, './schema.json');
export const apiJsonPath = path.resolve(cwd, './api.json');
export const apiJsPath = path.resolve(cwd, './api.js');

if (!fs.existsSync(configJsonPath)) {
  // const exampleConfig: Config = {
  //   port: 3000,
  //   orql: {
  //     dialect: 'mysql',
  //     connection: {
  //       host: 'localhost',
  //       username: 'username',
  //       password: 'password',
  //       database: 'test'
  //     }
  //   }
  // }
  // writeJsonSync(configPath, exampleConfig);
  throw new Error('config.json not exist');
}
const config: Config = readJsonSync(configJsonPath);

if (!fs.existsSync(schemaJsonPath)) {
  console.log('schema.json not exist');
  writeJsonSync(schemaJsonPath, []);
}

const schemas: Schema[] = readJsonSync(schemaJsonPath);

if (!fs.existsSync(apiJsonPath)) {
  console.log('api.json not exist');
  writeJsonSync(apiJsonPath, {apis: [], groups: []});
}

let funApis: {[name: string]: FunApi};

setTimeout(() => funApis = require(apiJsPath), 0);


const apiObject: ApiObject = readJsonSync(apiJsonPath);

export {config, schemas, funApis, apiObject};