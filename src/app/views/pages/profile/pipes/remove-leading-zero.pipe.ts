import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'removeLeadingZero'
})
export class RemoveLeadingZeroPipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
    let _value = value.toString();
    _value = _value.replace(/^0+/, '');
    return _value;
  }

}
