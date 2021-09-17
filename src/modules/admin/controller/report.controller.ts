import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import ReportService from '../services/report.service';

@Controller('reports')
export default class ReportController {
  constructor(private readonly service: ReportService) {}

  @Get('/orders')
  async getAllRolePerm(@Req() req: Request, @Res() res: Response) {
    const from = req.query.from;
    const to = req.query.to;
    const response = await this.service.getOrdersReport(from, to);
    return res.json({
      orders: response.orders,
    });
  }
}
