import { Injectable } from '@angular/core';
import { BaseService } from '../base/base.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  constructor(
    private dataService: BaseService
  ) { }

  getPaymentMethods(){
    return this.dataService.httpGetWithHeader('payment/method');
  }

  changeDefaultPayment(body){
    return this.dataService.httpPutWithHeader('payment/method', body)
  }

  setNewPaymentMethod(payment_method_nonce: string){
    return this.dataService.httpPostWithHeader('payment/method', {payment_method_nonce})
  }

  delete(payment_method_nonce){
    return this.dataService.httpDeleteWithHeader('payment/method/'+payment_method_nonce);
  }
}
