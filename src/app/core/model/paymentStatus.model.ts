export enum PaymentStatus{
    UNDEFINED = 0,
    NO_CHARGE = 2,
    FREE_LIMIT = 3,
    POSTED = 5,
    PAYMENT_GATEWAY_REJECTED = 7,
    TECH_FREE = 9,
    ERROR = 11,
    PENDING = 13,
    APPOINTMENT = 15,
    PROCESSING_STARTED = 17
}