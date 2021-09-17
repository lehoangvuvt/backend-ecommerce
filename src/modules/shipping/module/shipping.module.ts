import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import ShippingController from "../controller/shipping.controller";
import ShippingMethod from "../entity/shipping_method.entity";
import ShippingService from "../service/shipping.service";

@Module({
    imports: [TypeOrmModule.forFeature([
        ShippingMethod,
    ])],
    controllers: [ShippingController],
    providers: [ShippingService],
})

export class ShippingModule { }