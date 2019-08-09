import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toBoolean'
})
export class ToBooleanPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    return Boolean(JSON.parse(value));
  }

}
