import { Component, Input } from "@angular/core";

@Component({
  selector: "report-component",
  template: `
    <table *ngFor="let division of list" style='width: 100%; border-spacing: 0; margin-bottom: 130px'>
      <tr>
        <td style="text-align: center; background-color: goldenrod;"><h2>{{ division.Division }}</h2></td>
      </tr>      
      <tr>
        <td>
          <table border="1" *ngFor="let block of division.Blocks" style='width: 100%; border-spacing: 0;'>
            <tr>
              <td colspan="7" style="text-align: center; background-color: rgb(241, 217, 154);"><h3>{{ block.Block }}</h3></td>
            </tr>
            <tr>
              <td colspan="7" style="text-align: center; background-color: gainsboro;"><b>Harvesting</b></td>
            </tr>
            <tr>
              <td style="text-align: center; width: 12%"></td>
              <td style="text-align: center; width: 12%"><b>Hours<br/>Allotted</b></td>
              <td style="text-align: center; width: 12%"><b>Hours<br/>Consumed</b></td>
              <td style="text-align: center; width: 12%"><b>% Hours<br/>Consumed</b></td>
              <td style="text-align: center; width: 12%"><b>% Block<br/>Complete</b></td>
              <td style="text-align: center; width: 12%"><b>m<sup>3</sup>/hr</b></td>
              <td style="text-align: center; width: 28%"><b>Variance<br/>of Hours</b></td>
            </tr>
            <tr *ngFor="let harvest of block.Harvesting">
              <td style="text-align: right; width: 12%"><b>{{ harvest.Metric }}:</b></td>
              <td style="text-align: center; width: 12%">{{ harvest.HPlan | number }}</td>
              <td style="text-align: center; width: 12%">{{ harvest.HSum | number }}</td>
              <td style="text-align: center; width: 12%">{{ harvest.HP | percent:'1.2-2' }}</td>
              <td style="text-align: center; width: 12%">{{ harvest.PMax | percent:'1.2-2' }}</td>
              <td style="text-align: center; width: 12%">{{ (harvest.HVol || 0) | number }}</td>
              <td style="text-align: center; width: 28%" [style.color]="harvest.PVar | varianceHighlight">{{ harvest.HVar | number:'1.2-2' }} ({{ harvest.PVar | percent:'1.2-2' }})</td>
            </tr>
            <tr>
              <td colspan="7" style="text-align: center; background-color: gainsboro;"><b>Road Construction</b></td>
            </tr>
            <tr>
              <td style="text-align: center;"><b>Road<br/>Length</b></td>
              <td style="text-align: center;"><b>Budgeted<br/>Cost</b></td>
              <td style="text-align: center;"><b>Accumulated<br/>Cost</b></td>
              <td style="text-align: center;"><b>% Road<br/>Constructed</b></td>
              <td style="text-align: center;"><b>Cost/km<br/>Constructed</b></td>
              <td style="text-align: center;"><b>Budget<br/>Cost/km</b></td>
              <td style="text-align: center;"><b>Variance<br/>Cost/km</b></td>
            </tr>
            <tr>
              <td style="text-align: center;"><b>{{ block.RoadConstruction.Km | number }} Kms</b></td>
              <td style="text-align: center;"><b>{{ block.RoadConstruction.Plan | currency }}</b></td>
              <td style="text-align: center;">{{ block.RoadConstruction.AccumulatedCost | currency }}</td>
              <td style="text-align: center;">{{ block.RoadConstruction.CompleteP | percent:'1.2-2' }}</td>
              <td style="text-align: center;">{{ (block.RoadConstruction.CostPerKm || 0)  | currency }}</td>
              <td style="text-align: center;">{{ (block.RoadConstruction.TargetPerKm || 0) | currency }}</td>
              <td style="text-align: center;" [style.color]="block.RoadConstruction.PVar  | varianceLowlight">{{ (block.RoadConstruction.Var || 0) | currency }} ({{ (block.RoadConstruction.PVar || 0) | percent:'1.2-2' }})</td>
            </tr>
            <tr>
              <td colspan="7" style="text-align: center; background-color: gainsboro;"><b>Gravelling</b></td>
            </tr>
            <tr>
              <td style="text-align: center;"><b>Graveling<br/>Length</b></td>
              <td style="text-align: center;"><b>Budgeted<br/>Cost</b></td>
              <td style="text-align: center;"><b>Accumulated<br/>Cost</b></td>
              <td style="text-align: center;"><b>% Road<br/>Graveled</b></td>
              <td style="text-align: center;"><b>Cost/km<br/>Graveled</b></td>
              <td style="text-align: center;"><b>Budget<br/>Cost/km</b></td>
              <td style="text-align: center;"><b>Variance<br/>Cost/km</b></td>
            </tr>
            <tr>
              <td style="text-align: center;"><b>{{ block.Graveling.Km | number }} Kms</b></td>
              <td style="text-align: center;"><b>{{ block.Graveling.Plan | currency }}</b></td>
              <td style="text-align: center;">{{ block.Graveling.AccumulatedCost | currency }}</td>
              <td style="text-align: center;">{{ block.Graveling.CompleteP | percent:'1.2-2' }}</td>
              <td style="text-align: center;">{{ (block.Graveling.CostPerKm || 0) | currency }}</td>
              <td style="text-align: center;">{{ (block.Graveling.TargetPerKm || 0) | currency }}</td>
              <td style="text-align: center;" [style.color]="block.Graveling.PVar | varianceLowlight">{{ (block.Graveling.Var || 0) | currency}} ({{ (block.Graveling.PVar || 0) | percent:'1.2-2' }})</td>
            </tr>
          </table>          
        </td>        
      </tr>
    </table>
  `
})
export class ReportComponent {

  @Input() list: any;

}
