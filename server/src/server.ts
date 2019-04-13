import Koa, {Context} from 'koa';
import Router from 'koa-router';
import BodyParser from 'koa-bodyparser';
import Cors from '@koa/cors';
import process from "process";
import orqlExecutor from './orqlExecutor';
import {config} from './config';

const cwd = process.cwd();

const app = new Koa();
const router = new Router();

export {router};

require('./editRoutes');
require('./orqlRoutes');

export default async function start() {
  await orqlExecutor.sync('update');
  app.use(Cors());
  app.use(BodyParser());
  app.use(router.routes());
  app.listen(config.port);
  console.log(`Server running on port ${config.port}`);
}