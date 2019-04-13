import fs from "fs";
import {Context} from 'koa';

export async function readJson(path: string) {
  const json = await fs.promises.readFile(path, {encoding: 'utf-8'});
  return JSON.parse(json as string);
}

export function readJsonSync(path: string) {
  const json = fs.readFileSync(path, {encoding: 'utf-8'});
  return JSON.parse(json as string);
}

export async function writeJson(path: string, obj: any) {
  await fs.promises.writeFile(path, JSON.stringify(obj, null, 2), {encoding: 'utf-8'});
}

export function writeJsonSync(path: string, obj: any) {
  fs.writeFileSync(path, JSON.stringify(obj, null, 2), {encoding: 'utf-8'});
}

export function responseJson(ctx: Context, body: any) {
  ctx.response.type = 'json';
  ctx.response.body = body;
}

export function responseSuccess(ctx: Context, data?: any) {
  responseJson(ctx, {success: true, data});
}

export function responseError(ctx: Context, msg?: string) {
  responseJson(ctx, {success: false, msg});
}

export async function exists(path: string) {
  try {
    await fs.promises.stat(path);
    return true;
  } catch (e) {
    return false;
  }
}