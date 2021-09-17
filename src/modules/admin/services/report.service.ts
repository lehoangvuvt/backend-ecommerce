import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Order from '../../../modules/order/order.entity';
import { Repository } from 'typeorm';

@Injectable()
export default class ReportService {
  constructor(@InjectRepository(Order) private orderRepo: Repository<Order>) {}

  async getOrdersReport(from, to) {
    let orders = await this.orderRepo.query(`
    SELECT mydb.order.ID as ORDER_ID, mydb.order.CREATED_DATETIME, mydb.order.SID_CUSTOMER, 
    mydb.customer.FIRST_NAME, mydb.customer.LAST_NAME, mydb.customer.EMAIL, 
    mydb.order.TOTAL_ITEM_COUNT, mydb.order.TRANSACTION_TOTAL_TAX_AMT, mydb.order.SHIPPING_AMT, mydb.order.STATUS
    FROM mydb.order
    left join mydb.customer on mydb.order.SID_CUSTOMER = mydb.customer.SID;`);
    if (from && to) {
      orders = orders.filter(
        (order: any) =>
          order.CREATED_DATETIME.getTime() >= new Date(from).getTime() &&
          order.CREATED_DATETIME.getTime() <= new Date(to).getTime(),
      );
    }
    return { orders };
  }
}
