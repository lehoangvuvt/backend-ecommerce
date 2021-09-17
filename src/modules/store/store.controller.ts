import { Body, Controller, Get, Param, Post, Res, UseGuards } from "@nestjs/common";
import { Response } from 'express';
import { TokenGuard } from "../../auth/token.guard";
import CreateStoreDTO from "./dto/create-store.dto";
import StoreService from "./store.service";

@Controller('stores')
class StoreController {
    constructor(
        private readonly service: StoreService,
    ) { }

    @Post('/create')
    // @UseGuards(TokenGuard)
    async createStore(
        @Body() createStoreDTO: CreateStoreDTO,
        @Res() res: Response,
    ) {
        const response = await this.service.createStore(createStoreDTO);
        if (response.error) return res.json({ error: response.error });
        return res.json({
            store: response.store
        })
    }

    @Get()
    async getAllStores(
        @Res() res: Response,
    ) {
        const response = await this.service.getAllStores();
        if (response.error) return res.json({ error: response.error });
        return res.json({
            stores: response.stores,
        })
    }

    @Post('/store-default-ecom/:store_code')
    async postStoreDefaultEcom(
        @Res() res: Response,
        @Param('store_code') store_code: string
    ) {
        const response = await this.service.postStoreDefaultEcom(store_code);
        return res.status(200).json(response);
    }

    @Get('/store-default-ecom')
    async getStoreDefaultEcom(
        @Res() res: Response,
    ) {
        const response = await this.service.getStoreDefaultEcom();
        return res.status(200).json(response);
    }
}

export default StoreController;