import { Controller, Post, Res, Req, Body, Get, Param, Put, Delete } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import PromotionService from "./promotion.service";
import PromotionDTO from "./dto/promotion.dto";
import { Response } from "express";
import { param } from "express-validator";
import * as path from 'path'

@Controller('promotion')
export class PromotionController {
    constructor(
        private readonly promotionService: PromotionService,
        private jwtService: JwtService
    ) {}

    @Post('/')
    async create(
        @Res() res: Response,
        @Body() body: PromotionDTO
    ) {
        try {
            const response = await this.promotionService.createNewPromotion(body);
            return res.status(200).json(response);
        }
        catch(ex){
            // console.log(ex);
            return res.status(500).json({
                error: "The internal server occured error"
            })
        }
    }

    @Get('/get/:sid')
    async getPromotionWithSID(
        @Res() res: Response,
        @Param('sid') sid: string
    ) {
        const response = await this.promotionService.getPromotionBySID(sid);
        return res.status(200).json(response);
    }

    @Get('/get/all/active')
    async getPromotionWithActive(
        @Res() res: Response,
    ) {
        const response = await this.promotionService.getPromotionWithActive();
        return res.status(200).json(response);
    }

    @Get('/images')
    async getPromotionImages(
        @Req() req: any,
        @Res() res: Response
    ) {
        const response = await this.promotionService.getPromotionImage();
        return res.status(200).json(response);
    }

    @Get('/image/:name')
    async getImage(
        @Param('name') name: string,
        @Res() res: Response,
    ) {
        const filePath = path.join(__dirname, `../../../resource/uploads/images/${name}`);
        res.sendFile(filePath, (err) => {
            if (err) {
                res.json({ error: err.message });
            }
        });
    }

    @Post('/add-images')
    async postImagePromotion(
        @Res() res: Response,
        @Req() req: any
    ) {
        const PROMOTION_SID = req.body.PROMOTION_SID;
        const imageFiles = req.files;
        const successImage = await this.promotionService.postImageFiles(PROMOTION_SID, imageFiles);
        return res.json(successImage);
    }


    //Function get list promotion 
    //Param: tid with value (0,1,2)
    //0: up coming and current
    //1: past
    //2: all

    @Get('/list/:tid')
    async getListPromotion(
        @Req() req: any,
        @Res() res: Response,
        @Param('tid') tid: string 
    ) {
        const response = await this.promotionService.getListPromotionByTime(tid);
        return res.status(200).json(response);
    }

    @Put('/active/:sid/:value')
    async updatePromotionActive(
        @Req() req: any,
        @Res() res: Response,
        @Param('sid') sid: string,
        @Param('value') value: '1' | '0'
    ) {
        const response = await this.promotionService.updateActivePromotion(sid, value);
        return res.status(200).json();
    }

    @Put('/update/:sid') 
    async updatePromotion(
        @Res() res: Response,
        @Param('sid') sid: string,
        @Body() body: PromotionDTO
    ){
        const response = await this.promotionService.updatePromotion(sid, body);
        return res.status(200).json(response);
    }

    @Delete('/delete/:sid')
    async deletePromotion(
        @Req() req: any,
        @Res() res: Response,
        @Param('sid') sid: string
    ) {
        const response = await this.promotionService.deletePromotionWithSID(sid);
        if (response === 1) 
            return res.status(200).json();
        return res.status(500).json();
    }
}