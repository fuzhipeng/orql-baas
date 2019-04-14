import {responseError, responseSuccess} from '../utils';
import {router} from '../server';
import {apiConfig, funMap} from '../config';
import orqlExecutor from '../orqlExecutor';

router.all('/*', async (ctx, next) => {
  const index = apiConfig.apis.findIndex(api => api.url == ctx.request.path);
  if (index < 0) {
    return next();
  }
  const {page, size, ...other} = ctx.request.query;
  const params = {...other, ...ctx.request.body};
  const {orql, fun, options} = apiConfig.apis[index];
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
    const _fun = funMap[fun];
    if (!_fun) {
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
    };
    const req = {
      params,
      page,
      size
    };
    await _fun({
      res,
      db: orqlExecutor,
      req,
      options: options ? JSON.parse(options) : {}
    });
  }
});