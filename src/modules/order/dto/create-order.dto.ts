import { Optional } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsPositive, IsString } from "class-validator";

export class OrderItemDTO {
    @ApiProperty()
    @IsNotEmpty()
    SID_PRODUCT: string;

    @IsString()
    PRODUCT_NAME: string;

    @IsNumber()
    @IsPositive()
    QUANTITY: number;

    @IsNumber()
    HAVE_PROMO: number;

    @IsString()
    PROMO_NAME: string;

    @IsNumber()
    PRICE: number;

    @IsNumber()
    ORIG_PRICE: number;

    @IsString()
    ATTRIBUTE: string;

    @IsString()
    ITEMSIZE: string;
}

export class CreateOrderDTO {
    @ApiProperty()
    @IsNumber()
    STATUS: number;

    @Optional()
    ID: number;

    @Optional()
    SID_CUSTOMER: string;

    @Optional()
    SESSION_ID: string;

    @Optional()
    IP_ADDRESS: string;

    @IsNotEmpty()
    @IsEmail()
    EMAIL: string;

    @IsNotEmpty()
    S_FIRST_NAME: string;

    @IsNotEmpty()
    S_LAST_NAME: string;

    S_COMPANY: string;

    @IsNotEmpty()
    S_STREET_ADDRESS: string;

    @IsNotEmpty()
    S_COUNTRY: string;

    @IsNotEmpty()
    S_CITY: string;

    @IsNotEmpty()
    S_DISTRICT: string;

    @IsNumberString()
    S_PHONE: string;

    @IsNumber()
    ORDER_TYPE: number;

    @IsNotEmpty()
    @IsNumber()
    S_TYPE: number;

    @IsNotEmpty()
    @IsNumber()
    P_TYPE: number;

    @IsOptional()
    @IsString()
    STORE_ID: string;

    @IsOptional()
    PICKUP_DATETIME: Date;

    @IsOptional()
    NOTE: string;

    @IsNumber()
    DISC_AMT: number;

    @IsNumber()
    PAYMENT_METHOD: number;

    @IsString()
    PROMO_NAME: string;

    REDEEM_POINT: number;

    REDEEM_AMOUNT: number;

    COUPON_VALUE: number;

    COUPON_SID: string;

    @IsNumber()
    IS_ISSUE_INVOICE: number;

    @IsOptional()
    ISSUE_COMPANY_NAME: string;

    @IsOptional()
    ISSUE_COMPANY_ADDRESS: string;

    @IsOptional()
    ISSUE_COMPANY_TAX_NUMBER: string;

    ITEMS: OrderItemDTO[];


}