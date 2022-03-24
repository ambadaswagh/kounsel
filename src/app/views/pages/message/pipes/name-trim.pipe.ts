import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nameTrim'
})
export class NameTrimPipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
    let maxLen = 25;
    let lastLim = maxLen-1;
    if(args.length){
      maxLen = args[0];
      lastLim = maxLen-1;
    }
    return value.length > maxLen ? '...' + value.substr(value.length-1-lastLim) : value;
  }

}
