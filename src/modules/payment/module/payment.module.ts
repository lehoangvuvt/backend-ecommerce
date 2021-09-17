import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import PaymentController from "../controller/payment.controller";
import PaymentMethod from "../entity/payment_method.entity";
import PaymentService from "../service/payment.service";

@Module({
    imports: [TypeOrmModule.forFeature([
        PaymentMethod,
    ])],
    controllers: [PaymentController],
    providers: [PaymentService],
})

export class PaymentModule { }