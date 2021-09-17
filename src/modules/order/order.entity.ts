import { v4 as uuid } from 'uuid';
import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import Customer from '../customer/customer.entity';
import OrderItem from './order_item.entity';
import OrderHistory from './order_history.entity';
import { ApiProperty } from '@nestjs/swagger';
import Coupon from '../customer/coupon.entity';
import Store from '../store/store.entity';

@Entity()
class Order extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  ID: number;

  @Column('datetime', { nullable: false })
  CREATED_DATETIME: Date;

  @Column('datetime', { nullable: true })
  MODIFIED_DATETIME: Date;

  @Column('uuid', { nullable: true })
  MODIFIED_BY: string;

  //1 New, 2 On Hold, 3 Processing, 4 Store assigned, 5 Cancelled, 6 In delivery, 7 Completed, 8 Closed, 9 Pick up on hold
  @Column('int', { width: 2, nullable: false })
  STATUS: number;

  @Column('uuid', { nullable: true })
  SID_CUSTOMER: string;

  @Column('uuid', { nullable: true })
  SESSION_ID: string;

  @Column('varchar', { length: 15, nullable: true })
  IP_ADDRESS: string;

  @Column('varchar', { length: 50, nullable: false })
  EMAIL: string;

  @Column('nvarchar', { length: 20, nullable: false })
  S_FIRST_NAME: string;

  @Column('nvarchar', { length: 20, nullable: false })
  S_LAST_NAME: string;

  @Column('nvarchar', { length: 50, nullable: true })
  S_COMPANY: string;

  @Column('nvarchar', { length: 100, nullable: false })
  S_STREET_ADDRESS: string;

  @Column('nvarchar', { length: 30, nullable: false })
  S_COUNTRY: string;

  @Column('nvarchar', { length: 50, nullable: false })
  S_CITY: string;

  @Column('nvarchar', { length: 50, nullable: false })
  S_DISTRICT: string;

  @Column('varchar', { length: 5, nullable: true })
  S_ZIP_CODE: string;

  @Column('varchar', { nullable: false, length: 10 })
  S_PHONE: string;

  @Column('int', { width: 1, nullable: true })
  ORDER_TYPE: number;

  @Column('int', { width: 1, nullable: false })
  S_TYPE: number;

  @Column('int', { width: 1, nullable: false })
  P_TYPE: number;

  @Column("uuid", { nullable: true })
  STORE_ID: string;

  @Column('datetime', { nullable: true })
  PICKUP_DATETIME: Date;

  @Column('numeric', { precision: 11, scale: 2, default: 0 })
  SHIPPING_AMT: number;

  @Column('numeric', { precision: 5, scale: 2, default: 0 })
  DISC_PERC: number;

  @Column('numeric', { precision: 11, scale: 2, default: 0 })
  DISC_AMT: number;

  @Column('numeric', { precision: 12, scale: 2, default: 0 })
  TRANSACTION_SUBTOTAL: number;

  @Column('numeric', { precision: 11, scale: 2, default: 0 })
  TRANSACTION_TOTAL_TAX_AMT: number;

  @Column('numeric', { precision: 12, scale: 2, default: 0 })
  TRANSACTION_TOTAL_AMT: number;

  @Column('numeric', { precision: 12, scale: 2, default: 0 })
  TRANSACTION_TOTAL_WITH_TAX: number;

  @Column('int', { default: 0 })
  TOTAL_LINE_ITEM: number;

  @Column('int', { default: 0 })
  TOTAL_ITEM_COUNT: number;

  @Column("int", {nullable: false, default: 0})
  PAYMENT_METHOD: number;

  @Column('numeric')
  POINT: number;

  @Column('numeric', { nullable: false, default: 0 })
  REDEEM_POINT: number;

  @Column('numeric', { nullable: false, default: 0 })
  REDEEM_AMOUNT: number;

  @Column('varchar', { nullable: true, length: 100 })
  PROMO_NAME: string;

  @Column('varchar', { length: 100, nullable: true })
  NOTE: string;

  @Column('text', { nullable: true })
  BILL: string;

  @Column("numeric", { nullable: true, default: 0 })
  COUPON_VALUE: number;

  @Column('varchar', { length: 100, nullable: true })
  ERROR_LOG: string;

  @Column('varchar', { length: 50, nullable: false, default: 'EcommerceWeb' })
  APPLICATION: string;

  @Column("uuid", { nullable: true, default: "" })
  COUPON_SID: string;

  @Column("numeric", {nullable: false, default: 0})
  IS_ISSUE_INVOICE: number;

  @Column("nvarchar", {nullable: true})
  ISSUE_COMPANY_NAME: string;

  @Column("nvarchar", {nullable: true})
  ISSUE_COMPANY_ADDRESS: string;

  @Column("nvarchar", {nullable: true})
  ISSUE_COMPANY_TAX_NUMBER: string;

  // @ManyToOne(() => Coupon, coupon => coupon.order ,{eager: true})
  // coupon: Coupon;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { eager: true })
  orderItems: OrderItem[];

  @OneToMany(() => OrderHistory, (orderHistory) => orderHistory.order, {
    eager: true,
  })
  historyLines: OrderHistory[];

  @ManyToOne(() => Customer, (customer) => customer.orders)
  @JoinColumn({ name: 'SID_CUSTOMER' })
  customer: Customer;

  @ManyToOne(() => Store, store => store.orders, { eager: true })
  @JoinColumn({ name: 'STORE_ID' })
  store: Store;

  @BeforeInsert()
  getCreatedAndModifiedDatetime() {
    const currentDatetime = new Date();
    this.CREATED_DATETIME = currentDatetime;
    this.MODIFIED_DATETIME = currentDatetime;
  }

  @BeforeUpdate()
  getModifiedDateTime() {
    this.MODIFIED_DATETIME = new Date();
  }
}

export default Order;
