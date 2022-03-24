import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from "@angular/core";
import * as braintree from 'braintree-web';
import { PaymentService } from '../../../../../../core/services/payment/payment.service';
import * as creditCardType from 'credit-card-type';
import { Brand } from '../../../../../../core/model/card.model';
import { PaymentIconService } from '../../../../../../core/services/utility/payment-icon.service';


@Component({
  selector: "kt-add-payment-method",
  templateUrl: "./add-payment-method.component.html",
  styleUrls: ["./add-payment-method.component.scss"],
})
export class AddPaymentMethodComponent implements OnInit {
  @Output() $cancel = new EventEmitter<any>();
  @Output() $newMethodAdded = new EventEmitter<any>();
  cardNumber: string = '';
  brand: Brand = Brand.UNKNOWN;

  cardType = 'Credit';
  cardTypes = [
    { id: "Debit", name: "Debit Card" },
    { id: "Credit", name: "Credit Card" },
  ];

  errorAddingPayment = ''

  month: string;
  months = [
    { id: "01" },
    { id: "02" },
    { id: "03" },
    { id: "04" },
    { id: "05" },
    { id: "06" },
    { id: "07" },
    { id: "08" },
    { id: "09" },
    { id: "10" },
    { id: "11" },
    { id: "12" },
  ];

  year: number;
  years = [];

  name: string;
  securityCode: string;

  addingPaymentMethod = false;
  constructor(
    private cdr: ChangeDetectorRef,
    private paymentService: PaymentService,
    public cardIcon: PaymentIconService
  ) { }

  ngOnInit() {
    const year = new Date().getFullYear();
    for (let i = 0; i < 50; i++) {
      this.years.push({ id: year + i });
    }
  }

  cardNumberChange(event) {
    setTimeout(() => {
      this.detectCardType();
    }, 0);

    const char = String.fromCharCode(event.keyCode);
    if (event.keyCode == 8) return;
    if (!/[0-9]/.test(char)) {
      event.preventDefault();
      return;
    }
  }

  isFormValid() {
    if (!this.cardNumber || !this.cardType || !this.name || !this.month || !this.year || !this.securityCode) {
      return false;
    }

    if (this.cardNumber.match(/^[0-9]$/)) {
      return false;
    }

    if (this.cardType != 'Debit' && this.cardType != 'Credit') {
      return false;
    }

    if (!this.securityCode.length) {
      return false;
    }

    return true;
  }

  toBrainTree(body: any) {
    return new Promise((resolve, reject) => {
      braintree.client.create({
        authorization: 'sandbox_rzyk3p3r_mzjq4hy5dqqm4y86'
      }, function (err, client) {
        if (err) {
          reject(err);
        }
        else {
          client.request({
            endpoint: 'payment_methods/credit_cards',
            method: 'post',
            data: body
          }, function (err, response) {
            if (err) {
              reject(err);
            }
            else {
              resolve(response.creditCards[0].nonce);
            }
          });
        }
      });
    })
  }

  async submit() {
    try {
      this.addingPaymentMethod = true;
      this.cdr.detectChanges();

      const methodBody = {
        creditCard: {
          number: this.cardNumber.split('-').join(''),
          expirationDate: `${this.month}/${this.year}`,
          cvv: this.securityCode,
          cardholderName: this.name
        }
      }

      const response = await this.toBrainTree(methodBody);

      const setToServerResponse = await this.paymentService.setNewPaymentMethod(response as string).toPromise();
      if (setToServerResponse.code != 200) {
        if (setToServerResponse.error) {
          this.errorAddingPayment = setToServerResponse.error.message;
        }
        else {
          this.errorAddingPayment = 'Something went wrong please try again.'
        }
        throw new Error('Error saving payment method to server');
      }
      this.$newMethodAdded.emit();
    } catch (error) {
      console.log(error);
    }
    finally {
      this.addingPaymentMethod = false;
      this.cdr.detectChanges();
    }
  }

  detectCardType() {
    if (this.cardNumber.length < 1) return;
    const card = creditCardType(this.cardNumber);
    if (!card.length) {
      this.brand = Brand.UNKNOWN;
    }
    else {
      switch (card[0].type) {
        case 'amex':
          this.brand = Brand.AMEX;
          break;
        case 'visa':
          this.brand = Brand.VISA;
          break;
        case 'mastercard':
          this.brand = Brand.MASTER_CARD;
          break;
        case 'discover':
          this.brand = Brand.DISCOVER;
          break;
        case 'jcb':
          this.brand = Brand.JCB;
          break;
        case 'diners-club':
          this.brand = Brand.DINERS;
          break;
        case 'strip':
          this.brand = Brand.STRIPE;
          break;
        case 'unionpay':
          this.brand = Brand.CHINA_UNION_PAY;
          break;
        case 'maestro':
          this.brand = Brand.MAESTRO;
          break;
        case 'american-express':
          this.brand = Brand.AMEX;
          break;
        default:
          this.brand = Brand.UNKNOWN;
          break;
      }
    }
    this.cdr.detectChanges();
  }

  cancel() {
    this.$cancel.emit();
  }
}
