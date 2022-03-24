import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'messageListLimit'
})
export class MessageListLimitPipe implements PipeTransform {

  transform(value: string, ...args: any[]): any {
    if (value.length > 78) {
      return value.substr(0, 78) + '...';
    }
    return value;
  }

}
