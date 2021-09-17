import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { DefineGuard } from '../../auth/define.guard';
import { RoleGuard } from '../../auth/role.guard';
import { TokenGuard } from '../../auth/token.guard';
import CreateOrderItemDTO from './dto/create-order-item.dto';
import { CreateOrderDTO } from './dto/create-order.dto';
import Order from './order.entity';
import OrderService from './order.service';
import SetOrderStatusDTO from './dto/set-order-status.dto';
import * as nodemailer from 'nodemailer';
import { getNodeMailerConfig } from '../../config/nodemailer.config';
import { delivery_pdf, html_pdf } from '../../middlewares/html-pdf.middleware';
import { Readable } from 'stream';
import axios from 'axios';
import { MailSettingType } from '../../types/types';
import PrismService from '../admin/services/prism.service';
import { io } from 'socket.io-client';

@Controller('orders')
class OrderController {
  constructor(private readonly service: OrderService, private readonly prismService: PrismService) { }

  @Post('/create')
  @UseGuards(DefineGuard)
  async createOrder(
    @Body() createOrderDTO: CreateOrderDTO,
    @Res() res: Response,
    @Req() req: any,
  ) {
    let store_default;
    if (!(createOrderDTO.STORE_ID)) {
      const storeDefault = await this.service.getStoreEcomDefault();
      if (storeDefault.STORE_CODE === "") {
        return res.status(200).json({error: "Order failed. Try order again later."})
      }
      store_default = storeDefault.STORE_CODE;
    }
    console.log('abc')
    if (req.customer && req.customer.SID) {
      let SID_CUSTOMER: string;
      SID_CUSTOMER = req.customer.SID;
      const response = await this.service.createOrder(
        createOrderDTO,
        SID_CUSTOMER,
      );
      if (response.error)
        return res.json({
          error: response.error,
        });
      if (response.outOfStockItems) {
        return res.json({
          outOfStockItems: response.outOfStockItems,
        });
      }
      if (response.order) {
        this.service.sendMailToCustomer(response);
        this.service.sendMailToAdmin(response.order);
        this.service.sendViber(response.order);
        //Get store
        const url = "http://localhost:5035/socket/orders";
        const socket = io(url, { transports: ["websocket"] });
        if (response.createOrderDTO.STORE_ID) {
          const store_code = await this.service.getStoreCode(response.createOrderDTO.STORE_ID);
          socket.emit('newOrders', { store: store_code });
          this.prismService.updateOrder(response.createOrderDTO, store_code);
        } else {
          socket.emit('newOrders', store_default);
          this.prismService.updateOrder(response.createOrderDTO, store_default);
        }
        return res.json({
          order: response.order,
        });
      }
    } else if (req.cookies['session_id']) {
      let SESSION_ID: string;
      SESSION_ID = req.cookies['session_id'];
      const response = await this.service.createOrder(
        createOrderDTO,
        null,
        SESSION_ID,
      );
      console.log(1);
      if (response.error) {
        return res.json({
          error: response.error,
        });
      }
      console.log(2);
      if (response.outOfStockItems) {
        return res.json({
          outOfStockItems: response.outOfStockItems,
        });
      }
      console.log(2);
      if (response.order) {
        this.service.sendMailToCustomer(response);
        this.service.sendMailToAdmin(response.order);
        this.service.sendViber(response.order);
        console.log(3);
        const url = "http://localhost:5035/socket/orders";
        const socket = io(url, { transports: ["websocket"] });
        if (response.createOrderDTO.STORE_ID) {
          const store_code = await this.service.getStoreCode(response.createOrderDTO.STORE_ID);
          socket.emit('newOrders', { store: store_code });
          this.prismService.updateOrder(response.createOrderDTO, store_code);
        } else {
          socket.emit('newOrders', store_default);
          this.prismService.updateOrder(response.createOrderDTO, store_default);
        }
        return res.json({
          order: response.order,
        });
      }
    } else {
      return ServiceUnavailableException;
    }
  }

  @Get('/order/bill/:id')
  async getOrderBillByID(
    @Param('id') id: number,
    @Res() res: Response) {
    const response = await this.service.getOrderBillByID(id);
    const bill_info = JSON.parse(response[0].BILL);
    let buffer = await html_pdf(bill_info);
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': buffer.length,
      'Content-Disposition': `attachment; filename="Bill_${bill_info.date}.pdf"`,
    });
    stream.pipe(res);
  }

  @Get('/order/delivery-bill/:id')
  async getOrderDeliveryBillByID(
    @Param('id') id: number,
    @Res() res: Response
  ) {
    const response = await this.service.getOrderBillByID(id);
    const bill_info = JSON.parse(response[0].BILL);
    let buffer = await delivery_pdf(bill_info);
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': buffer.length,
      'Content-Disposition': `attachment; filename="Delivery_${bill_info.date}.pdf"`,
    });
    stream.pipe(res);
  }

  @Get()
  // @UseGuards(TokenGuard, RoleGuard('admin'))
  async getAllOrders(@Req() req: Request, @Res() res: Response) {
    const query = req.query;
    const response = await this.service.getAllOrders(query);
    return res.json({
      orders: response.orders,
      totalRecords: response.totalRecords,
    });
  }

  @Get('/order/:ID')
  // @UseGuards(TokenGuard, RoleGuard('admin'))
  async getOrderDetailsForAdmin(@Param('ID') ID: number, @Res() res: Response) {
    const response = await this.service.getOrderDetailsForAdmin(ID);
    if (response.error) return res.json({ error: response.error });
    return res.json({ orderDetails: response.orderDetails });
  }

  @Get('/personal')
  @UseGuards(DefineGuard)
  async getListOrder(@Res() res: Response, @Req() req: any) {
    if (req.customer && req.customer.SID) {
      // console.log(req.customer.SID);
      const response = await this.service.getListOrderByCustomer(
        req.customer.SID,
      );
      return res.status(200).json({
        listOrders: response,
      });
    } else {
      res.status(200).json({
        error: 'The customer ID is forbidden',
      });
    }
  }

  @Put('/order/update-status')
  @ApiBody({ type: SetOrderStatusDTO })
  @ApiResponse({ type: Order })
  // @UseGuards(TokenGuard, RoleGuard('admin'))
  async setOrderStatus(
    @Body() setOrderStatusDTO: SetOrderStatusDTO,
    @Res() res: Response,
  ) {
    const response = await this.service.setOrderStatus(setOrderStatusDTO);
    if (response.error) return res.json({ error: response.error });
    return res.status(200).json({ order: response.order });
  }

  @Get('/personal/:id')
  @UseGuards(DefineGuard)
  async getOrderDetail(
    @Req() req: any,
    @Res() res: Response,
    @Param('id') ID: number,
  ) {
    // console.log(ID);
    if (req.customer && req.customer.SID) {
      const response = await this.service.getOrderDetailByCustomer(
        req.customer.SID,
        ID,
      );
      return res.status(200).json({
        orderDetail: response,
      });
    } else {
      res.status(200).json({
        error: 'The customer ID is forbidden',
      });
    }
  }

  @Get('/new-orders')
  async getNewOrders(
    @Res() res: Response,
  ) {
    const response = await this.service.getNewOrders();
    return res.json({
      newOrders: response.newOrders
    })
  }

  @Post('/check-order')
  async getCheckOrder(
    @Res() res: Response,
    @Body() data: { EMAIL: string, ID: number }
  ) {
    const response = await this.service.getCheckOrder(data.EMAIL, data.ID);
    return res.status(200).json(response);
  }
}

export default OrderController;
