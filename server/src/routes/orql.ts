import {responseError, responseSuccess} from '../utils';
import {router} from '../server';
import {apiObject, pluginConfigs, plugins} from '../config';
import orqlExecutor from '../orqlExecutor';
import {ApiConfig, MatchType} from '../beans';
import minimatch from 'minimatch';

function getPlugins(url: string, api?: ApiConfig) {
  return pluginConfigs.filter(({matchType, matchValue}) =>
    (matchType == MatchType.Url && minimatch(url, matchValue)) ||
    (matchType == MatchType.Group && (api != undefined && matchValue == api.group))
  );
}

router.all('/*', async (ctx, next) => {
  const api = apiObject.apis.find(api => api.url == ctx.request.path);
  const matchConfigs = getPlugins(ctx.request.path, api);
  for (const config of matchConfigs) {
    const plugin = plugins[config.name];
    if (plugin && plugin.before) {
      const options = config.options ? JSON.parse(config.options) : undefined;
      const result = await plugin.before({ctx, options});
      if (result == false) return;
    }
  }
  if (!api) {
    return next();
  }
  if (!orqlExecutor) {
    responseError(ctx, `db not connect`);
    return;
  }
  const {page, size, ...other} = ctx.request.query;
  const params = {...other, ...ctx.request.body};
  const {orql, fun, options} = api;
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
    for (const config of matchConfigs) {
      const plugin = plugins[config.name];
      if (plugin && plugin.before) {
        const options = config.options ? JSON.parse(config.options) : undefined;
        const _result = await plugin.after({ctx, options, result});
        if (_result == false) return;
      }
    }
    responseSuccess(ctx, result);
    return;
  }
  // if (fun) {
  //   const apiFun = plugins[fun];
  //   if (!apiFun) {
  //     responseError(ctx, `fun ${fun} not exists`);
  //     return;
  //   }
  //   const res = {
  //     json: (body: any) => {
  //       ctx.response.type = 'json';
  //       ctx.response.body = body;
  //     },
  //     string: (text: string) => {
  //       ctx.response.body = text;
  //     }
  //   }
  //   const req = {
  //     params,
  //     page,
  //     size
  //   };
  //   await apiFun.handle({
  //     res,
  //     db: orqlExecutor,
  //     req,
  //     options: options ? JSON.parse(options) : {}
  //   });
  // }
});