import { IsArray, IsNotEmpty, IsNumber, IsString, ArrayMinSize, ValidateNested } from "class-validator";
import {Type} from 'class-transformer'

export class CustomerLoyaltyLevelArrayDTO {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({each: true})
    @Type(() => CustomerLoyaltyLevelDTO)
    data_lst: CustomerLoyaltyLevelDTO[];
}

export class CustomerLoyaltyLevelDTO {

    DESCRIPTION: string;
    
    @IsString()
    NAME: string;

    @IsNumber()
    LOW_RANGE: number;

    @IsNumber()
    UPPER_RANGE: number;
    
    @IsNumber()
    EARN_MULTIPLIER: number;

    @IsNumber()
    REDEEM_MULTIPLIER: number;

    @IsNotEmpty()
    @IsString()
    HEX_COLOR: string;
}