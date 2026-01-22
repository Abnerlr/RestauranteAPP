import { Controller, Get, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';

interface RouteInfo {
  method: string;
  path: string;
}

@Controller('__routes')
export class DevController {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  @Get()
  getRoutes(): { routes: RouteInfo[] } {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    
    if (nodeEnv !== 'development') {
      throw new NotFoundException();
    }

    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const instance = httpAdapter.getInstance();
    
    const routes: RouteInfo[] = [];

    // Extract routes from Express router
    if (instance && instance._router && instance._router.stack) {
      const extractRoutes = (stack: any[], prefix = '') => {
        stack.forEach((layer: any) => {
          if (layer.route) {
            const route = layer.route;
            const methods = Object.keys(route.methods).map(m => m.toUpperCase());
            // Build full path with prefix
            let fullPath = prefix;
            if (route.path !== '/') {
              fullPath = prefix + route.path;
            }
            // Ensure path starts with /
            if (!fullPath.startsWith('/')) {
              fullPath = '/' + fullPath;
            }
            
            methods.forEach((method) => {
              routes.push({ method, path: fullPath });
            });
          } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
            // Extract prefix from regex - handle Express router regex patterns
            let newPrefix = prefix;
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
    }

    // Sort routes for better readability
    routes.sort((a, b) => {
      if (a.path !== b.path) {
        return a.path.localeCompare(b.path);
      }
      return a.method.localeCompare(b.method);
    });

    return { routes };
  }
}
