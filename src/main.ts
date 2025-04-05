import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import * as Highcharts from 'highcharts';

// Conditionally disable Highcharts SVG rendering for SSR
if (typeof window === 'undefined') {
  // We're in SSR mode
  (Highcharts as any).SVGRenderer.prototype.init = function () {};
  (Highcharts as any).Chart.prototype.renderTo = function () {};
}

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
