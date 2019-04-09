import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3000'
});

const apiInstance = axios.create({
  baseURL: 'http://localhost:3000'
});

interface JsonResponse<T> {
  success: boolean;
  data?: T;
  msg?: string;
}

export async function httpGet<T>(url: string, params?: any): Promise<JsonResponse<T>> {
  const res = await instance.get(url, params);
  return res.data;
}

export async function httpGetWithData<T>(url: string, params?: any): Promise<T | undefined> {
  const data = await httpGet<T>(url, params);
  return data.data;
}

export async function httpPost(url: string, data: any): Promise<JsonResponse<any>> {
  const res = await instance.post(url, data);
  return res.data;
}

export async function httpPut(url: string, data: any): Promise<JsonResponse<any>> {
  const res = await instance.put(url, data);
  return res.data;
}

export async function httpDelete<T>(url: string, params?: any): Promise<JsonResponse<T>> {
  const res = await instance.delete(url, params);
  return res.data;
}

export async function submitUrl(method: string, url: string, data?: any) {
  let res;
  switch (method) {
    case 'get':
      res = await apiInstance.get(url);
      break;
    case 'post':
      res = await apiInstance.post(url, data);
      break;
    case 'put':
      res = await apiInstance.put(url, data);
      break;
    case 'delete':
      res = await apiInstance.delete(url);
      break;
  }
  return res.data;
}