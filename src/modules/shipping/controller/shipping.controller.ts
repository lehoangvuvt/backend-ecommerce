import { Body, Controller, Get, Param, Post, Put, Res } from "@nestjs/common";
import { Request, Response } from 'express';
import CreateShippingMethodDTO from "../dto/create_shipping_method.dto";
import ShippingService from "../service/shipping.service";

@Controller('shipping-methods')
class ShippingController {
    constructor(
        private readonly service: ShippingService,
    ) { }

    @Get()
    async getAllShippingMethods(
        @Res() res: Response,
    ) {
        const response = await this.service.getAllShippingMethods();
        return res.json({
            shippingMethods: response.shippingMethods,
        });
    }

    @Get('/:ID')
    async getShippingMethodDetails(
        @Param('ID') ID: number,
        @Res() res: Response,
    ) {
        const response = await this.service.getShippingDetails(ID);
        return res.json({
            shippingMethod: response.shippingMethod,
        });
    }

    @Put('/:ID')
    async updateShippingMethod(
        @Body() updateShippingMethodDTO: CreateShippingMethodDTO,
        @Param("ID") ID: number,
        @Res() res: Response,
    ) {
        const response = await this.service.updateShippingMethod(updateShippingMethodDTO, ID);
        if (response.error) return res.json({ error: response.error });
        return res.json({
            updatedShippingMethod: response.updateShippingMethodDTO,
        });
    }

    @Post('/create')
    async createShippingMethod(
        @Body() createShippingMethodDTO: CreateShippingMethodDTO,
        @Res() res: Response,
    ) {
        const response = await this.service.createShippingMethod(createShippingMethodDTO);
        if (response.error) return res.json({ error: response.error });
        return res.json({
            newShippingMethod: response.newShippingMethod,
        });
    }
}

export default ShippingController