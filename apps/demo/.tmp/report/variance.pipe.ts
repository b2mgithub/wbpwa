import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'varianceHighlight'})
export class VarianceHighlightPipe implements PipeTransform {
  transform(variance: number): string {
    //console.log('variance called');
    return Math.abs(variance) > 0 ? (variance > 0 ? 'green' : 'red') : 'black';
  }
}

@Pipe({name: 'varianceLowlight'})
export class VarianceLowlightPipe implements PipeTransform {
  transform(variance: number): string {
    //console.log('variance called');
    return Math.abs(variance) > 0 ? (variance > 0 ? 'red' : 'green') : 'black';
  }
}