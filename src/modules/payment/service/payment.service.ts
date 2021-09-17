import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import PaymentMethod from "../entity/payment_method.entity";

@Injectable()
export default class PaymentService {
    constructor(
        @InjectRepository(PaymentMethod) private paymentMethodRepositoty: Repository<PaymentMethod>,
    ) { }

    async getAllPaymentMethods() {
        const paymentMethods = await this.paymentMethodRepositoty.find();
        return { paymentMethods };
    }
}