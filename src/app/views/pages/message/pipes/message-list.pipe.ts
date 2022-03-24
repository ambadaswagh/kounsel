import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'messageList'
})
export class MessageListPipe implements PipeTransform {

  transform(value: number, ...args: any[]): any {
    const dt = moment(value);
    const now = moment();
    if( dt.date() == now.date() && dt.year() == now.year() && dt.month() == now.month() ){
      return dt.format('h:mm a');
    }
    else if( dt.year() == now.year() && dt.month() == now.month() && now.date()-dt.date() == 1 ){
      return 'Yesterday';
    }
    return dt.format('MMM DD, YYYY')
  }

}
