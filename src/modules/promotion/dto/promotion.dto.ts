import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {IsNotEmpty, IsString, IsBoolean, IsNumber, IsArray, ValidateNested, IsDate, IsDateString, IsObject, IsOptional, ValidateIf} from 'class-validator'
import PromotionValidationItemRuleDTO from './promotion_validation_item_rule.dto';
import PromotionValidationCustomerLoyaltyDTO from './promotion_validation_customer_loyalty.dto';
import PromotionRewardDiscountItemDTO from './promotion_reward_dicount_item.dto'

class PromotionDTO{
    @ApiProperty()
    DESCRIPTION: string;

    @IsNotEmpty()
    CREATED_BY: string;

    @IsNotEmpty()
    PROMO_NAME: string;

    @IsNotEmpty()
    DISCOUNT_REASON: string;

    PROMO_GROUP: string;

    @IsNotEmpty()
    PROMO_TYPE: number;

    @IsDateString()
    START_DATE: Date;

    @IsDateString()
    END_DATE: Date;    
    
    @IsNumber()
    START_TIME: number;

    @IsNumber()
    END_TIME: number;

    @IsNotEmpty()
    @IsBoolean()
    USE_STORES: boolean;

    @IsNotEmpty()
    @IsBoolean()
    USE_PRICE_LEVEL: boolean;

    @IsNotEmpty()
    @IsBoolean()
    CAN_BE_COMBINED: boolean;

    @IsNumber()
    @ValidateIf((object, value) => value !== null)
    APPLY_COUNT: number;

    @IsNotEmpty()
    @IsBoolean()
    VALIDATION_USE_ITEMS: boolean;

    @IsNotEmpty()
    @IsNumber()
    VALIDATION_USE_SUBTOTAL: boolean;

    @IsNumber()
    VALIDATION_SUBTOTAL: number;

    @IsNotEmpty()
    @IsBoolean()
    VALIDATION_USE_COUPON: boolean;

    @IsNotEmpty()
    @IsBoolean()
    VALIDATION_USE_CUSTOMERS: boolean;

    @IsNotEmpty()
    @IsNumber()
    VALIDATION_CUSTOMER_LOYALTY: number;

    @IsNumber()
    @IsNotEmpty()
    VALIDATION_CUSTOMER_FILTER: number;

    @IsString()
    VALIDATION_CUSTOMER_FILTER_STR: string;

    @IsNotEmpty()
    @IsBoolean()
    REWARD_VALIDATION_ITEMS: boolean;

    @IsNumber()
    REWARD_VALIDATION_MODE: number;

    @IsNumber()
    REWARD_VALIDATION_DISC_TYPE: number;

    @IsNumber()
    REWARD_VALIDATION_DISC_VALUE: number;

    @IsNumber()
    @IsNotEmpty()
    REWARD_MODE: number;

    @IsOptional()
    @IsString()
    REWARD_ITEMS_SID: string;

    @IsNotEmpty()
    @IsBoolean()
    REWARD_TRANSACTION: boolean;

    @IsNumber()
    REWARD_TRANSACTION_MODE: number;

    @IsOptional()
    @IsNumber()
    REWARD_TRANSACTION_DISC_TYPE: number;

    @IsOptional()
    @IsNumber()
    REWARD_TRANSACTION_DISC_VALUE: number;

    @IsArray()
    @ValidateNested({each: true})
    @Type(() => PromotionValidationItemRuleDTO)
    item_rule: PromotionValidationItemRuleDTO[];

    @IsArray()
    @ValidateNested({each:true})
    @Type(() => PromotionValidationCustomerLoyaltyDTO)
    validation_customer_loyalty: PromotionValidationCustomerLoyaltyDTO[];

    @IsArray()
    @ValidateNested({each: true})
    @Type(() => PromotionRewardDiscountItemDTO)
    reward_discount_item: PromotionRewardDiscountItemDTO[];

    @IsObject()
    @IsNotEmpty()
    priority: object;
}
   
export default PromotionDTO;