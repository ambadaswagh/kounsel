import { Injectable } from '@angular/core';
import { Brand } from '../../model/card.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentIconService {
  basePath = 'assets/media/icons/svg/paymentCards/';
  constructor() { }
  getIcon(cardType: Brand) {
    switch (cardType) {
      case Brand.AMEX:
        return this.basePath + 'amex.svg';
      case Brand.CHINA_UNION_PAY:
        return this.basePath + 'unionpay.svg';
      case Brand.DINERS:
        return this.basePath + 'diners.svg';
      case Brand.DISCOVER:
        return this.basePath + 'discover.svg';
      case Brand.JCB:
        return this.basePath + 'jcb.svg';
      case Brand.MAESTRO:
        return this.basePath + 'maestro.svg';
      case Brand.MASTER_CARD:
        return this.basePath + 'mastercard.svg';
      case Brand.PAY_PAL:
        return this.basePath + 'paypal.svg';
      case Brand.VISA:
        return this.basePath + 'visa.svg';
      default:
        return this.basePath + 'default.svg';
    }
  }

  getName(cardType: Brand) {
    switch (cardType) {
      case Brand.AMEX:
        return 'Amex';
      case Brand.BIT_COIN:
        return 'Bitcoin';
      case Brand.BTC:
        return 'BTC';
      case Brand.CARTE_BLANCHE:
        return 'Carte Blanche';
      case Brand.CHINA_UNION_PAY:
        return 'Union Pay';
      case Brand.DINERS:
        return 'Diners';
      case Brand.DISCOVER:
        return 'Discover';
      case Brand.JCB:
        return 'JCB';
      case Brand.MAESTRO:
        return 'Maestro';
      case Brand.MASTER_CARD:
        return 'Master Card';
      case Brand.PAY_PAL:
        return 'PayPal';
      case Brand.SOLO:
        return 'Solo';
      case Brand.STRIPE:
        return 'Stripe';
      case Brand.SWITCH:
        return 'Switch';
      case Brand.VISA:
        return 'Visa';
      default:
        return 'Card'
    }
  }
}
