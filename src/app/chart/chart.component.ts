import {
  Component,
  OnInit,
  PLATFORM_ID,
  Inject,
  NgZone,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HighchartsChartModule } from 'highcharts-angular';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [HighchartsChartModule],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss',
})
export class ChartComponent implements OnInit, AfterViewInit {
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {};
  updateFlag = false;
  isBrowser: boolean;
  chartInstance: any;
  chartCallback: Highcharts.ChartCallbackFunction = (chart) => {
    this.chartInstance = chart;

    // Add hatched area after chart is created
    if (this.isBrowser) {
      setTimeout(() => {
        this.addHatchedArea(chart);
      }, 200);
    }
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private zone: NgZone,
    private el: ElementRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Initialize minimal options for SSR
    this.setMinimalOptions();
  }

  ngOnInit() {
    // Only initialize full chart in browser
    if (this.isBrowser) {
      // Use NgZone to avoid change detection issues
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.initChart();
        });
      });
    }
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      // Ensure chart is resized properly
      setTimeout(() => {
        if (this.chartInstance) {
          this.chartInstance.reflow();
        }
      }, 300);

      // Add resize event listener
      window.addEventListener('resize', () => {
        if (this.chartInstance) {
          this.chartInstance.reflow();
          // Re-add hatched area on resize
          this.addHatchedArea(this.chartInstance);
        }
      });
    }
  }

  // Add custom hatched area to the chart
  addHatchedArea(chart: any) {
    if (!chart || !chart.xAxis || !chart.yAxis) return;

    try {
      // Clear any existing hatched area
      if (chart.hatchGroup) {
        chart.hatchGroup.destroy();
      }

      // Month ranges (May to August)
      const xMin = 4; // May (0-indexed)
      const xMax = 8; // September (exclusive end)

      // Temperature ranges
      const yMin = 25; // Upper temperature bound
      const yMax = 5; // Lower temperature bound

      // Convert data coordinates to pixel coordinates
      const x1 = chart.xAxis[0].toPixels(xMin);
      const x2 = chart.xAxis[0].toPixels(xMax);
      const y1 = chart.yAxis[0].toPixels(yMin); // This will be lower on screen (higher temp)
      const y2 = chart.yAxis[0].toPixels(yMax); // This will be higher on screen (lower temp)

      // Width and height of the rectangle
      const width = x2 - x1;
      const height = y2 - y1;

      // Create a group for all hatched elements
      chart.hatchGroup = chart.renderer.g().add();

      // Add background rectangle with blue tint
      chart.renderer
        .rect(x1, y1, width, height)
        .attr({
          fill: 'rgba(173, 216, 250, 0.7)',
          zIndex: 0,
        })
        .add(chart.hatchGroup);

      // Create a clipping path for the hatched lines
      const clipId = 'clip-path-' + Date.now();
      const clipPath = chart.renderer.clipRect(x1, y1, width, height);
      chart.renderer.definition({
        tagName: 'clipPath',
        id: clipId,
        children: [
          {
            tagName: 'rect',
            x: x1,
            y: y1,
            width: width,
            height: height,
          },
        ],
      });

      // Create a group for hatched lines with clipping
      const linesGroup = chart.renderer
        .g()
        .attr({
          'clip-path': 'url(#' + clipId + ')',
        })
        .add(chart.hatchGroup);

      // Add diagonal hatching lines (from bottom-left to top-right)
      const lineSpacing = 12;
      const numLines = Math.ceil((width + height) / lineSpacing) + 5;
      const startX = x1 - height; // Start left of the visible area to ensure coverage

      for (let i = 0; i < numLines; i++) {
        const lineX = startX + i * lineSpacing;
        chart.renderer
          .path([
            'M',
            lineX,
            y2, // Start at bottom-left
            'L',
            lineX + height,
            y1, // Go to top-right
          ])
          .attr({
            stroke: 'rgba(249, 252, 253, 0.95)',
            'stroke-width': 1,
            zIndex: 1,
          })
          .add(linesGroup);
      }
    } catch (err) {
      console.error('Error creating hatched area:', err);
    }
  }

  setMinimalOptions() {
    this.chartOptions = {
      chart: {
        type: 'line',
        styledMode: false,
        width: null,
        height: null,
      },
      title: {
        text: 'Loading chart...',
      },
      series: [
        {
          type: 'line',
          data: [],
        },
      ],
    };
  }

  initChart() {
    const containerWidth =
      this.el.nativeElement.querySelector('.chart-container')?.offsetWidth ||
      window.innerWidth * 0.9;

    this.chartOptions = {
      chart: {
        type: 'line',
        spacingLeft: 10,
        spacingRight: 10,
        spacingTop: 20,
        spacingBottom: 20,
        reflow: true,
        animation: true,
        backgroundColor: 'transparent',
        width: null,
        height: null,
        events: {
          load: function () {
            // Force reflow after load
            setTimeout(() => {
              this.reflow();
            }, 100);
          },
        },
      },
      title: {
        text: 'Monthly Average Temperature',
      },
      subtitle: {
        text: 'Source: WorldClimate.com',
      },
      xAxis: {
        categories: [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ],
        labels: {
          style: {
            fontSize: '14px',
          },
        },
        tickWidth: 1,
        lineWidth: 1,
      },
      yAxis: {
        title: {
          text: 'Temperature (°C)',
          style: {
            fontSize: '14px',
          },
        },
        labels: {
          style: {
            fontSize: '13px',
          },
        },
        gridLineWidth: 1,
      },
      legend: {
        itemStyle: {
          fontSize: '14px',
        },
        layout: 'horizontal',
        align: 'center',
        verticalAlign: 'bottom',
      },
      plotOptions: {
        series: {
          lineWidth: 3,
          marker: {
            radius: 5,
            symbol: 'circle',
          },
          animation: {
            duration: 1000,
          },
          zIndex: 10, // Ensure lines are above plot bands
        },
      },
      responsive: {
        rules: [
          {
            condition: {
              maxWidth: 500,
            },
            chartOptions: {
              legend: {
                layout: 'horizontal',
                align: 'center',
                verticalAlign: 'bottom',
              },
            },
          },
        ],
      },
      series: [
        {
          name: 'Tokyo',
          type: 'line',
          color: '#0099FF',
          data: [
            7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6,
          ],
        },
        {
          name: 'New York',
          type: 'line',
          color: '#FF9933',
          data: [
            -0.2, 0.8, 5.7, 11.3, 17.0, 22.0, 24.8, 24.1, 20.1, 14.1, 8.6, 2.5,
          ],
        },
      ],
      credits: {
        enabled: true,
        style: {
          fontSize: '12px',
        },
      },
    };

    // Run inside Angular zone to trigger change detection
    this.zone.run(() => {
      this.updateFlag = true;
    });
  }
}
