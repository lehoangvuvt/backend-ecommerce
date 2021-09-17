import { Body, Controller, Get, Param, Post, Res, UseGuards } from "@nestjs/common";
import { Response } from 'express';
import { RoleGuard } from "../../auth/role.guard";
import { TokenGuard } from "../../auth/token.guard";
import CategoryService from "./category.service";
import CreateCategoryDTO from "./dto/create-category.dto";

@Controller("categories")
export default class CategoryController {
    constructor(
        private readonly service: CategoryService,
    ) { }

    @Post('/create')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async createCategory(
        @Body() createCategoryDTO: CreateCategoryDTO,
        @Res() res: Response
    ) {
        const response = await this.service.createCategory(createCategoryDTO);
        if (response.error) return res.json({ error: response.error });
        return res.json({ category: response.category });
    }

    @Get()
    async getAllCategories(
        @Res() res: Response
    ) {
        const response = await this.service.getAllCategories();
        return res.json({
            categories: response.categories,
        })
    }

    @Get('/category/:name')
    async getCategorySID(
        @Param('name') CATEGORY_NAME: string,
        @Res() res: Response,
    ) {
        const response = await this.service.getCategorySID(CATEGORY_NAME);
        return res.json({
            CATEGORY_SID: response.CATEGORY_SID,
        })
    }

    @Get('/details/:SID')
    async getCategoryNameBySID(
        @Param('SID') SID: string,
        @Res() res: Response,
    ) {
        const response = await this.service.getCategoryDetails(SID);
        return res.json({
            category: response.category,
        })
    }

    @Get('/segment/:name')
    async getCategoriesBySegment(
        @Param('name') name: string,
        @Res() res: Response,
    ) {
        const response = await this.service.getCategoriesBySegment(name);
        return res.json({
            categories: response.categories
        })
    }
}