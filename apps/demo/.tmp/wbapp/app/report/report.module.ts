import { NgModule } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { MaterialModule } from '@b2m/material';
import { ReportContainer } from './report.container';
import { ReportComponent } from './report.component';
import { RouterModule } from '@angular/router';
import { VarianceHighlightPipe, VarianceLowlightPipe } from './variance.pipe';
import { UiModule } from '@b2m/ui';
import { AuthGuard } from '@b2m/auth';

@NgModule({
  declarations: [ReportContainer, ReportComponent, VarianceHighlightPipe, VarianceLowlightPipe],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: "", redirectTo: formatDate(new Date(), 'yyyy-MM-dd', 'en-US'), pathMatch: 'full' },
      { path: ":Date", component: ReportContainer, canActivate: [ AuthGuard ] }
    ]),
    MaterialModule,
    UiModule,
  ]
})
export class ReportModule { }
