import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PaymentService } from '../../../../../../core/services/payment/payment.service';
import { RestBoolean } from '../../../../../../core/model/restBoolean.model';
import { PaymentMethod } from '../../../../../../core/model/paymentMethod.model';
import { PaymentIconService } from '../../../../../../core/services/utility/payment-icon.service';
import { BillingType } from '../../../../../../core/model/meeting/billing.model';
import { round } from 'lodash';

@Component({
  selector: 'kt-cost',
  templateUrl: './cost.component.html',
  styleUrls: ['./cost.component.scss']
})
export class CostComponent implements OnInit {
  @Input() paymentVerified: RestBoolean;
  @Input() cost: number;
  @Input() billing_type: BillingType;
  @Output() $continue = new EventEmitter<boolean>();

  screenType = 0;
  lastScreenType = 0;
  screenTypeVal = {
    INVALID_PAYMENT: 0,
    VALID_PAYMENT: 1,
    ADD_PAYMENT: 2
  }
  RestBoolean = RestBoolean;
  loadingExistingPayment = false;
  defaultPaymentMethod: PaymentMethod;
  existingPaymentMethods: PaymentMethod[];
  updatingDefaultPayment = false;
  newMethodAddeddChangedMessage = '';

  costToDisplay: any = '';

  constructor(
    private paymentService: PaymentService,
    private cdr: ChangeDetectorRef,
    public cardIcon: PaymentIconService
  ) { }

  ngOnInit() {
    if( this.billing_type == BillingType.PROFILE ){
      this.costToDisplay = round(this.cost*0.01, 2);
    }
    else if( this.billing_type == BillingType.FIXED ){
      this.costToDisplay = round(this.cost*0.01, 2);
    }


    if (this.paymentVerified == RestBoolean.TRUE) {
      this.screenType = this.screenTypeVal.VALID_PAYMENT;
      this.loadExistingPayment();
    }
    else {
      this.screenType = this.screenTypeVal.INVALID_PAYMENT;
    }
  }

  paymentSuffix(){
    if( this.billing_type == BillingType.PROFILE ){
      return ' per minute. You will be charged at end of this meeting';
    }
    else if( this.billing_type == BillingType.FIXED ){
      return ' applied for this session. You will be charged at end of this meeting';
    }
  }

  loadExistingPayment() {
    this.loadingExistingPayment = true;
    this.paymentService.getPaymentMethods().subscribe(
      response => {
        this.loadingExistingPayment = false;
        if (response.data.payment_method) {
          this.existingPaymentMethods = response.data.payment_method;
          this.getDefaultPaymentMethod(response.data.payment_method);
        }
        this.cdr.detectChanges();
      },
      err => {
        console.error(err);
        this.loadingExistingPayment = false;
      }
    )
  }

  getDefaultPaymentMethod(payload: PaymentMethod[]) {
    let x: PaymentMethod;
    for (let pm of payload) {
      if (pm.primary == RestBoolean.TRUE) {
        this.defaultPaymentMethod = pm;
        break;
      }
    }

  }

  continue(val: boolean) {
    this.$continue.emit(val)
  }

  closeWithoutPayment() {
    this.$continue.emit(false);
  }

  addCardOpen() {
    this.lastScreenType = this.screenType;
    this.screenType = this.screenTypeVal.ADD_PAYMENT;
  }

  addPaymentCanceled() {
    this.screenType = this.lastScreenType;
  }

  validPaymentContinue() {
    this.$continue.emit(true);
  }

  async changeDefaultPaymentMethod(pm: PaymentMethod) {
    try {
      if (this.updatingDefaultPayment) return;
      this.updatingDefaultPayment = true;
      this.cdr.detectChanges();

      const response = await this.paymentService.changeDefaultPayment({ card: pm }).toPromise();

      if (response.code != 200) {
        throw new Error('Error updating payment method');
      }

      this.updatingDefaultPayment = false;
      this.defaultPaymentMethod = pm;
      this.newMethodAddeddChangedMessage = 'Payment method changed successfully.';
      this.clearSuccess();
      this.cdr.detectChanges();
    } catch (error) {
      this.updatingDefaultPayment = false;
      this.cdr.detectChanges();
      console.error(error);
    }
  }

  delete(pm: PaymentMethod){
    this.paymentService.delete(pm.payment_method_id).subscribe(
      data => {
        console.log(data);
      },
      console.error
    )
  }

  canNotContinue() {
    return this.updatingDefaultPayment || this.loadingExistingPayment;
  }

  clearSuccess() {
    setTimeout(() => {
      if (this.newMethodAddeddChangedMessage) {
        this.newMethodAddeddChangedMessage = '';
        this.cdr.detectChanges();
      }
    }, 7000)
  }

  displayNewMethodMsg() {
    this.screenType = this.screenTypeVal.VALID_PAYMENT;
    this.newMethodAddeddChangedMessage = 'New payment method added successfully.';
    this.clearSuccess();
    this.loadExistingPayment();
  }

}
