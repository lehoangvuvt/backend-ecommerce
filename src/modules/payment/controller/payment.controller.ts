import { Controller, Get, Res } from "@nestjs/common";
import { Request, Response } from 'express';
import PaymentService from "../service/payment.service";

@Controller('payment')
class PaymentController {
    constructor(
        private readonly service: PaymentService,
    ) { }

    @Get('/payment-methods/get-all')
    async getAllPaymentMethods(
        @Res() res: Response,
    ) {
        const response = await this.service.getAllPaymentMethods();
        return res.json({
            paymentMethods: response.paymentMethods,
        })
    }
}

export default PaymentController