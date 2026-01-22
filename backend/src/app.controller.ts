import { Controller, Get, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import { isDevelopmentEnv, getNodeEnvInfo, isDevLoginEnabled } from './config/env';

interface RouteInfo {
  method: string;
  path: string;
}

@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  @Get('__health')
  getHealth() {
    const port = process.env.PORT ?? process.env.API_PORT ?? 3001;
    // Global prefix must match main.ts
    const globalPrefix = 'api/v1';
    const routesDebugUrl = `http://localhost:${port}/${globalPrefix}/__routes`;

    // Get consistent NODE_ENV info
    const configNodeEnv = this.configService.get<string>('NODE_ENV');
    const processNodeEnv = process.env.NODE_ENV;
    const nodeEnvInfo = getNodeEnvInfo(configNodeEnv ?? processNodeEnv);

    // Get DEV_LOGIN_ENABLED info
    const configDevLoginEnabled = this.configService.get<string>('DEV_LOGIN_ENABLED');
    const processDevLoginEnabled = process.env.DEV_LOGIN_ENABLED;
    const devLoginEnabled = isDevLoginEnabled(configDevLoginEnabled ?? processDevLoginEnabled);

    return {
      ok: true,
      name: 'restaurante-app-backend',
      port: Number(port),
      nodeEnv: nodeEnvInfo.normalized,
      nodeEnvRaw: processNodeEnv,
      configNodeEnv: configNodeEnv,
      nodeEnvNormalized: nodeEnvInfo.normalized,
      isDevelopment: nodeEnvInfo.isDevelopment,
      devLoginEnabled,
      globalPrefix,
      routesDebugUrl,
    };
  }

  @Get('__routes')
  getRoutes(): { routes: RouteInfo[] } {
    // Log that handler was hit
    console.log('[__routes] Handler called');
    
    // Get consistent NODE_ENV info
    const configNodeEnv = this.configService.get<string>('NODE_ENV');
    const processNodeEnv = process.env.NODE_ENV;
    const nodeEnvInfo = getNodeEnvInfo(configNodeEnv ?? processNodeEnv);
    
    console.log('[__routes] NODE_ENV info:', {
      processEnvNODE_ENV: processNodeEnv,
      configNODE_ENV: configNodeEnv,
      normalized: nodeEnvInfo.normalized,
      isDevelopment: nodeEnvInfo.isDevelopment,
    });
    
    if (!nodeEnvInfo.isDevelopment) {
      console.log('[__routes] Blocked: NODE_ENV is not development');
      throw new NotFoundException();
    }

    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const instance = httpAdapter.getInstance();
    
    if (!instance) {
      console.error('[__routes] No Express instance found');
      return { routes: [] };
    }

    if (!instance._router) {
      console.error('[__routes] No router found on Express instance');
      return { routes: [] };
    }

    if (!instance._router.stack) {
      console.error('[__routes] No router stack found');
      return { routes: [] };
    }

    const routes: RouteInfo[] = [];

    // Extract routes from Express router
    if (instance._router.stack) {
      const extractRoutes = (stack: any[], prefix = '') => {
        if (!Array.isArray(stack)) return;
        
        stack.forEach((layer: any) => {
          if (!layer) return;
          
          // Direct route
          if (layer.route) {
            const route = layer.route;
            const methods = Object.keys(route.methods || {})
              .filter(m => route.methods[m])
              .map(m => m.toUpperCase());
            
            if (methods.length === 0) return;
            
            // Build full path
            let fullPath = prefix;
            const routePath = route.path || '/';
            
            if (routePath === '/') {
              if (!prefix) {
                fullPath = '/';
              }
            } else {
              // Remove trailing slash from prefix if route path starts with /
              const cleanPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
              const cleanRoutePath = routePath.startsWith('/') ? routePath : '/' + routePath;
              fullPath = cleanPrefix + cleanRoutePath;
            }
            
            // Ensure path starts with /
            if (!fullPath.startsWith('/')) {
              fullPath = '/' + fullPath;
            }
            
            methods.forEach((method) => {
              routes.push({ method, path: fullPath });
            });
          } 
          // Router middleware (nested routes)
          else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
            let newPrefix = prefix;
            
            // Try to extract prefix from regex
            if (layer.regexp) {
              const regexSource = layer.regexp.source;
              // Match patterns like ^\/api\/v1 or ^\/api\/v1\/?$
              const match = regexSource.match(/^\^\\?\/?(.+?)(?:\\\/|\$)/);
              if (match && match[1]) {
                const extracted = match[1].replace(/\\/g, '');
                newPrefix = '/' + extracted;
              }
            }
            
            extractRoutes(layer.handle.stack, newPrefix);
          }
        });
      };

      extractRoutes(instance._router.stack);
    } else {
      console.warn('[__routes] Router stack is empty or undefined');
    }

    // Sort routes for better readability
    routes.sort((a, b) => {
      if (a.path !== b.path) {
        return a.path.localeCompare(b.path);
      }
      return a.method.localeCompare(b.method);
    });

    console.log(`[__routes] Returning ${routes.length} routes`);
    return { routes };
  }
}
