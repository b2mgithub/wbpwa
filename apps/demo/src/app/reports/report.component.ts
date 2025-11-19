import { Component, Input } from '@angular/core';
import { CommonModule, DecimalPipe, PercentPipe, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-report-component',
  standalone: true,
  imports: [CommonModule],
  providers: [DecimalPipe, PercentPipe, CurrencyPipe],
  templateUrl: './report.component.html',
})
export class ReportComponent {
  @Input() list: any;
  @Input() getVarianceHighlightColor!: (variance: number) => string;
  @Input() getVarianceLowlightColor!: (variance: number) => string;
}
