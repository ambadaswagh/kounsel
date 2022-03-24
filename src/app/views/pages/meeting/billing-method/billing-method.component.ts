import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef, HostListener } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BillingType } from '../../../../core/model/meeting/billing.model';

@Component({
  selector: 'kt-billing-method',
  templateUrl: './billing-method.component.html',
  styleUrls: ['./billing-method.component.scss']
})
export class BillingMethodComponent implements OnInit {
  @Output() $billingStatus = new EventEmitter<any>();
  @Output() $back = new EventEmitter<any>();
  billingMethod : BillingType = BillingType.NONE;
  amount;
  amountErrors = '';

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    const elem = document.getElementById('billingMethod') as HTMLDivElement;
    elem.style.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)+'px';
  }

  constructor(private cdr: ChangeDetectorRef, public translateService: TranslateService) { }

  ngOnInit() {
    const elem = document.getElementById('billingMethod') as HTMLDivElement;
    elem.style.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)+'px';
  }

  ngOnViewInit(){
    const elem = document.getElementById('billingMethod') as HTMLDivElement;
    elem.style.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)+'px';
  }

  initBilling(){
    this.billingMethod = BillingType.NONE;
    this.amount = undefined;
    this.amountErrors = '';
  }

  isValid(){
    if( this.billingMethod != BillingType.PROFILE && this.billingMethod != BillingType.FIXED ){ 
      return false;
    }

    if( this.billingMethod == BillingType.FIXED && this.amountErrors != '' ){
      return false;
    }
    else if( this.billingMethod == BillingType.FIXED  && (!this.amount || this.amount <= 0)){
      return false;
    }
    return true;
  }

  billingSelected(){
    const billingInfo = {
      billing_type: this.billingMethod,
      amount: this.amount? parseInt((this.amount*100).toString()): 0
    }

    // console.log(billingInfo)
    this.$billingStatus.emit(billingInfo);
  }

  // inputChange(event){
  //   const val: string = event.target.value;
  //   if( val.match(/^[0-9]+$/) ){
  //     if( parseInt(val) < 1 ){
  //       this.amountErrors = 'Please enter a valid amount.';
  //       this.cdr.detectChanges();
  //       return;
  //     }
  //   }
  //   else if( val.match(/\./) ){
  //     this.amountErrors = 'Please enter whole numbers only.'
  //     this.cdr.detectChanges();
  //     return;
  //   }
  //   else{
  //     if( val.length == 0 ){
  //       this.amountErrors = 'Field is required.';
  //       this.cdr.detectChanges();
  //       return;
  //     }
  //     this.amountErrors = 'Only numbers are allowed.';
  //     this.cdr.detectChanges();
  //     return;
  //   }
  //   this.amountErrors = '';
  //   this.cdr.detectChanges();
  // }

  back(){
    this.$back.emit();
  }

  moveToEnd(inp) {
		setImmediate(()=>{
			const len = inp.target.value.length;
			inp.target.setSelectionRange(len, len);
		})
	}

}
