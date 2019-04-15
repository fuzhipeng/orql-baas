import {responseError, responseSuccess} from '../utils';
import {router} from '../server';
import {apiObject, funApis, funPlugins} from '../config';
import orqlExecutor from '../orqlExecutor';
import {ApiConfig, MatchType} from '../beans';
import minimatch from 'minimatch';

function getPlugins(api: ApiConfig) {
  return apiObject.plugins.filter(({matchType, matchValue}) =>
    (matchType == MatchType.Group && matchValue == api.group) ||
    (matchType == MatchType.Url && minimatch(api.url, matchValue)));
}

router.all('/*', async (ctx, next) => {
  const api = apiObject.apis.find(api => api.url == ctx.request.path);
  if (!api) {
    return next();
  }
  const pluginConfigs = getPlugins(api);

  const {page, size, ...other} = ctx.request.query;
  const params = {...other, ...ctx.request.body};
  const {orql, fun, options} = api;
  for (const config of pluginConfigs) {
    const plugin = funPlugins[config.name];
    if (!plugin) {
      responseError(ctx, `plugin ${config.name} not exists`);
      return;
    }
    if (plugin.before) {
      // 执行前置拦截器
      const pResult = plugin.before({});
      if (pResult == false) return;
    }
  }
  if (orql) {
    const array = /\s*(\S+)\s/.exec(orql);
    if (!array) {
      responseError(ctx, `orql ${orql} error`);
      return;
    }
    const op = array[1];
    const session = await orqlExecutor.newSession();
    let result;
    switch (op) {
      case 'query':
        const options = page && size ? {offset: (page - 1) * size, size} : {};
        result = await session.query(orql, params, options);
        break;
      case 'count':
        result = await session.query(orql, params);
        break;
      case 'add':
        result = await session.add(orql, params);
        break;
      case 'update':
        result = await session.update(orql, params);
        break;
      case 'delete':
        result = await session.delete(orql, params);
        break;
    }
    for (const config of pluginConfigs) {
      const plugin = funPlugins[config.name];
      if (plugin && plugin.after) {
        // 执行后置拦截器
        const pResult = plugin.after({});
        if (pResult == false) return;
      }
    }
    responseSuccess(ctx, result);
    return;
  }
  if (fun) {
    const apiFun = funApis[fun];
    if (!apiFun) {
      responseError(ctx, `fun ${fun} not exists`);
      return;
    }
    const res = {
      _executePlugin: () => {
        for (const config of pluginConfigs) {
          const plugin = funPlugins[config.name];
          if (!plugin) {
            responseError(ctx, `plugin ${config.name} not exists`);
            return;
          }
          if (plugin && plugin.after) {
            // 执行后置拦截器
            const pResult = plugin.after({});
            if (pResult == false) return false;
          }
        }
      },
      json: (body: any) => {
        const result = res._executePlugin();
        if (result) return;
        ctx.response.type = 'json';
        ctx.response.body = body;
      },
      string: (text: string) => {
        const result = res._executePlugin();
        if (result) return;
        ctx.response.body = text;
      }
    }
    const req = {
      params,
      page,
      size
    };
    await apiFun.handle({
      res,
      db: orqlExecutor,
      req,
      options: options ? JSON.parse(options) : {}
    });
  }
});