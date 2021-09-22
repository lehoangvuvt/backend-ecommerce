import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as nodemailer from 'nodemailer';
import { Repository, Not, In } from 'typeorm';
import { CreateOrderDTO, OrderItemDTO } from './dto/create-order.dto';
import Product from '../product/product.entity';
import Order from './order.entity';
import OrderItem from './order_item.entity';
import Cart from '../customer/cart.entity';
import {
  MailSettingType,
  OrderHistoryType,
  OrderInformationType,
  OutOfStockItemType,
  ProductType,
} from '../../types/types';
import ProductInformation from '../product/product_information.entity';
import ProductAttribute from '../product/product_attribute.entity';
import ProductAttributeValue from '../product/product_attribute_value.entity';
import ProductAttributeGroup from '../product/product_attribute_group.entity';
import OrderHistory from './order_history.entity';
import SetOrderStatusDTO from './dto/set-order-status.dto';
import CustomerLoyaltyRate from '../customer/customer_loyalty_rate.entity';
import CustomerLoyaltyLevel from '../customer/customer_loyalty_level.entity';
import Customer from '../customer/customer.entity';
import Promotion from '../promotion/promotion.entity';
import formatter from '../../utils/currency-formatter.util';
import * as moment from 'moment';
import Store from '../store/store.entity';
import ShippingMethod from '../shipping/entity/shipping_method.entity';
import { html_pdf } from '../../middlewares/html-pdf.middleware';
import axios from 'axios';
import { getNodeMailerConfig } from '../../config/nodemailer.config';
import { io } from 'socket.io-client';
import Users from '../admin/entity/users.entity';
import StoreEcom from '../store/store_ecom.entity';

