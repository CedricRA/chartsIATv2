import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import {
  provideServerRendering,
  ɵSERVER_CONTEXT as SERVER_CONTEXT,
} from '@angular/platform-server';
import { provideServerRouting } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideServerRouting(serverRoutes),
    {
      provide: SERVER_CONTEXT,
      useValue: 'ssr-highcharts',
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
