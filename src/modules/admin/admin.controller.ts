import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { generateExcel, generateExcelForImportProducts } from '../../utils/excel.util';
import { RoleGuard } from '../../auth/role.guard';
import { TokenGuard } from '../../auth/token.guard';
import AdminService from './admin.service';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import RegisterDTO from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import ExportTemplateDTO from './dto/export_template.dto';
import axios from 'axios';
import * as http from 'http';

@Controller('admin')
export default class AdminController {
    constructor(
        private readonly service: AdminService,
        private jwtService: JwtService,
    ) { }

    @Get('/search')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async globalSearch(@Req() req: Request, @Res() res: Response) {
        const response = await this.service.globalSearch(req.query);
        return res.json({
            products: response.products,
            customers: response.customers,
        });
    }

    @Get('/reports/customers')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async getCustomersReport(@Req() req: Request, @Res() res: Response) {
        const query = req.query;
        const response = await this.service.getCustomersReport(query);
        return res.json({ customers: response.customers });
    }

    @Get('/reports/segments')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async getSegmentsReport(
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const query = req.query;
        const response = await this.service.getSegmentsReport(query);
        return res.json({ segments: response.segments });
    }

    @Get('/reports/segment-details')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async getSegmentDetailsReport(
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const query = req.query;
        const response = await this.service.getSegmentDetailsReport(query);
        return res.json({ customers: response.customers });
    }

    @Get('/reports/accounts')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async getAccountsReport(
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const query = req.query;
        const response = await this.service.getAccountsReport(query);
        return res.json({ newCustomers: response.newCustomers });
    }

    @Post('/export')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async export(
        @Body() data: Array<Object>,
        @Res() res: Response,
    ) {
        const buffer = await generateExcel(data);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", "attachment; filename=" + "Report.xlsx");
        res.end(buffer, 'binary');
    }

    @Post('/export-template')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async exportTemplate(
        @Body() exportTemplateDTO: ExportTemplateDTO,
        @Res() res: Response,
    ) {
        const buffer = await generateExcelForImportProducts(exportTemplateDTO);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", "attachment; filename=" + "Template.xlsx");
        res.end(buffer, 'binary');
    }

    @Get('/reports/dashboard')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async getDashboardReports(@Res() res: Response) {
        const response = await this.service.getDashboardReports();
        return res.json({
            totalProductAmount: response.totalProductAmount,
            totalCategoryAmount: response.totalCategoryAmount,
            revenueInMonth: response.revenueInMonth,
            revenueAllTime: response.revenueAllTime,
            totalOrders: response.totalOrders,
            avgOrderValueLastWeek: response.avgOrderValueLastWeek,
            avgOrderValueThisWeek: response.avgOrderValueThisWeek,
        });
    }

    @Get('/reports/sales-statistics')
    async getSalesStatistics(
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const query = req.query;
        const response = await this.service.getSalesStatistics(query);
        return res.json({
            sales: response.salesStatistics,
        })
    }
    @Get('/reports/lowStock')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async getlowStockReport(
        @Query('FROM') FROM: string,
        @Query('TO') TO: string,
        @Res() res: Response,
    ) {
        const response = await this.service.getlowStockReport(FROM, TO);
        return res.json({
            details: response
        })
    }
    @Get('/reports/orderedProduct')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async getOrderedReport(
        @Query('FROM') FROM: string,
        @Query('TO') TO: string,
        @Res() res: Response,
    ) {
        const response = await this.service.getOrderedReport(FROM, TO);
        return res.json({
            details: response
        })
    }
    @Get('/reports/orderedDetail')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async getOrderedDetail(
        @Query('FROM') FROM: string,
        @Query('TO') TO: string,
        @Query('PSID') PSID: string,
        @Res() res: Response,
    ) {
        const response = await this.service.getOrderedDetail(FROM, TO,PSID);
        return res.json({
            details: response
        })
    }


    @Get('/reports/bestsellers')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async getBestsellersReport(
        @Query('FROM') FROM: string,
        @Query('TO') TO: string,
        @Res() res: Response,
    ) {
        const response = await this.service.getBestsellersReport(FROM, TO);
        return res.json({
            details: response
        })
    }
    @Get('/reports/getProductInCart')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async getProductInCart(
        @Query('FROM') FROM: string,
        @Query('TO') TO: string,
        @Res() res: Response,
    ) {
        const response = await this.service.getProductInCart(FROM, TO);
        return res.json({
            details: response
        })
    }
    @Get('/reports/productInCartDetail')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async getProductInCartDetail(
        @Query('FROM') FROM: string,
        @Query('TO') TO: string,
        @Query('PSID') PSID: string,
        @Res() res: Response,
    ) {
        const response = await this.service.getProductInCartDetail(FROM, TO,PSID);
        return res.json({
            details: response
        })
    }
    @Get('/reports/SearchTerm')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async getSearchTerm(
        @Query('FROM') FROM: string,
        @Query('TO') TO: string,
        @Res() res: Response,
    ) {
        const response = await this.service.getSearchTerm(FROM, TO);
        return res.json({
            details: response
        })
    }

    @Get('/reports/productView')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async getProductViewReport(
        @Query('FROM') FROM: string,
        @Query('TO') TO: string,
        @Res() res: Response,
    ) {
        const response = await this.service.getProductViewReport(FROM, TO);
        return res.json({
            details: response
        })
    }

    @Get('/setting/setRecommend')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async setRecommend(
        @Query('TYPE') TYPE: string,
        @Res() res: Response,
    ) {
        const response = await this.service.setRecommend(TYPE);
        return res.json({
            details: response
        })
    }

    @Get('/setting/getRecommend')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async getRecommend(
        @Res() res: Response,
    ) {
        const response = await this.service.getRecommend();
        return res.json({
            details: response
        })
    }
}
