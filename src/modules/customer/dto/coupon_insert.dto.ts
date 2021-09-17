import {IsString, IsOptional, IsNumber, IsBoolean} from 'class-validator'

export default class CouponInsertDTO {
    @IsString()
    COUPON_NAME: string;

    @IsString()
    DESCRIPTION: string;

    @IsOptional()
    @IsNumber()
    APPLY_COUNT: number;

    START_DATE: string;
    
    END_DATE: string;

    START_TIME: number;

    END_TIME: number;

    @IsString()
    FILTER_STR: string;

    @IsBoolean()
    VALIDATION_USE_SUBTOTAL: boolean;

    @IsNumber()
    VALIDATION_SUBTOTAL: number;
    
    @IsNumber()
    REWARD_MODE: number;

    @IsNumber()
    REWARD_DISCOUNT_TYPE: number;

    @IsNumber()
    REWARD_DISCOUNT_VALUE: number;
}