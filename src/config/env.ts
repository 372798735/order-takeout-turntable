// 环境配置
export const config = {
  // 后端 API 地址配置
  api: {
    // 开发环境也直接访问后端服务器
    development: 'http://192.168.1.2:5000/api/v1',
    // 生产环境直接访问后端服务器
    production: 'http://47.113.179.233:8080/api/v1',
  },
  // 前端端口配置
  frontend: {
    development: 5173,
    production: 5173,
  },
};

// 获取当前环境的 API 基础地址
export function getApiBaseUrl(): string {
  const isDev = import.meta.env.DEV;
  return isDev ? config.api.development : config.api.production;
}
