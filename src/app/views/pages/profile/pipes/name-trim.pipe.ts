import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nameTrim'
})
export class NameTrimPipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
    return value.length > 20 ? '...' + value.substr(value.length-1-14) : value;
  }

}
