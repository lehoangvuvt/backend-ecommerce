import {IsUUID, IsNumber } from 'class-validator'

class PromotionRewardDiscountItemDTO {
    @IsUUID()
    SID_PRODUCT: string;

    @IsNumber() 
    DISC_VALUE: number;
}

export default PromotionRewardDiscountItemDTO;