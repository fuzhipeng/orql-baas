import {router} from '../server';
import orqlExecutor from '../orqlExecutor';
import {responseError, responseSuccess, writeJson} from '../utils';
import {
  apiObject,
  apiJsonPath,
  plugins,
  schemaJsonPath,
  schemas,
  pluginConfigs,
  pluginJsonPath,
  config, configJsonPath
} from '../config';

// 同步表结构
router.put('/_edit/sync', async (ctx) => {
  orqlExecutor && await orqlExecutor.sync('update');
  responseSuccess(ctx);
});

// 获取schema
router.get('/_edit/schemas', async (ctx) => {
  responseSuccess(ctx, schemas);
});

// 添加schema
router.post('/_edit/schemas', async (ctx) => {
  const {name, table} = ctx.request.body;
  if (schemas.find(schema => schema.name == name)) {
    responseError(ctx, `schema ${name} exists`);
    return;
  }
  const schema = {name, table, columns: [], associations: []};
  schemas.push(schema);
  await writeJson(schemaJsonPath, schemas);
  responseSuccess(ctx);
});

// 删除schema
router.delete('/_edit/schemas/:name', async (ctx) => {
  const {name} = ctx.params;
  const index = schemas.findIndex(schema => schema.name == name);
  if (index < 0) {
    responseError(ctx, `schema ${name} not exists`);
    return;
  }
  schemas.splice(index, 1);
  await writeJson(schemaJsonPath, schemas);
  responseSuccess(ctx);
});

// 修改schema
router.put('/_edit/schemas/:name', async (ctx) => {
  const schema = schemas.find(schema => schema.name == ctx.params.name);
  if (!schema) {
    responseError(ctx, `schema ${ctx.params.name} not exists`);
    return;
  }
  const {name, table} = ctx.request.body;
  schema.name = name;
  schema.table = table;
  await writeJson(schemaJsonPath, schemas);
  responseSuccess(ctx);
});

// 添加列
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
  await writeJson(schemaJsonPath, schemas);
  responseSuccess(ctx);
});

// 修改列
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
  await writeJson(schemaJsonPath, schemas);
  responseSuccess(ctx);
});

// 删除列
router.delete('/_edit/schemas/:schemaName/columns/:columnName', async (ctx) => {
  const {schemaName, columnName} = ctx.params;
  const schema = schemas.find(schema => schema.name == schemaName);
  if (!schema) {
    responseError(ctx, `schema ${ctx.params.name} not exists`);
    return;
  }
  const index = schema.columns.findIndex(column => column.name == columnName);
  schema.columns.splice(index, 1);
  await writeJson(schemaJsonPath, schemas);
  responseSuccess(ctx);
});

// 添加关联
router.post('/_edit/schemas/:name/associations', async (ctx) => {
  const schemaName = ctx.params.name;
  const association = ctx.request.body;
  const schema = schemas.find(schema => schema.name == schemaName);
  if (!schema) {
    responseError(ctx, `schema ${schemaName} not exists`);
    return;
  }
  schema.associations.push(association);
  await writeJson(schemaJsonPath, schemas);
  responseSuccess(ctx);
});

// 删除关联
router.delete('/_edit/schemas/:schemaName/associations/:associationName', async (ctx) => {
  const {schemaName, associationName} = ctx.params;
  const schema = schemas.find(schema => schema.name == schemaName);
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
  await writeJson(schemaJsonPath, schemas);
  responseSuccess(ctx);
});

// 修改关联
router.put('/_edit/schemas/:schemaName/associations/:associationName', async (ctx) => {
  const {schemaName, associationName} = ctx.params;
  const association = ctx.request.body;
  const schema = schemas.find(schema => schema.name == schemaName);
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
  await writeJson(schemaJsonPath, schemas);
  responseSuccess(ctx);
});

// 添加api分组
router.post('/_edit/apiGroups', async (ctx) => {
  const {name} = ctx.request.body;
  if (apiObject.groups.find(group => group == name)) {
    responseError(ctx, `group ${name} exists`);
    return;
  }
  apiObject.groups.push(name);
  await writeJson(apiJsonPath, apiObject);
  responseSuccess(ctx);
});

// 获取api分组
router.get('/_edit/apiGroups', async (ctx) => {
  responseSuccess(ctx, apiObject.groups);
});

