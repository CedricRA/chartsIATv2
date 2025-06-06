import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChartComponent } from './chart/chart.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChartComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'Charts IAT v2';
}
