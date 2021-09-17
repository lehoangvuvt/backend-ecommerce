import { Body, Controller, Get, Param, Post, Req, Res } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import axios from "axios";
import { Request, Response } from 'express';
import LoginPrismDTO from "../../../modules/product/dto/login-prism.dto";
import PrismService from "../services/prism.service";
import { tokenConfig } from "../../../config/token.config";

@Controller('prism')
export default class PrismController {
    constructor(
        private readonly service: PrismService,
        private jwtService: JwtService,
    ) { }

    @Get('/auth')
    async authenticatePrism(
        @Res() res: Response,
    ) {
        const response = await this.service.authenticate();
        if (response.error) return res.json({ error: response.error });
        return res.json({ token: response.token });
    }

    @Post('/login-prism')
    async loginPrism(
        @Body() loginPrismDTO: LoginPrismDTO,
        @Res() res: Response,
    ) {
        const { USERNAME, PASSWORD } = loginPrismDTO;
        if (USERNAME === 'sysadmin' && PASSWORD === 'sysadmin') {
            const token = await this.jwtService.signAsync({ username: 'sysadmin' }, { secret: tokenConfig.prism_token_secret_key, expiresIn: tokenConfig.prism_token_duration });
            return res.status(200).json({ token });
        } else {
            return res.status(400).json({ error: 'Invalid username or password' });
        }
    }

    @Get('/stores')
    async getStores(
        @Res() res: Response,
    ) {
        const response = await this.service.getStore();
        return res.json({
            stores: []
        })
    }

    @Get('/categories')
    async getCategories(
        @Res() res: Response,
    ) {
        const response = await this.service.getCategories();
        return res.json({
            categories: []
        })
    }

    @Get('/brands')
    async getBrands(
        @Res() res: Response,
    ) {
        const response = await this.service.getBrands();
        return res.json({
            brands: []
        })
    }

    @Get('/product-informations')
    async getProductInformation(
        @Res() res: Response,
    ) {
        const response = await this.service.getProductInformation();
        return res.json({
            productInformations: []
        })
    }

    @Get('/stores-qty/:upc')
    async getStoreQty(
        @Param('upc') upc: string,
        @Res() res: Response,
    ) {
        const response = await this.service.getStoresQty(upc);
        return res.json(response.storesQty);
    }
}