import {IsNotEmpty, IsNumber} from 'class-validator'

export class CheckExchangePointDTO {
    @IsNotEmpty()
    @IsNumber()
    POINT: number;
}