@Injectable()
export default class ProductService {
  constructor(
    @InjectRepository(Order) private orderRepositoty: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderHistory)
    private orderHistoryRepository: Repository<OrderHistory>,
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(ProductInformation)
    private productInformationRepository: Repository<ProductInformation>,
    @InjectRepository(ProductAttribute)
    private productAttributeRepository: Repository<ProductAttribute>,
    @InjectRepository(ProductAttributeValue)
    private productAttributeValueRepository: Repository<ProductAttributeValue>,
    @InjectRepository(ProductAttributeGroup)
    private productAttributeGroupRepository: Repository<ProductAttributeGroup>,
    @InjectRepository(Cart) private cartRepository: Repository<Cart>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(CustomerLoyaltyLevel)
    private customerLoyaltyLevelRepository: Repository<CustomerLoyaltyLevel>,
    @InjectRepository(CustomerLoyaltyRate)
    private customerLoyaltyRateRepository: Repository<CustomerLoyaltyRate>,
    @InjectRepository(Promotion)
    private promotionRepository: Repository<Promotion>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(ShippingMethod)
    private shippingMethodRepository: Repository<ShippingMethod>,
    @InjectRepository(Users)
    private userRepository: Repository<Users>,
    @InjectRepository(StoreEcom)
    private storeEcomRepository: Repository<StoreEcom>
  ) { }

  async calculate(
    item: OrderItemDTO,
    TOTAL_LINE_ITEM: number,
    TOTAL_ITEM_COUNT: number,
    TRANSACTION_TOTAL_AMT: number,
    TRANSACTION_TOTAL_TAX_AMT: number,
    TRANSACTION_TOTAL_WITH_TAX: number,
    TRANSACTION_SUBTOTAL: number,
  ) {
    const product = await this.productRepository.findOne({
      where: { SID: item.SID_PRODUCT },
    });
    const quantity = item.QUANTITY;
    const productInformation = await this.productInformationRepository.findOne({
      where: { SID: product.SID_PRODUCT_INFORMATION },
    });
    const productPriceInfo = productInformation.productPrices.sort(
      (a, b) => b.CREATED_DATETIME.getTime() - a.CREATED_DATETIME.getTime(),
    )[0];
    const productPrice = item.PRICE;
    // const productPrice = productInformation.productPrices.sort(
    //   (a, b) => b.CREATED_DATETIME.getTime() - a.CREATED_DATETIME.getTime(),
    // )[0].UNIT_PRICE;
    const taxRate = productPriceInfo.TAX;
    const taxPrice = (productPrice / 100) * taxRate;
    const discountPercentage = productPriceInfo.DISCOUNT;
    const discountPrice = (productPrice / 100) * discountPercentage;
    const PRODUCT_PRICE =
      parseFloat(productPrice.toString()) -
      parseFloat(discountPrice.toString());
    TOTAL_LINE_ITEM += 1;
    TOTAL_ITEM_COUNT += quantity;
    TRANSACTION_SUBTOTAL +=
      quantity *
      (parseFloat(productPrice.toString()) -
        parseFloat(discountPrice.toString()));
    TRANSACTION_TOTAL_AMT +=
      quantity *
      (parseFloat(productPrice.toString()) -
        parseFloat(discountPrice.toString()))
    TRANSACTION_TOTAL_TAX_AMT += quantity * taxPrice;
    TRANSACTION_TOTAL_WITH_TAX +=
      quantity *
      (parseFloat(productPrice.toString()) +
        parseFloat(taxPrice.toString()) -
        parseFloat(discountPrice.toString()));
    return {
      productInformation,
      quantity,
      PRODUCT_PRICE,
      TOTAL_LINE_ITEM,
      TOTAL_ITEM_COUNT,
      TRANSACTION_TOTAL_AMT,
      TRANSACTION_TOTAL_TAX_AMT,
      TRANSACTION_TOTAL_WITH_TAX,
      TRANSACTION_SUBTOTAL,
    };
  }

  async createOrder(
    createOrderDTO: CreateOrderDTO,
    SID_CUSTOMER?: string,
    SESSION_ID?: string,
  ) {
    try {
      let reservationQty: number;
      let outOfStockItems: OutOfStockItemType[];
      reservationQty = 0;
      outOfStockItems = [];
      const orderedItems = createOrderDTO.ITEMS;
      let storeCode = "";
      if (createOrderDTO.STORE_ID) {
        const storeID = createOrderDTO.STORE_ID;
        const store = await this.storeRepository.findOne({ where: { STORE_ID: storeID } });
        storeCode = store.STORE_CODE;
      }
      else {
        const tmp = await this.getStoreEcomDefault();
        storeCode = tmp.STORE_CODE;
      }

      // const orderToCalculateReserveQty = await this.orderRepositoty.find({
      //   where: { STATUS: Not(In([5, 7, 8])) },
      // });
      const getOutOfStockItems = orderedItems.map(async (orderedItem) => {
        reservationQty = 0;
        const SID_PRODUCT = orderedItem.SID_PRODUCT;
        const product = await this.productRepository.findOne({
          where: { SID: SID_PRODUCT },
        });
        const upc = product.UPC;

        const product_information =
          await this.productInformationRepository.findOne({
            where: { SID: product.SID_PRODUCT_INFORMATION },
          });
        // const currentQty = product.QTY;
        // const threshold = product_information.THRESHOLD;
        // if (orderToCalculateReserveQty.length > 0) {
        //   reservationQty = 0;
        //   orderToCalculateReserveQty.map((order) => {
        //     const orderItem = order.orderItems.filter(
        //       (item) => item.SID_PRODUCT === orderedItem.SID_PRODUCT,
        //     )[0];
        //     if (orderItem) {
        //       reservationQty += orderItem.QUANTITY;
        //     }
        //   });
        // }
        // if (
        //   orderedItem.QUANTITY > currentQty - reservationQty - threshold &&
        //   !product_information.CAN_PREORDER
        // ) {
        //   const exceedQty =
        //     currentQty - threshold - reservationQty - orderedItem.QUANTITY;
        //   const outOfStockItem = {
        //     SID_PRODUCT: orderedItem.SID_PRODUCT,
        //     exceedQty,
        //   };
        //   outOfStockItems.push(outOfStockItem);
        // }
        const response = await axios({
          url: `http://localhost:5035/prism/stores-qty/${upc}`,
          method: "GET",
          withCredentials: true,
        })
        let storesQty: Array<{
          minqty: number,
          qty: number,
          storecode: string,
        }> = response.data;
        const chosenStore = storesQty.filter(store => store.storecode === storeCode)[0];
        const threshold = product_information.THRESHOLD;
        const storeQty = chosenStore.qty;
        if (orderedItem.QUANTITY > storeQty - threshold) {
          console.log(storeQty);
          console.log(threshold);
          const exceedQty = storeQty - threshold - orderedItem.QUANTITY;
          console.log(exceedQty);
          const outOfStockItem = {
            SID_PRODUCT: orderedItem.SID_PRODUCT,
            exceedQty,
          };
          outOfStockItems.push(outOfStockItem);
        }
        return outOfStockItems;
      });
      await Promise.all(getOutOfStockItems);
      if (outOfStockItems.length === 0) {
        if (SID_CUSTOMER) createOrderDTO.SID_CUSTOMER = SID_CUSTOMER;
        if (SESSION_ID) createOrderDTO.SESSION_ID = SESSION_ID;
        let SHIPPING_AMT = 0;
        if (createOrderDTO.S_TYPE !== 0) {
          const shippingMethod = await this.shippingMethodRepository.findOne({ where: { ID: createOrderDTO.S_TYPE } });
          SHIPPING_AMT = shippingMethod.FLAT_PRICE;
        }
        const DISC_PERC = 0;
        const DISC_AMT = createOrderDTO.DISC_AMT;
        const REDEEM_AMOUNT = createOrderDTO.REDEEM_AMOUNT
          ? createOrderDTO.REDEEM_AMOUNT
          : 0;
        let TRANSACTION_SUBTOTAL = 0;
        let TRANSACTION_TOTAL_AMT = 0;
        let TRANSACTION_TOTAL_TAX_AMT = 0;
        let TRANSACTION_TOTAL_WITH_TAX = 0;
        let TOTAL_LINE_ITEM = 0;
        let TOTAL_ITEM_COUNT = 0;
        let PRODUCT_NAME = '';
        let PRODUCT_PRICE = 0;
        let PRODUCT_QTY = 0;
        let ORDER_ITEMS = [];
        const calculateOrderStatistics = createOrderDTO.ITEMS.map(
          async (item) => {
            const response = await this.calculate(
              item,
              TOTAL_LINE_ITEM,
              TOTAL_ITEM_COUNT,
              TRANSACTION_TOTAL_AMT,
              TRANSACTION_TOTAL_TAX_AMT,
              TRANSACTION_TOTAL_WITH_TAX,
              TRANSACTION_SUBTOTAL,
            );
            const productAttribute =
              await this.productAttributeValueRepository.findOne({
                where: { SID_PRODUCT: item.SID_PRODUCT },
              });
            const attributeId = productAttribute.PRODUCT_ATTRIBUTE_ID;
            const attributeInfo = await this.productAttributeRepository.findOne(
              { where: { ID: attributeId } },
            );
            const valueType = attributeInfo.VALUE_TYPE;
            const attributeValue = productAttribute[`VALUE_${valueType}`];
            const productGroupAttributeId =
              productAttribute.PRODUCT_ATTRIBUTE_GROUP_ID;
            const productAttributeGroup =
              await this.productAttributeGroupRepository.findOne({
                ID: productGroupAttributeId,
              });
            const atributeGroupId = productAttributeGroup.GROUP_ATTRIBUTE_ID;
            const groupAttributeValueType =
              await this.productAttributeRepository.findOne({
                where: { ID: atributeGroupId },
                select: ['VALUE_TYPE'],
              });
            const groupAttributeValue =
              productAttributeGroup[
              `GROUP_VALUE_${groupAttributeValueType.VALUE_TYPE}`
              ];
            TRANSACTION_SUBTOTAL += response.TRANSACTION_SUBTOTAL;
            TRANSACTION_TOTAL_AMT += response.TRANSACTION_TOTAL_AMT;
            TRANSACTION_TOTAL_TAX_AMT += response.TRANSACTION_TOTAL_TAX_AMT;
            TRANSACTION_TOTAL_WITH_TAX += response.TRANSACTION_TOTAL_WITH_TAX;
            TOTAL_LINE_ITEM += response.TOTAL_LINE_ITEM;
            TOTAL_ITEM_COUNT += response.TOTAL_ITEM_COUNT;
            PRODUCT_NAME = response.productInformation.PRODUCT_NAME;
            const ATTRIBUTE_VALUE = attributeValue;
            const GROUP_ATTRIBUTE_VALUE = groupAttributeValue;
            PRODUCT_PRICE = response.PRODUCT_PRICE;
            PRODUCT_QTY = response.quantity;
            ORDER_ITEMS.push({
              quantity: PRODUCT_QTY,
              description:
                PRODUCT_NAME +
                ' - ' +
                ATTRIBUTE_VALUE +
                ' - ' +
                GROUP_ATTRIBUTE_VALUE,
              price: formatter(PRODUCT_PRICE),
              total: formatter(PRODUCT_QTY * PRODUCT_PRICE),
            });
          },
        );
        await Promise.all(calculateOrderStatistics);
        const loyaltyRate = await this.customerLoyaltyRateRepository.findOne();
        const loyaltyLevel = await this.customerLoyaltyLevelRepository.find({
          order: { LOW_RANGE: 'ASC' },
        });

        let order_point: number = 0;
        let new_cust_point: number = 0;
        let reach_point: number = 0;
        let total: number =
          TRANSACTION_TOTAL_WITH_TAX - DISC_AMT - REDEEM_AMOUNT;
        total -= (createOrderDTO.COUPON_SID && createOrderDTO.COUPON_SID.length > 0) ? createOrderDTO.COUPON_VALUE : 0;
        const customer = await this.customerRepository
          .createQueryBuilder('customer')
          .select('customer')
          .where(`SID='${SID_CUSTOMER}'`)
          .getOne();
        if (SID_CUSTOMER) {
          let ind = loyaltyLevel.length - 1;
          for (let index = 0; index < loyaltyLevel.length; index++)
            if (
              customer.POINT >= loyaltyLevel[index].LOW_RANGE &&
              customer.POINT <= loyaltyLevel[index].UPPER_RANGE
            ) {
              ind = index;
              break;
            }
          reach_point =
            ind !== -1 && loyaltyRate
              ? (total * loyaltyLevel[ind].EARN_MULTIPLIER) / loyaltyRate.RATE
              : 0;
          order_point =
            ind !== -1 && loyaltyRate
              ? reach_point -
              (createOrderDTO.REDEEM_POINT
                ? Number(createOrderDTO.REDEEM_POINT)
                : 0)
              : 0;
          new_cust_point =
            ind !== -1 && loyaltyRate
              ? Number(customer.POINT) +
              reach_point -
              (createOrderDTO.REDEEM_POINT
                ? Number(createOrderDTO.REDEEM_POINT)
                : 0)
              : Number(customer.POINT);
          customer.POINT = new_cust_point;
          await customer.save();
        }
        const newOrder = this.orderRepositoty.create({
          ...createOrderDTO,
          DISC_AMT,
          DISC_PERC,
          POINT: order_point,
          PROMO_NAME: createOrderDTO.PROMO_NAME,
          SHIPPING_AMT,
          REDEEM_AMOUNT,
          TOTAL_ITEM_COUNT,
          TOTAL_LINE_ITEM,
          TRANSACTION_SUBTOTAL,
          TRANSACTION_TOTAL_AMT,
          TRANSACTION_TOTAL_TAX_AMT,
          TRANSACTION_TOTAL_WITH_TAX: total + parseFloat(SHIPPING_AMT.toString()),
          COUPON_SID: createOrderDTO.COUPON_SID,
          COUPON_VALUE: createOrderDTO.COUPON_VALUE,
          PAYMENT_METHOD: createOrderDTO.PAYMENT_METHOD
        });
        // console.log('abcdef');
        const order = await newOrder.save();
        //bill information
        let bill_info;
        if (SID_CUSTOMER) {
          bill_info = {
            company: 'LBC International',
            address: '145 Nguyễn Cơ Thạch, An Lợi Đông, Quận 2, HCMC',
            phone: 'Phone: 0915133733',
            invoice_no: order.ID,
            date: moment(
              new Date(order.CREATED_DATETIME.toString()).getTime(),
            ).format('DD/MM/YYYY, HH:mm'),
            customer_name: customer.FIRST_NAME + ' ' + customer.LAST_NAME,
            customer_email: customer.EMAIL,
            customer_address: order.S_STREET_ADDRESS + ' ' + order.S_DISTRICT,
            customer_city: order.S_CITY,
            ship_to:
              order.S_STREET_ADDRESS +
              ', ' +
              order.S_DISTRICT +
              ', ' +
              order.S_CITY,
            instructions: order.NOTE,
            order_items: ORDER_ITEMS,
            sub_total: formatter(TRANSACTION_SUBTOTAL),
            sales_tax: formatter(TRANSACTION_TOTAL_TAX_AMT),
            shipping_amt: formatter(SHIPPING_AMT),
            total_amt: formatter(total),
          };
        } else {
          bill_info = {
            company: 'LBC International',
            address: '145 Nguyễn Cơ Thạch, An Lợi Đông, Quận 2, HCMC',
            phone: 'Phone: 0915133733',
            invoice_no: order.ID,
            date: moment(
              new Date(order.CREATED_DATETIME.toString()).getTime(),
            ).format('DD/MM/YYYY, HH:mm'),
            customer_name: createOrderDTO.S_FIRST_NAME + ' ' + createOrderDTO.S_LAST_NAME,
            customer_email: createOrderDTO.EMAIL,
            customer_address: createOrderDTO.S_STREET_ADDRESS + ' ' + createOrderDTO.S_DISTRICT,
            customer_city: createOrderDTO.S_CITY,
            ship_to:
              order.S_STREET_ADDRESS +
              ', ' +
              order.S_DISTRICT +
              ', ' +
              order.S_CITY,
            instructions: order.NOTE,
            order_items: ORDER_ITEMS,
            sub_total: formatter(TRANSACTION_SUBTOTAL),
            sales_tax: formatter(TRANSACTION_TOTAL_TAX_AMT),
            shipping_amt: formatter(SHIPPING_AMT),
            total_amt: formatter(total),
          };
        }

        await this.orderRepositoty.save({
          ID: order.ID,
          BILL: JSON.stringify(bill_info),
        });
        const newOrderHistory = this.orderHistoryRepository.create({
          ORDER_ID: newOrder.ID,
          ORDER_STATUS: newOrder.STATUS,
          CREATED_DATETIME: newOrder.MODIFIED_DATETIME,
        });
        await newOrderHistory.save();
        const ORDER_ID = newOrder.ID;
        createOrderDTO.ITEMS.map(async (item) => {
          const orderItem = this.orderItemRepository.create({
            QUANTITY: item.QUANTITY,
            SID_PRODUCT: item.SID_PRODUCT,
            ORDER_ID,
            HAVE_PROMO: item.HAVE_PROMO,
            PRICE: item.PRICE,
            ORIG_PRICE: item.ORIG_PRICE,
            PROMO_NAME: item.PROMO_NAME
          });
          await orderItem.save();
        });
        let orderInfoAfterAddedItems = await this.orderRepositoty.findOne({
          where: { ID: newOrder.ID },
        });
        delete orderInfoAfterAddedItems.orderItems;
        const cartWithThisOrder = await this.cartRepository.find({
          where: { SID_CUSTOMER },
          order: { CREATED_DATETIME: 'DESC' },
          take: 1,
        });
        if (cartWithThisOrder.length > 0) {
          cartWithThisOrder[0].STATUS = 2;
          await cartWithThisOrder[0].save();
        }

        let promoSet = new Set<string>();
        promoSet.add(createOrderDTO.PROMO_NAME);
        createOrderDTO.ITEMS.forEach(element => {
          promoSet.add(element.PROMO_NAME);
        });
        for (var value of promoSet) {
          if (value === null || value === undefined || value === "") continue;
          const promotion = await this.promotionRepository.findOne({
            where: { PROMO_NAME: value },
          });
          if (promotion) {
            if (promotion.APPLY_COUNT !== null) {
              promotion.COUNT = Number(promotion.COUNT) + 1;
              await promotion.save();
            }
          }
        }

        createOrderDTO.ID = order.ID;
        return {
          order: orderInfoAfterAddedItems,
          bill_info,
          createOrderDTO
        };
      } else {
        return { outOfStockItems };
      }
    } catch (error) {
      return { error: error.message };
    }
  }

  async getOrderDetails(SID: string, CUSTOMER_SID: string) {
    const order = await this.orderRepositoty.findOne({
      where: { ID: SID, SID_CUSTOMER: CUSTOMER_SID },
    });
    if (order) {
      return { order };
    } else {
      return { error: 'Cannot find any order' };
    }
  }

  async getAllOrders(query: any) {
    const q = query.q;
    const take = 5;
    const skip = (query.page - 1) * take;
    let defaultSortOption: {
      field: string;
      order: 'ASC' | 'DESC';
    } = {
      field: 'order.CREATED_DATETIME',
      order: 'DESC',
    };
    if (query.sort) {
      const field = query.sort.split(' ')[0].toUpperCase();
      defaultSortOption.field = 'order.' + field;
      const order = query.sort.split(' ')[1].toUpperCase();
      switch (order) {
        case 'ASC':
          defaultSortOption.order = 'ASC';
          break;
        default:
          defaultSortOption.order = 'DESC';
          break;
      }
    }
    let allOrderInformation: Array<OrderInformationType>;
    const getOrdersQuery = this.orderRepositoty
      .createQueryBuilder('order')
      .select('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product');
    if (q && q.trim() !== '' && q !== '*') {
      getOrdersQuery
        .where(`order.EMAIL LIKE '%${q}%'`)
        .orWhere(`order.S_FIRST_NAME LIKE '%${q}%'`)
        .orWhere(`order.S_LAST_NAME LIKE '%${q}%'`)
        .orWhere(
          `CONCAT(order.S_FIRST_NAME,' ',order.S_LAST_NAME) LIKE '%${q}%'`,
        )
        .orWhere(
          `CONCAT(order.S_LAST_NAME,' ',order.S_FIRST_NAME) LIKE '%${q}%'`,
        )
        .orWhere(`order.ID LIKE '%${q}%'`)
        .orWhere(`order.S_PHONE LIKE '%${q}%'`);
    }
    getOrdersQuery
      .orderBy(`${defaultSortOption.field}`, defaultSortOption.order)
      .take(take)
      .skip(skip);
    const orders = await getOrdersQuery.getMany();
    allOrderInformation = [];
    orders.map((order) => {
      delete order.BILL;
      allOrderInformation.push({ ...order, id: order.ID });
    });
    const getTotalRecordsQuery = this.orderRepositoty
      .createQueryBuilder('order')
      .select('order');
    if (q && q.trim() !== '' && q !== '*') {
      getTotalRecordsQuery
        .where(`order.EMAIL LIKE '%${q}%'`)
        .orWhere(`order.S_FIRST_NAME LIKE '%${q}%'`)
        .orWhere(`order.S_LAST_NAME LIKE '%${q}%'`)
        .orWhere(
          `CONCAT(order.S_FIRST_NAME,' ',order.S_LAST_NAME) LIKE '%${q}%'`,
        )
        .orWhere(
          `CONCAT(order.S_LAST_NAME,' ',order.S_FIRST_NAME) LIKE '%${q}%'`,
        )
        .orWhere(`order.ID LIKE '%${q}%'`)
        .orWhere(`order.S_PHONE LIKE '%${q}%'`);
    }
    const totalRecords = await getTotalRecordsQuery.getCount();
    return {
      orders: allOrderInformation,
      totalRecords,
    };
  }

  async getOrderDetailsForAdmin(ID: number) {
    let orderDetailsInfo: {
      ID: number;
      CREATED_DATETIME: Date;
      MODIFIED_DATETIME: Date;
      STATUS: number;
      SID_CUSTOMER: string;
      SESSION_ID: string;
      IP_ADDRESS: string;
      EMAIL: string;
      S_FIRST_NAME: string;
      S_LAST_NAME: string;
      S_COMPANY: string;
      S_STREET_ADDRESS: string;
      S_COUNTRY: string;
      S_CITY: string;
      S_DISTRICT: string;
      S_ZIP_CODE: string;
      S_PHONE: string;
      ORDER_TYPE: number;
      S_TYPE: number;
      P_TYPE: number;
      SHIPPING_AMT: number;
      DISC_PERC: number;
      DISC_AMT: number;
      TRANSACTION_SUBTOTAL: number;
      TRANSACTION_TOTAL_TAX_AMT: number;
      TRANSACTION_TOTAL_AMT: number;
      TRANSACTION_TOTAL_WITH_TAX: number;
      TOTAL_LINE_ITEM: number;
      TOTAL_ITEM_COUNT: number;
      NOTE: string;
      ERROR_LOG: string;
      historyLines: Array<OrderHistoryType>;
      customerInfo?: Customer;
      STORE_ID: string;
      store: Store;
      orderItems: Array<{
        ID: number;
        ORDER_ID: number;
        SID_PRODUCT: string;
        CREATED_DATETIME: Date;
        QUANTITY: number;
        PRODUCT_NAME?: string;
        ATTRIBUTE_VALUE?: string;
        GROUP_ATTRIBUTE_VALUE?: string;
        PRODUCT_PRICE?: number;
        PRICE_WITH_TAX_DIS?: number;
        TAX_AMOUNT?: number;
        DISCOUNT_AMOUNT?: number;
        product: ProductType;
      }>;
    } = undefined;
    const orderDetails = await this.orderRepositoty.findOne({ where: { ID } });
    if (!orderDetails) return { error: 'Cannot find any order with that ID' };
    orderDetailsInfo = orderDetails;
    if (orderDetailsInfo.SID_CUSTOMER) {
      orderDetailsInfo.customerInfo = await this.customerRepository
        .createQueryBuilder('customer')
        .select('customer')
        .leftJoinAndSelect('customer.addresses', 'addresses')
        .where(`SID='${orderDetailsInfo.SID_CUSTOMER}'`)
        .getOne();
    }
    const getOrderItemsInfo = orderDetailsInfo.orderItems.map(async (item) => {
      const SID = item.product.SID_PRODUCT_INFORMATION;
      const productInformation =
        await this.productInformationRepository.findOne({ where: { SID } });
      const orderCreatedTimestamp = orderDetails.CREATED_DATETIME.getTime();
      const productPriceInfo = productInformation.productPrices
        .filter(
          (price) => price.CREATED_DATETIME.getTime() < orderCreatedTimestamp,
        )
        .sort(
          (a, b) => b.CREATED_DATETIME.getTime() - a.CREATED_DATETIME.getTime(),
        )[0];
      const productPrice = productPriceInfo.UNIT_PRICE;
      const discountPercentage = productPriceInfo.DISCOUNT;
      const discountPrice = (productPrice / 100) * discountPercentage;
      const taxRate = productPriceInfo.TAX;
      const taxPrice = (productPrice / 100) * taxRate;
      const unitPriceWithTaxAndDis =
        parseFloat(productPrice.toString()) +
        parseFloat(taxPrice.toString()) -
        parseFloat(discountPrice.toString());
      item.PRODUCT_PRICE = productPrice;
      item.TAX_AMOUNT = taxPrice;
      item.DISCOUNT_AMOUNT = discountPrice;
      item.PRODUCT_NAME = productInformation.PRODUCT_NAME;
      item.PRICE_WITH_TAX_DIS = unitPriceWithTaxAndDis;
      const productSID = item.product.SID;
      const productAttribute =
        await this.productAttributeValueRepository.findOne({
          where: { SID_PRODUCT: productSID },
        });
      const attributeId = productAttribute.PRODUCT_ATTRIBUTE_ID;
      const attributeInfo = await this.productAttributeRepository.findOne({
        where: { ID: attributeId },
      });
      const valueType = attributeInfo.VALUE_TYPE;
      const attributeValue = productAttribute[`VALUE_${valueType}`];
      item.ATTRIBUTE_VALUE = attributeValue;
      const productGroupAttributeId =
        productAttribute.PRODUCT_ATTRIBUTE_GROUP_ID;
      const productAttributeGroup =
        await this.productAttributeGroupRepository.findOne({
          ID: productGroupAttributeId,
        });
      const atributeGroupId = productAttributeGroup.GROUP_ATTRIBUTE_ID;
      const groupAttributeValueType =
        await this.productAttributeRepository.findOne({
          where: { ID: atributeGroupId },
          select: ['VALUE_TYPE'],
        });
      const groupAttributeValue =
        productAttributeGroup[
        `GROUP_VALUE_${groupAttributeValueType.VALUE_TYPE}`
        ];
      item.GROUP_ATTRIBUTE_VALUE = groupAttributeValue;
    });
    await Promise.all(getOrderItemsInfo);
    return { orderDetails: orderDetailsInfo };
  }

  async setOrderStatus(setOrderStatusDTO: SetOrderStatusDTO) {
    const { orderId, status, note } = setOrderStatusDTO;
    try {
      const orderToUpdate = await this.orderRepositoty.findOne({
        where: { ID: orderId },
      });
      orderToUpdate.STATUS = status;
      await orderToUpdate.save();
      const orderHistory = this.orderHistoryRepository.create({
        ORDER_ID: orderId,
        ORDER_STATUS: status,
        NOTE: note,
        CREATED_DATETIME: orderToUpdate.MODIFIED_DATETIME,
      });
      await orderHistory.save();
      if (status === 7) {
        const items = orderToUpdate.orderItems;
        const decreaseQtyOfProduct = items.map(async (item) => {
          try {
            const product = item.product;
            product.QTY = product.QTY - item.QUANTITY;
            await product.save();
          } catch (error) {
            return { error };
          }
        });
        await Promise.all(decreaseQtyOfProduct);
      }
      return { order: orderToUpdate };
    } catch (error) {
      console.log(error);
      return { error };
    }
  }

  async getListOrderByCustomer(customer_sid: string) {
    const listOrder = await this.orderRepositoty
      .createQueryBuilder('order')
      .select('order')
      .where('order.SID_CUSTOMER = :custsid', { custsid: customer_sid })
      .orderBy('order.CREATED_DATETIME', 'DESC')
      .getMany();
    // console.log(listOrder);
    listOrder.map((order) => delete order.BILL);
    return listOrder;
  }

  async getOrderDetailByCustomer(customer_sid: string, id: number) {
    const listOrder = await this.orderRepositoty
      .createQueryBuilder('order')
      .select('order')
      .where('order.SID_CUSTOMER = :custsid', { custsid: customer_sid })
      .andWhere('order.ID = :id', { id })
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('order.historyLines', 'historyLines')
      .leftJoinAndSelect('orderItems.product', 'product')
      .leftJoinAndSelect('product.productInformation', 'productInformation')
      .leftJoinAndSelect('productInformation.productPrices', 'productPrices')
      .getOne();
    delete listOrder.BILL;
    return listOrder;
  }

  async getCheckOrder(EMAIL: string, ID: number) {
    const listOrder = await this.orderRepositoty
      .createQueryBuilder('order')
      .select('order')
      .where('order.EMAIL = :email', { email: EMAIL })
      .andWhere('order.ID = :id', { id: ID })
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('order.historyLines', 'historyLines')
      .leftJoinAndSelect('orderItems.product', 'product')
      .leftJoinAndSelect('product.productInformation', 'productInformation')
      .leftJoinAndSelect('productInformation.productPrices', 'productPrices')
      .getOne();
    delete listOrder.BILL;
    return listOrder;
  }

  async getOrderBillByID(id: number) {
    console.log();
    // const bill = await this.orderRepositoty.query(
    //   `SELECT BILL FROM mydb.order where ID = ${id};`,
    // );
    const bill = await this.orderRepositoty.find({where: {ID :id}})
    return bill;
  }

  async getNewOrders() {
    const newOrders = await this.orderRepositoty.find({ where: { STATUS: 1 }, select: ['ID', 'CREATED_DATETIME'] });
    return { newOrders };
  }

  async getStoreCode(store_id) {
    const stores = await this.storeRepository.findOne({ where: { STORE_ID: store_id } });
    return stores.STORE_CODE;
  }

  async sendMailToCustomer(response: any) {
    let bill_info = response.bill_info;
    let buffer = await html_pdf(bill_info);
    let dataFields: Array<{
      fieldName: string,
      value: any,
    }> = [];
    const getTemplatesResponse = await axios({
      url: `http://localhost:5035/setting/mail-settings/details/2`,
      withCredentials: true,
      method: 'GET',
    })
    for (let key in response.order) {
      dataFields.push({
        fieldName: key,
        value: response.order[key]
      })
    }
    const data = getTemplatesResponse.data;
    const mailSetting: MailSettingType = data.mailSetting;
    const mailTemplate = mailSetting.mailTemplates[0];
    let MAIL_CONTENTS = mailTemplate.MAIL_CONTENTS;
    let MAIL_SUBJECT = mailTemplate.MAIL_SUBJECT;
    const convertRawToData = dataFields.map(field => {
      if (MAIL_CONTENTS.includes('${' + field.fieldName + '}')) {
        MAIL_CONTENTS = MAIL_CONTENTS.replace('${' + field.fieldName + '}', field.value);
      }
    })
    await Promise.all(convertRawToData);
    const nodeMailerConfig = await getNodeMailerConfig();
    const sender = nodemailer.createTransport({
      service: nodeMailerConfig.service,
      auth: {
        user: nodeMailerConfig.email,
        pass: nodeMailerConfig.password,
      },
    });
    const mailOptions = {
      from: nodeMailerConfig.email,
      to: bill_info.customer_email,
      subject: MAIL_SUBJECT,
      html: MAIL_CONTENTS,
      attachments: [
        {
          filename: `Bill_${bill_info.date}.pdf`,
          content: Buffer.from(buffer),
        },
      ],
    };
    sender.sendMail(mailOptions, (error) => {
      if (error) {
        console.log(error);
      };
    });
  }

  async sendMailToAdmin(newOrder: Order) {
    const user = await this.userRepository.findOne({ where: { ACTIVE: 1 } });
    const email = user.EMAIL;
    const nodeMailerConfig = await getNodeMailerConfig();
    const sender = nodemailer.createTransport({
      service: nodeMailerConfig.service,
      auth: {
        user: nodeMailerConfig.email,
        pass: nodeMailerConfig.password,
      },
    });
    const mailContents = `
    <p>Order ID: #${newOrder.ID}</p>
    <p>Created Datetime: ${newOrder.CREATED_DATETIME}</p>
    <p>Customer's name: ${newOrder.S_FIRST_NAME} ${newOrder.S_LAST_NAME}</p>
    <p>Customer's email: ${newOrder.EMAIL}</p>
    <p>Order Type: ${newOrder.ORDER_TYPE === 1 ? "Pick Up In Store" : "Deliver"}</p>
    <p>Link order details: http://localhost:3000/e-commerce/orders/order/${newOrder.ID}</p>
    `;
    const mailOptions = {
      from: nodeMailerConfig.email,
      to: email,
      subject: "New Order Notification",
      html: mailContents,
    };
    sender.sendMail(mailOptions, (error) => {
      if (error) {
        console.log(error);
      };
    });
  }

  async sendViber(newOrder: Order) {
    const url = "https://chatapi.viber.com/pa/send_message";
    const message = `
      Order ID: ${newOrder.ID}, Created At: ${newOrder.CREATED_DATETIME},  
    `;
    const body = {
      receiver: "lsataZA22a7R42DeaHB10w==",
      type: "text",
      text: message
    }
    const response = await axios({
      url,
      headers: {
        "X-Viber-Auth-Token": "4e01e82d7c67dafc-2b7898c36c59455e-ed6770b8fa7fff50",
        "Content-Type": "application/json",
      },
      data: body,
    })
    const data = response.data;
    console.log(data);
  }

  async getStoreEcomDefault() {
    const response = await this.storeEcomRepository.findOne();
    if (response === undefined) {
      return {
        STORE_CODE: ""
      }
    }
    else {
      const store_id = await this.storeRepository.findOne({where: {STORE_CODE: response.STORE_CODE}})
      return {
        STORE_CODE: response.STORE_CODE,
        STORE_ID: store_id.STORE_ID
      };
    }
    
  }
}

