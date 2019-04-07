import process from 'process';
import fs from 'fs';
import path from 'path';
import Koa, {Context} from 'koa';
import Router from 'koa-router';
import BodyParser from 'koa-bodyparser';
import Cors from '@koa/cors';
import OrqlExecutor from 'orql-executor';
import {Api, Config, Schema} from './beans';
import {Columns} from 'orql-executor/lib/SchemaManager';

const cwd = process.cwd();
const configPath = path.resolve(cwd, './config.json');
const schemaPath = path.resolve(cwd, './schema.json');
const apiPath = path.resolve(cwd, './api.json');

async function exists(path: string) {
  try {
    await fs.promises.stat(path);
    return true;
  } catch (e) {
    return false;
  }
}

async function readJson(path: string) {
  const json = await fs.promises.readFile(path, {encoding: 'utf-8'});
  return JSON.parse(json as string);
}

async function writeJson(path: string, obj: any) {
  await fs.promises.writeFile(path, JSON.stringify(obj, null, 2), {encoding: 'utf-8'});
}

function responseJson(ctx: Context, body: any) {
  ctx.response.type = 'json';
  ctx.response.body = body;
}

function responseSuccess(ctx: Context, data?: any) {
  responseJson(ctx, {success: true, data});
}

function responseError(ctx: Context, msg?: string) {
  responseJson(ctx, {success: false, msg});
}

async function start() {
  if (!await exists(configPath)) {
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
    };
    await writeJson(configPath, exampleConfig);
    throw new Error('config.json not exist');
  }

  const config: Config = await readJson(configPath);

  if (!await exists(schemaPath)) {
    console.log('schema.json not exist');
    await fs.promises.writeFile(schemaPath, JSON.stringify([]), {encoding: 'utf-8'});
  }
  let schemas: Schema[] = await readJson(schemaPath);

  const orqlExecutor = new OrqlExecutor(config.orql);
  schemas.forEach(schema => {
    const columns: Columns = {};
    schema.columns.forEach(column => {
      columns[column.name] = column;
    });
    schema.associations.forEach(association => {
      columns[association.name] = association;
    });
    orqlExecutor.addSchema(schema.name, columns);
  });
  try {
    await orqlExecutor.sync('update');
  } catch (e) {
    console.error(e);
  }

  const app = new Koa();
  const router = new Router();

  if (!await exists(apiPath)) {
    console.log('api.json not exist');
    await writeJson(apiPath, []);
  }

  const apis: Api[] = await readJson(apiPath);

  router.get('/_edit/schemas', async (ctx) => {
    schemas = await readJson(schemaPath);
    responseSuccess(ctx, schemas);
  });

  router.post('/_edit/schemas', async (ctx) => {
    const {name, table} = ctx.request.body;
    if (schemas.find(schema => schema.name == name)) {
      responseError(ctx, `schema ${name} exists`);
      return;
    }
    const schema = {name, table, columns: [], associations: []};
    schemas.push(schema);
    await writeJson(schemaPath, schemas);
    responseSuccess(ctx);
  });

  router.delete('/_edit/schemas/:name', async (ctx) => {
    const {name} = ctx.params;
    const index = schemas.findIndex(schema => schema.name == name);
    if (index < 0) {
      responseError(ctx, `schema ${name} not exists`);
      return;
    }
    schemas.splice(index, 1);
    await writeJson(schemaPath, schemas);
    responseSuccess(ctx);
  });

  router.put('/_edit/schemas/:name', async (ctx) => {
    const schema = schemas.find(schema => schema.name == ctx.params.name);
    if (!schema) {
      responseError(ctx, `schema ${ctx.params.name} not exists`);
      return;
    }
    const {name, table} = ctx.request.body;
    schema.name = name;
    schema.table = table;
    await writeJson(schemaPath, schemas);
    responseSuccess(ctx);
  });

  router.post('/_edit/schemas/:name/columns', async (ctx) => {
    const column = ctx.request.body;
    const schema = schemas.find(schema => schema.name == ctx.params.name);
    if (!schema) {
      responseError(ctx, `schema ${ctx.params.name} not exists`);
      return;
    }
    if (schema.columns.find(_column => _column.name == column.name)) {
      responseError(ctx, `schema ${ctx.params.name} column ${column.name} exists`);
      return;
    }
    schema.columns.push(column);
    await writeJson(schemaPath, schemas);
    responseSuccess(ctx);
  });

  router.put('/_edit/schemas/:schemaName/columns/:columnName', async (ctx) => {
    const column = ctx.request.body;
    const {schemaName, columnName} = ctx.params;
    const schema = schemas.find(schema => schema.name == schemaName);
    if (!schema) {
      responseError(ctx, `schema ${ctx.params.name} not exists`);
      return;
    }
    const index = schema.columns.findIndex(column => column.name == columnName);
    schema.columns[index] = column;
    await writeJson(schemaPath, schemas);
    responseSuccess(ctx);
  });

  router.delete('/_edit/schemas/:schemaName/columns/:columnName', async (ctx) => {
    const {schemaName, columnName} = ctx.params;
    const schema = schemas.find(schema => schema.name == schemaName);
    if (!schema) {
      responseError(ctx, `schema ${ctx.params.name} not exists`);
      return;
    }
    const index = schema.columns.findIndex(column => column.name == columnName);
    schema.columns.splice(index, 1);
    await writeJson(schemaPath, schemas);
    responseSuccess(ctx);
  });

  router.post('/_edit/schemas/:name/associations', async (ctx) => {
    const association = ctx.request.body;
    const schema = schemas.find(schema => schema.name = ctx.params.name);
    if (!schema) {
      responseError(ctx, `schema ${ctx.params.name} not exists`);
      return;
    }
    schema.associations.push(association);
    await writeJson(schemaPath, schemas);
    responseSuccess(ctx);
  });

  router.delete('/_edit/schemas/:schemaName/associations/:associationName', async (ctx) => {
    const {schemaName, associationName} = ctx.params;
    const schema = schemas.find(schema => schema.name = schemaName);
    if (!schema) {
      responseError(ctx, `schema ${schemaName} not exists`);
      return;
    }
    const index = schema.associations.findIndex(association => association.name == associationName);
    if (index < 0) {
      responseError(ctx, `schema association ${associationName} not exists`);
      return;
    }
    schema.associations.splice(index, 1);
    await writeJson(schemaPath, schemas);
    responseSuccess(ctx);
  });

  router.put('/_edit/schemas/:schemaName/associations/:associationName', async (ctx) => {
    const {schemaName, associationName} = ctx.params;
    const association = ctx.request.body;
    const schema = schemas.find(schema => schema.name = schemaName);
    if (!schema) {
      responseError(ctx, `schema ${schemaName} not exists`);
      return;
    }
    const index = schema.associations.findIndex(association => association.name == associationName);
    if (index < 0) {
      responseError(ctx, `schema association ${associationName} not exists`);
      return;
    }
    schema.associations[index] = association;
    await writeJson(schemaPath, schemas);
    responseSuccess(ctx);
  });

  app.use(Cors());
  app.use(BodyParser());
  app.use(router.routes());
  app.listen(config.port);
  console.log(`Server running on port ${config.port}`);
}

start().catch(err => console.error(err));