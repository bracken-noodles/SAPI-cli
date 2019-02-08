export interface SwaggerConfig {
  proxy: ProxyItem[];
  dist: string;
}

export interface ProxyItem {
  prefix: string;
  namespace: string;
  swaggerJSON: string;
}

export enum HttpRequestMethod {
  POST = "POST",
  GET = "GET",
  DELETE = "DELETE",
  PUT = "PUT"
}