// 修改api分组
router.put('/_edit/apiGroups/:name', async (ctx) => {
  const old = ctx.params.name;
  const {name} = ctx.request.body;
  const index = apiObject.groups.findIndex(group => group == old);
  if (index < 0) {
    responseError(ctx, `group ${old} not exists`);
    return;
  }
  if (apiObject.groups.find(group => group == name)) {
    responseError(ctx, `group ${name} exists`);
    return;
  }
  apiObject.groups[index] = name;
  apiObject.apis
    .filter(api => api.group == old)
    .forEach(api => api.group = name);
  await writeJson(apiJsonPath, apiObject);
  responseSuccess(ctx);
});

// 删除api分组
router.delete('/_edit/apiGroups/:name', async (ctx) => {
  const old = ctx.params.name;
  const index = apiObject.groups.findIndex(group => group == old);
  if (index < 0) {
    responseError(ctx, `group ${old} not exists`);
    return;
  }
  if (apiObject.apis.find(api => api.group == old)) {
    responseError(ctx, `group ${old} has api`);
    return;
  }
  apiObject.groups.splice(index, 1);
  await writeJson(apiJsonPath, apiObject);
  responseSuccess(ctx);
});

// 添加api
router.post('/_edit/apis', async (ctx) => {
  const api = ctx.request.body;
  apiObject.apis.push(api);
  await writeJson(apiJsonPath, apiObject);
  responseSuccess(ctx);
});

//获取api
router.get('/_edit/apis', async (ctx) => {
  responseSuccess(ctx, apiObject.apis);
});

// 删除api
router.delete('/_edit/apis/:url', async (ctx) => {
  const {url} = ctx.params;
  const index = apiObject.apis.findIndex(api => api.url == url);
  if (index < 0) {
    responseError(ctx, `api ${url} not exists`);
    return;
  }
  apiObject.apis.splice(index, 1);
  await writeJson(apiJsonPath, apiObject);
  responseSuccess(ctx);
});

// 修改api
router.put('/_edit/apis/:url', async (ctx) => {
  const {url} = ctx.params;
  const api = ctx.request.body;
  const index = apiObject.apis.findIndex(api => api.url == url);
  if (index < 0) {
    responseError(ctx, `api ${url} not exists`);
    return;
  }
  apiObject.apis[index] = api;
  await writeJson(apiJsonPath, apiObject);
  responseSuccess(ctx);
});

// 获取plugins
router.get('/_edit/plugins', async (ctx) => {
  const array = Object.keys(plugins).map(name => ({...plugins[name], name}));
  responseSuccess(ctx, array);
});

// 获取插件配置
router.get('/_edit/pluginConfigs', async (ctx) => {
  responseSuccess(ctx, pluginConfigs);
});

// 添加插件配置
router.post('/_edit/pluginConfigs', async (ctx) => {
  const config = ctx.request.body;
  pluginConfigs.push(config);
  await writeJson(pluginJsonPath, pluginConfigs);
  responseSuccess(ctx);
});

// 修改插件配置
router.put('/_edit/pluginConfigs/:index', async (ctx) => {
  const config = ctx.request.body;
  const {index} = ctx.params;
  pluginConfigs[index] = config;
  await writeJson(pluginJsonPath, pluginConfigs);
  responseSuccess(ctx);
});

// 删除插件配置
router.delete('/_edit/pluginConfigs/:index', async (ctx) => {
  const {index} = ctx.params;
  pluginConfigs.splice(index, 1);
  await writeJson(pluginJsonPath, pluginConfigs);
  responseSuccess(ctx);
});

// 修改orql配置
router.put('/_edit/config/orql', async (ctx) => {
  const orql = ctx.request.body;
  config.orql = orql;
  await writeJson(configJsonPath, config);
  responseSuccess(ctx);
});

// 查询数据
router.get('/_edit/queryData', async (ctx) => {
  if (!orqlExecutor) {
    responseError(ctx, 'db not connect');
    return;
  }
  const session = await orqlExecutor.newSession();
  const {schema, order} = ctx.request.query;
  if (schema) {
    const result = await session.query(`query ${schema}(${order ? order : ''}): [*]`, {}, {limit: 100});
    responseSuccess(ctx, result);
  }
  await session.close();
});