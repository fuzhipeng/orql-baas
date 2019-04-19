import {responseError, responseSuccess} from '../utils';
import {router} from '../server';
import {apiObject, plugins} from '../config';
import orqlExecutor from '../orqlExecutor';
import {ApiConfig} from '../beans';
import minimatch from 'minimatch';

router.all('/*', async (ctx, next) => {
  const api = apiObject.apis.find(api => api.url == ctx.request.path);
  if (!api) {
    return next();
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
    responseSuccess(ctx, result);
    return;
  }
  if (fun) {
    const apiFun = plugins[fun];
    if (!apiFun) {
      responseError(ctx, `fun ${fun} not exists`);
      return;
    }
    const res = {
      json: (body: any) => {
        ctx.response.type = 'json';
        ctx.response.body = body;
      },
      string: (text: string) => {
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