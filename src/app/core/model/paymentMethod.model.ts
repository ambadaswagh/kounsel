import { Brand } from "./card.model";
import { RestBoolean } from './restBoolean.model';

export interface PaymentMethod {
    brand: Brand;
    card_holder_name: string;
    card_number: string;
    debit_type: string;
    last_update: number;
    payment_method_id: string;
    primary: RestBoolean;
    status: number;
    toc: number;
    user_id: string;
}
