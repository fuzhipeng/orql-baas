import Koa, {Context} from 'koa';
import Router from 'koa-router';
import BodyParser from 'koa-bodyparser';
import Cors from '@koa/cors';
import orqlExecutor from './orqlExecutor';
import {config} from './config';

const app = new Koa();
export const router = new Router();

export interface ServerOptions {
  dev?: boolean;
}

export default async function start(options?: ServerOptions) {
  options = options || {};
  await orqlExecutor.sync('update');

  if (options.dev) {
    console.warn('start server dev mode');
    require('./routes/edit');
  }
  require('./routes/orql');

  app.use(Cors());
  app.use(BodyParser());
  app.use(router.routes());
  app.listen(config.port);
  console.log(`Server running on port ${config.port}`);
}