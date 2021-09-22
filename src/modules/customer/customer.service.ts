import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { hashSync, compareSync } from 'bcrypt';
import { tokenConfig } from "../../config/token.config";
import Product from "../product/product.entity";
import { getManager, In, Not, Repository, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import Cart from "./cart.entity";
import CartItem from "./cart_item.entity";
import Customer from "./customer.entity";
import CustomerWishlist from "./customer_wishlist.entity";
import LoginDTO from "./dto/login.dto";
import RecoveryPassword from "./recovery_password.entity";
import RegisterCustomerDTO from "./dto/register-customer.dto";
import AddToCartDTO from "./dto/add-to-cart.dto";
import DiminishFromCartDTO from "./dto/diminish-from-cart.dto";
import RemoveFromCartDTO from "./dto/remove-from-cart.dto";
import Order from "../order/order.entity";
import OrderItem from "../order/order_item.entity";
import ProductInformation from "../product/product_information.entity";
import ProductAttributeGroup from "../product/product_attribute_group.entity";
import ProductAttributeValue from "../product/product_attribute_value.entity";
import Promotion from "../../modules/promotion/promotion.entity";
import CustomerLoyaltyLevel from "./customer_loyalty_level.entity";
import CustomerLoyaltyRate from "./customer_loyalty_rate.entity";
import CustomerAddress from "./customer_address.entity";
import { DiscountTransactionType, OrderType } from "../../types/types";
import { CustomerLoyaltyLevelArrayDTO } from "./dto/customer_loyalty_level.dto";
import { getCustomerSegments } from "./utils/customers.util";
import CouponInsertDTO from './dto/coupon_insert.dto'
import Coupon from './coupon.entity'
import CustomerCoupon from './customer_coupon.entity'
import * as moment from 'moment'
import { start } from "repl";
import CreateCustomerAddressDTO from "./dto/create-customer-address.dto";
@Injectable()
class CustomerService {
    constructor(
        @InjectRepository(Customer) private customerRepository: Repository<Customer>,
        @InjectRepository(CustomerAddress) private customerAddressRepository: Repository<CustomerAddress>,
        @InjectRepository(RecoveryPassword) private recoveryPasswordRepository: Repository<RecoveryPassword>,
        @InjectRepository(Cart) private cartRepository: Repository<Cart>,
        @InjectRepository(CartItem) private cartItemRepository: Repository<CartItem>,
        @InjectRepository(Product) private productRepository: Repository<Product>,
        @InjectRepository(ProductInformation) private productInformationRepository: Repository<ProductInformation>,
        @InjectRepository(ProductAttributeGroup) private productAttributeGroupRepository: Repository<ProductAttributeGroup>,
        @InjectRepository(ProductAttributeValue) private productAttributeValueRepository: Repository<ProductAttributeValue>,
        @InjectRepository(CustomerWishlist) private customerWishListRepository: Repository<CustomerWishlist>,
        @InjectRepository(Order) private orderRepository: Repository<Order>,
        @InjectRepository(OrderItem) private orderItemRepository: Repository<OrderItem>,
        @InjectRepository(Promotion) private promotionRepository: Repository<Promotion>,
        @InjectRepository(CustomerLoyaltyLevel) private customerLoyaltyLevelRepository: Repository<CustomerLoyaltyLevel>,
        @InjectRepository(CustomerLoyaltyRate) private customerLoyaltyRateRepository: Repository<CustomerLoyaltyRate>,
        @InjectRepository(Coupon) private couponRepository: Repository<Coupon>,
        @InjectRepository(CustomerCoupon) private customerCouponRepository: Repository<CustomerCoupon>,
        private jwtService: JwtService,
    ) {
    }

    getCartInfo = async (item: any, subtotal: number, totalItems: number) => {
        const quantity = item.QUANTITY;
        const product = await this.productRepository.findOne({ where: { SID: item.SID_PRODUCT } });
        const productInformation = await this.productInformationRepository.findOne({ where: { SID: product.SID_PRODUCT_INFORMATION } });
        const productPriceInfo = productInformation.productPrices.sort((a, b) => b.CREATED_DATETIME.getTime() - a.CREATED_DATETIME.getTime())[0];
        const pricePerProduct = productInformation.productPrices.sort((a, b) => b.CREATED_DATETIME.getTime() - a.CREATED_DATETIME.getTime())[0].UNIT_PRICE;
        const taxRate = productPriceInfo.TAX;
        const taxPrice = pricePerProduct / 100 * taxRate * quantity;
        const discountPercentage = productPriceInfo.DISCOUNT;
        const discountPrice = pricePerProduct / 100 * discountPercentage;
        subtotal += quantity * (parseFloat(pricePerProduct.toString()) - parseFloat(discountPrice.toString()));
        totalItems += quantity;
        item.product.PRICE = productInformation.productPrices.sort((a, b) => b.CREATED_DATETIME.getTime() - a.CREATED_DATETIME.getTime())[0].UNIT_PRICE;;
        const attributeValues = await this.productAttributeValueRepository.find({ where: { SID_PRODUCT: product.SID } });
        const groupedAttribute = await this.productAttributeGroupRepository.findOne({ where: { ID: attributeValues[0].PRODUCT_ATTRIBUTE_GROUP_ID } });
        let groupedAttributeValue: number | string | Date;
        if (groupedAttribute.GROUP_VALUE_DECIMAL) groupedAttributeValue = groupedAttribute.GROUP_VALUE_DECIMAL;
        if (groupedAttribute.GROUP_VALUE_INT) groupedAttributeValue = groupedAttribute.GROUP_VALUE_INT;
        if (groupedAttribute.GROUP_VALUE_VARCHAR) groupedAttributeValue = groupedAttribute.GROUP_VALUE_VARCHAR;
        if (groupedAttribute.GROUP_VALUE_DATETIME) groupedAttributeValue = groupedAttribute.GROUP_VALUE_DATETIME;
        let attributeValue: number | string | Date;
        if (attributeValues[0].VALUE_DECIMAL) attributeValue = attributeValues[0].VALUE_DECIMAL;
        if (attributeValues[0].VALUE_INT) attributeValue = attributeValues[0].VALUE_INT;
        if (attributeValues[0].VALUE_DATETIME) attributeValue = attributeValues[0].VALUE_DATETIME;
        if (attributeValues[0].VALUE_VARCHAR) attributeValue = attributeValues[0].VALUE_VARCHAR;
        item.product.PRODUCT_NAME = productInformation.PRODUCT_NAME + ' - ' + groupedAttributeValue + ', ' + attributeValue;
        return { subtotal, totalItems, taxPrice };
    }

    async getAllCustomers(query: any) {
        const page = query.page;
        const q = query.q;
        const take = 5;
        const skip = (page - 1) * take;
        let customersList: Array<{
            id: number,
            FIRST_NAME: string,
            LAST_NAME: string,
            BIRTH_DAY: number,
            BIRTH_MONTH: number,
            BIRTH_YEAR: number,
            EMAIL: string,
            GENDER: string,
            PHONE: string,
            CITY: string,
            DISTRICT: string,
            STREET_ADDRESS: string,
        }> = [];
        const getCustomersQuery = this.customerRepository
            .createQueryBuilder('customer')
            .select('customer')
            .leftJoinAndSelect('customer.addresses', 'addresses')
            .leftJoinAndSelect('customer.orders', 'orders')
        if (q && q !== '*') getCustomersQuery
            .where(`customer.EMAIL Like '%${q}%'`)
            .orWhere(`FIRST_NAME Like '%${q}%'`)
            .orWhere(`LAST_NAME Like '%${q}%'`)
            .orWhere(`CONCAT(FIRST_NAME,' ',LAST_NAME) Like '%${q}%'`)
            .orWhere(`addresses.CITY Like '%${q}%'`)
            .orWhere(`addresses.STREET_ADDRESS Like '%${q}%'`)
            .orWhere(`addresses.PHONE Like '%${q}%'`);
        const customers = await getCustomersQuery
            // .take(take)
            // .skip(skip)
            .getMany();
        customers.map((customer, i: number) => {
            const id = i + 1;
            const FIRST_NAME = customer.FIRST_NAME;
            const LAST_NAME = customer.LAST_NAME;
            const BIRTH_DAY = customer.BIRTH_DAY;
            const BIRTH_MONTH = customer.BIRTH_MONTH;
            const BIRTH_YEAR = customer.BIRTH_YEAR;
            const EMAIL = customer.EMAIL;
            const GENDER = customer.GENDER;
            const PHONE = customer.PHONE;
            let CITY = "";
            let DISTRICT = "";
            let STREET_ADDRESS = "";
            if (customer.addresses.length > 0) {
                const defaultAddress = customer.addresses.filter(address => address.IS_DEFAULT_ADDRESS === 1)[0];
                CITY = defaultAddress.CITY;
                DISTRICT = defaultAddress.DISTRICT;
                STREET_ADDRESS = defaultAddress.STREET_ADDRESS;
            }
            customersList.push({ id, FIRST_NAME, LAST_NAME, BIRTH_DAY, BIRTH_MONTH, BIRTH_YEAR, EMAIL, GENDER, PHONE, CITY, DISTRICT, STREET_ADDRESS });
        })
        // const getTotalRecordsQuery = this.customerRepository
        //     .createQueryBuilder('customer')
        //     .select('customer');
        // if (q && q !== '*') getCustomersQuery
        //     .where(`customer.EMAIL Like '%${q}%'`)
        //     .orWhere(`FIRST_NAME Like '%${q}%'`)
        //     .orWhere(`LAST_NAME Like '%${q}%'`)
        //     .orWhere(`CONCAT(FIRST_NAME,' ',LAST_NAME) Like '%${q}%'`);
        // const totalRecords = await getTotalRecordsQuery.getCount();
        const totalRecords = 0;
        return { customers: customersList, totalRecords };
    }

    async register(registerDTO: RegisterCustomerDTO) {
        const customer = await this.customerRepository
            .createQueryBuilder('customer')
            .select('customer')
            .where(`EMAIL='${registerDTO.EMAIL}'`)
            .getOne();
        if (customer) return { error: 'Email existed' };
        const hash_password = hashSync(registerDTO.PASSWORD, 10);
        const newCustomer = this.customerRepository.create({
            EMAIL: registerDTO.EMAIL,
            FIRST_NAME: registerDTO.FIRST_NAME,
            LAST_NAME: registerDTO.LAST_NAME,
            PHONE: registerDTO.PHONE,
            HASH_PASSWORD: hash_password
        });
        await newCustomer.save();
        newCustomer.HASH_PASSWORD = '';
        return {
            customer: newCustomer,
        }
    }

    async login(loginDTO: LoginDTO) {
        const customer = await this.customerRepository
            .createQueryBuilder('customer')
            .select('customer')
            .leftJoinAndSelect('customer.addresses', 'addresses')
            .where(`EMAIL='${loginDTO.EMAIL}'`)
            .andWhere(`ACTIVE=1`)
            .getOne();
        // console.log(customer);
        if (!customer) return { error: 'Incorrect email' };
        const verify = compareSync(loginDTO.PASSWORD, customer.HASH_PASSWORD);
        if (!verify) return { error: 'Incorrect password' };
        let customer_info = customer;
        delete customer_info.HASH_PASSWORD;
        console.log(customer_info);
        return {
            customer_info
        }
    }

    async forgotPassword(EMAIL: string) {
        const customer = await this.customerRepository
            .createQueryBuilder('customer')
            .select('customer')
            .where(`EMAIL='${EMAIL}'`)
            .getOne();
        if (!customer) return { error: 'Cannot find any account with that email' };
        const previousAvailableRecovery = await this.recoveryPasswordRepository.findOne({ where: { CUSTOMER_SID: customer.SID, STATUS: 1 } });
        if (previousAvailableRecovery) {
            previousAvailableRecovery.STATUS = 0;
            await previousAvailableRecovery.save();
        }
        const recoveryToken = this.jwtService.sign({ customerId: customer.SID, createdDate: new Date() }, { secret: tokenConfig.recovery_password_token_secret_key, expiresIn: tokenConfig.recovery_password_token_duration });
        try {
            const newRecoveryPassword = this.recoveryPasswordRepository.create({
                CUSTOMER_SID: customer.SID,
                RECOVERY_TOKEN: recoveryToken
            });
            await newRecoveryPassword.save();
            return { recoveryId: newRecoveryPassword.RECOVERY_ID };
        } catch (error) {
            return { error: error };
        }
    }

    async resetPassword(RECOVERY_ID: string, NEW_PASSWORD: string) {
        try {
            const recovery = await this.recoveryPasswordRepository.findOne({ where: { RECOVERY_ID } });
            if (!recovery) return { error: 'This reset password link is invalid' };
            if (recovery.STATUS === 0) return { error: 'This reset password link is already used' };
            try {
                const recoveryToken = recovery.RECOVERY_TOKEN;
                const decoded = await this.jwtService.verifyAsync(recoveryToken, { secret: tokenConfig.recovery_password_token_secret_key });
                if (decoded) {
                    const customerToResetPassword = await this.customerRepository
                        .createQueryBuilder('customer')
                        .where(`SID='${decoded.customerId}'`)
                        .getOne();
                    if (!customerToResetPassword) return { error: 'Cannot find customer with that email' };
                    const HASH_PASSWORD = hashSync(NEW_PASSWORD, 10);
                    customerToResetPassword.HASH_PASSWORD = HASH_PASSWORD;
                    try {
                        await customerToResetPassword.save();
                        recovery.STATUS = 0;
                        await recovery.save();
                        return { message: 'Reset password success' };
                    } catch (error) {
                        return { error: error };
                    }
                } else {
                    return { error: 'This reset password link is expired' };
                }
            } catch (error) {
                return { error: 'This reset password link is expired' };
            }
        } catch (error) {
            return { error: error };
        }
    }

    async addToCart(CUSTOMER_SID: string | null, SESSION_ID: string | null, addToCartDTO: AddToCartDTO) {
        const { SID_PRODUCT, QTY } = addToCartDTO;
        const product = await this.productRepository.findOne({ where: { SID: SID_PRODUCT } });
        const product_information = await this.productInformationRepository.findOne({ where: { SID: product.SID_PRODUCT_INFORMATION } });
        let sellableQty: number;
        let reservationQty: number;
        sellableQty = 0;
        reservationQty = 0;
        if (!product_information.CAN_PREORDER) {
            const currentQty = product.QTY;
            const threshold = product_information.THRESHOLD;
            const orderToCalculateReserveQty = await this.orderRepository.find(
                {
                    where: { STATUS: Not(In([5, 7, 8])) }
                }
            );
            if (orderToCalculateReserveQty.length > 0) {
                orderToCalculateReserveQty.map(order => {
                    const orderItems = order.orderItems;
                    const orderItem = orderItems.filter(order => order.SID_PRODUCT === SID_PRODUCT)[0];
                    if (orderItem) {
                        reservationQty += orderItem.QUANTITY;
                    }
                })
            }
            sellableQty = currentQty - threshold - reservationQty;
        }
        if (CUSTOMER_SID) {
            const existedCart = await this.cartRepository.findOne({ where: { SID_CUSTOMER: CUSTOMER_SID, STATUS: 1 } });
            if (existedCart) {
                const items = existedCart.items;
                if (items.filter(item => item.SID_PRODUCT === addToCartDTO.SID_PRODUCT).length === 0) {
                    if (product_information.CAN_PREORDER || sellableQty > 0) {
                        const newCartItem = this.cartItemRepository.create({ SID_PRODUCT: addToCartDTO.SID_PRODUCT, QUANTITY: QTY, CART_SID: existedCart.SID });
                        await newCartItem.save();
                    }
                } else {
                    const existedItem = await this.cartItemRepository.findOne({ where: { SID_PRODUCT: addToCartDTO.SID_PRODUCT, CART_SID: existedCart.SID } });
                    if (product_information.CAN_PREORDER || sellableQty - existedItem.QUANTITY > 0) {
                        existedItem.QUANTITY = existedItem.QUANTITY + QTY;
                        await existedItem.save();
                    }
                }
            } else {
                const newCart = await this.cartRepository.create({ SID_CUSTOMER: CUSTOMER_SID });
                await newCart.save();
                if (product_information.CAN_PREORDER || sellableQty > 0) {
                    const newCartItem = await this.cartItemRepository.create({ SID_PRODUCT: addToCartDTO.SID_PRODUCT, CART_SID: newCart.SID, QUANTITY: QTY });
                    await newCartItem.save();
                }
            }
            return { ...await (await this.getCustomerCartInfo(CUSTOMER_SID, undefined)).cartInfo };
        } else if (SESSION_ID) {
            const existedCart = await this.cartRepository.findOne({ where: { SESSION_ID, STATUS: 1 } });
            if (existedCart) {
                const items = existedCart.items;
                if (items.filter(item => item.SID_PRODUCT === addToCartDTO.SID_PRODUCT).length === 0) {
                    if (product_information.CAN_PREORDER || sellableQty > 0) {
                        const newCartItem = await this.cartItemRepository.create({ SID_PRODUCT: addToCartDTO.SID_PRODUCT, QUANTITY: QTY, CART_SID: existedCart.SID });
                        await newCartItem.save();
                    }
                } else {
                    const existedItem = await this.cartItemRepository.findOne({ where: { SID_PRODUCT: addToCartDTO.SID_PRODUCT, CART_SID: existedCart.SID } });
                    if (product_information.CAN_PREORDER || sellableQty - existedItem.QUANTITY > 0) {
                        existedItem.QUANTITY = existedItem.QUANTITY + QTY;
                        await existedItem.save();
                    }
                }
            } else {
                const newCart = await this.cartRepository.create({ SESSION_ID });
                await newCart.save();
                if (product_information.CAN_PREORDER || sellableQty > 0) {
                    const newCartItem = await this.cartItemRepository.create({ SID_PRODUCT: addToCartDTO.SID_PRODUCT, CART_SID: newCart.SID, QUANTITY: QTY });
                    await newCartItem.save();
                }
            }
            return { ...(await this.getCustomerCartInfo(null, SESSION_ID)).cartInfo };
        }
    }

    // async addToCart(CUSTOMER_SID: string | null, SESSION_ID: string | null, addToCartDTO: AddToCartDTO) {
    //     const { SID_PRODUCT, QTY } = addToCartDTO;
    //     const product = await this.productRepository.findOne({ where: { SID: SID_PRODUCT } });
    //     const product_information = await this.productInformationRepository.findOne({ where: { SID: product.SID_PRODUCT_INFORMATION } });
    //     let sellableQty: number;
    //     let reservationQty: number;
    //     sellableQty = 0;
    //     reservationQty = 0;
    //     if (!product_information.CAN_PREORDER) {
    //         const currentQty = product.QTY;
    //         const threshold = product_information.THRESHOLD;
    //         const orderToCalculateReserveQty = await this.orderRepository.find(
    //             {
    //                 where: { STATUS: Not(In([5, 7, 8])) }
    //             }
    //         );
    //         if (orderToCalculateReserveQty.length > 0) {
    //             orderToCalculateReserveQty.map(order => {
    //                 const orderItems = order.orderItems;
    //                 const orderItem = orderItems.filter(order => order.SID_PRODUCT === SID_PRODUCT)[0];
    //                 if (orderItem) {
    //                     reservationQty += orderItem.QUANTITY;
    //                 }
    //             })
    //         }
    //         sellableQty = currentQty - threshold - reservationQty;
    //     }
    //     if (CUSTOMER_SID) {
    //         const existedCart = await this.cartRepository.findOne({ where: { SID_CUSTOMER: CUSTOMER_SID, STATUS: 1 } });
    //         if (existedCart) {
    //             const items = existedCart.items;
    //             if (items.filter(item => item.SID_PRODUCT === addToCartDTO.SID_PRODUCT).length === 0) {
    //                 if (product_information.CAN_PREORDER || sellableQty > 0) {
    //                     const newCartItem = this.cartItemRepository.create({ SID_PRODUCT: addToCartDTO.SID_PRODUCT, QUANTITY: QTY, CART_SID: existedCart.SID });
    //                     await newCartItem.save();
    //                     const cartAfterAddedItem = await this.cartRepository.findOne({ where: { SID: existedCart.SID } });
    //                     let items: Array<any>;
    //                     items = cartAfterAddedItem.items;
    //                     let subtotal: number;
    //                     let totalItems: number;
    //                     subtotal = 0;
    //                     totalItems = 0;
    //                     const getCartInfo = items.map(async item => {
    //                         const response = await this.getCartInfo(item, subtotal, totalItems);
    //                         subtotal += response.subtotal;
    //                         totalItems += response.totalItems;
    //                     });
    //                     await Promise.all(getCartInfo);
    //                     const cartInfo = {
    //                         SID: cartAfterAddedItem.SID,
    //                         SID_CUSTOMER: cartAfterAddedItem.SID_CUSTOMER,
    //                         CREATED_DATETIME: cartAfterAddedItem.CREATED_DATETIME,
    //                         STATUS: cartAfterAddedItem.STATUS,
    //                         SUB_TOTAL: subtotal,
    //                         TOTAL_ITEMS: totalItems,
    //                         items: cartAfterAddedItem.items
    //                     }
    //                     return cartInfo;
    //                 } else {
    //                     let items: Array<any>;
    //                     items = existedCart.items;
    //                     let subtotal: number;
    //                     let totalItems: number;
    //                     subtotal = 0;
    //                     totalItems = 0;
    //                     const getCartInfo = items.map(async item => {
    //                         const response = await this.getCartInfo(item, subtotal, totalItems);
    //                         subtotal += response.subtotal;
    //                         totalItems += response.totalItems;
    //                     });
    //                     await Promise.all(getCartInfo);
    //                     const cartInfo = {
    //                         SID: existedCart.SID,
    //                         SID_CUSTOMER: existedCart.SID_CUSTOMER,
    //                         CREATED_DATETIME: existedCart.CREATED_DATETIME,
    //                         STATUS: existedCart.STATUS,
    //                         SUB_TOTAL: subtotal,
    //                         TOTAL_ITEMS: totalItems,
    //                         items: existedCart.items
    //                     }
    //                     return cartInfo;
    //                 }
    //             } else {
    //                 const existedItem = await this.cartItemRepository.findOne({ where: { SID_PRODUCT: addToCartDTO.SID_PRODUCT, CART_SID: existedCart.SID } });
    //                 if (product_information.CAN_PREORDER || sellableQty - existedItem.QUANTITY > 0) {
    //                     existedItem.QUANTITY = existedItem.QUANTITY + QTY;
    //                     await existedItem.save();
    //                     const cartAfterAddedItem = await this.cartRepository.findOne({ where: { SID: existedCart.SID } });
    //                     let items: Array<any>;
    //                     items = cartAfterAddedItem.items;
    //                     let subtotal: number;
    //                     let totalItems: number;
    //                     subtotal = 0;
    //                     totalItems = 0;
    //                     const getCartInfo = items.map(async item => {
    //                         const response = await this.getCartInfo(item, subtotal, totalItems);
    //                         subtotal += response.subtotal;
    //                         totalItems += response.totalItems;
    //                     });
    //                     await Promise.all(getCartInfo);

    //                     const cartInfo = {
    //                         SID: cartAfterAddedItem.SID,
    //                         SID_CUSTOMER: cartAfterAddedItem.SID_CUSTOMER,
    //                         CREATED_DATETIME: cartAfterAddedItem.CREATED_DATETIME,
    //                         STATUS: cartAfterAddedItem.STATUS,
    //                         SUB_TOTAL: subtotal,
    //                         TOTAL_ITEMS: totalItems,
    //                         items: cartAfterAddedItem.items
    //                     }
    //                     return cartInfo;
    //                 } else {
    //                     let items: Array<any>;
    //                     items = existedCart.items;
    //                     let subtotal: number;
    //                     let totalItems: number;
    //                     subtotal = 0;
    //                     totalItems = 0;
    //                     const getCartInfo = items.map(async item => {
    //                         const response = await this.getCartInfo(item, subtotal, totalItems);
    //                         subtotal += response.subtotal;
    //                         totalItems += response.totalItems;
    //                     });
    //                     await Promise.all(getCartInfo);

    //                     const cartInfo = {
    //                         SID: existedCart.SID,
    //                         SID_CUSTOMER: existedCart.SID_CUSTOMER,
    //                         CREATED_DATETIME: existedCart.CREATED_DATETIME,
    //                         STATUS: existedCart.STATUS,
    //                         SUB_TOTAL: subtotal,
    //                         TOTAL_ITEMS: totalItems,
    //                         items: existedCart.items
    //                     }
    //                     return cartInfo;
    //                 }
    //             }
    //         } else {
    //             const newCart = this.cartRepository.create({ SID_CUSTOMER: CUSTOMER_SID });
    //             await newCart.save();
    //             if (product_information.CAN_PREORDER || sellableQty > 0) {
    //                 const newCartItem = this.cartItemRepository.create({ SID_PRODUCT: addToCartDTO.SID_PRODUCT, CART_SID: newCart.SID, QUANTITY: QTY });
    //                 await newCartItem.save();
    //                 const cartAfterAddedItem = await this.cartRepository.findOne({ where: { SID: newCart.SID } });
    //                 let items: Array<any>;
    //                 items = cartAfterAddedItem.items;
    //                 let subtotal: number;
    //                 let totalItems: number;
    //                 subtotal = 0;
    //                 totalItems = 0;
    //                 const getCartInfo = items.map(async item => {
    //                     const response = await this.getCartInfo(item, subtotal, totalItems);
    //                     subtotal += response.subtotal;
    //                     totalItems += response.totalItems;
    //                 });
    //                 await Promise.all(getCartInfo);
    //                 const cartInfo = {
    //                     SID: cartAfterAddedItem.SID,
    //                     SID_CUSTOMER: cartAfterAddedItem.SID_CUSTOMER,
    //                     CREATED_DATETIME: cartAfterAddedItem.CREATED_DATETIME,
    //                     STATUS: cartAfterAddedItem.STATUS,
    //                     SUB_TOTAL: subtotal,
    //                     TOTAL_ITEMS: totalItems,
    //                     items: cartAfterAddedItem.items
    //                 }
    //                 return cartInfo;
    //             } else {
    //                 let subtotal: number;
    //                 let totalItems: number;
    //                 subtotal = 0;
    //                 totalItems = 0;
    //                 const cartInfo = {
    //                     SID: newCart.SID,
    //                     SID_CUSTOMER: newCart.SID_CUSTOMER,
    //                     CREATED_DATETIME: newCart.CREATED_DATETIME,
    //                     STATUS: newCart.STATUS,
    //                     SUB_TOTAL: subtotal,
    //                     TOTAL_ITEMS: totalItems,
    //                     items: newCart.items
    //                 }
    //                 return cartInfo;
    //             }
    //         }
    //     } else if (SESSION_ID) {
    //         const existedCart = await this.cartRepository.findOne({ where: { SESSION_ID, STATUS: 1 } });
    //         if (existedCart) {
    //             const items = existedCart.items;
    //             if (items.filter(item => item.SID_PRODUCT === addToCartDTO.SID_PRODUCT).length === 0) {
    //                 if (product_information.CAN_PREORDER || sellableQty > 0) {
    //                     const newCartItem = this.cartItemRepository.create({ SID_PRODUCT: addToCartDTO.SID_PRODUCT, QUANTITY: QTY, CART_SID: existedCart.SID });
    //                     await newCartItem.save();
    //                     const cartAfterAddedItem = await this.cartRepository.findOne({ where: { SID: existedCart.SID } });
    //                     let items: Array<any>;
    //                     items = cartAfterAddedItem.items;
    //                     let subtotal: number;
    //                     let totalItems: number;
    //                     subtotal = 0;
    //                     totalItems = 0;
    //                     const getCartInfo = items.map(async item => {
    //                         const response = await this.getCartInfo(item, subtotal, totalItems);
    //                         subtotal += response.subtotal;
    //                         totalItems += response.totalItems;
    //                     });
    //                     await Promise.all(getCartInfo);
    //                     const cartInfo = {
    //                         SID: cartAfterAddedItem.SID,
    //                         SID_CUSTOMER: cartAfterAddedItem.SID_CUSTOMER,
    //                         CREATED_DATETIME: cartAfterAddedItem.CREATED_DATETIME,
    //                         STATUS: cartAfterAddedItem.STATUS,
    //                         SUB_TOTAL: subtotal,
    //                         TOTAL_ITEMS: totalItems,
    //                         items: cartAfterAddedItem.items
    //                     }
    //                     return cartInfo;
    //                 } else {
    //                     let items: Array<any>;
    //                     items = existedCart.items;
    //                     let subtotal: number;
    //                     let totalItems: number;
    //                     subtotal = 0;
    //                     totalItems = 0;
    //                     const getCartInfo = items.map(async item => {
    //                         const response = await this.getCartInfo(item, subtotal, totalItems);
    //                         subtotal += response.subtotal;
    //                         totalItems += response.totalItems;
    //                     });
    //                     await Promise.all(getCartInfo);
    //                     const cartInfo = {
    //                         SID: existedCart.SID,
    //                         SID_CUSTOMER: existedCart.SID_CUSTOMER,
    //                         CREATED_DATETIME: existedCart.CREATED_DATETIME,
    //                         STATUS: existedCart.STATUS,
    //                         SUB_TOTAL: subtotal,
    //                         TOTAL_ITEMS: totalItems,
    //                         items: existedCart.items
    //                     }
    //                     return cartInfo;
    //                 }
    //             } else {
    //                 const existedItem = await this.cartItemRepository.findOne({ where: { SID_PRODUCT: addToCartDTO.SID_PRODUCT, CART_SID: existedCart.SID } });
    //                 if (product_information.CAN_PREORDER || sellableQty - existedItem.QUANTITY > 0) {
    //                     existedItem.QUANTITY = existedItem.QUANTITY + QTY;
    //                     await existedItem.save();
    //                     const cartAfterAddedItem = await this.cartRepository.findOne({ where: { SID: existedCart.SID } });
    //                     let items: Array<any>;
    //                     items = cartAfterAddedItem.items;
    //                     let subtotal: number;
    //                     let totalItems: number;
    //                     subtotal = 0;
    //                     totalItems = 0;
    //                     const getCartInfo = items.map(async item => {
    //                         const response = await this.getCartInfo(item, subtotal, totalItems);
    //                         subtotal += response.subtotal;
    //                         totalItems += response.totalItems;
    //                     });
    //                     await Promise.all(getCartInfo);
    //                     const cartInfo = {
    //                         SID: cartAfterAddedItem.SID,
    //                         SID_CUSTOMER: cartAfterAddedItem.SID_CUSTOMER,
    //                         CREATED_DATETIME: cartAfterAddedItem.CREATED_DATETIME,
    //                         STATUS: cartAfterAddedItem.STATUS,
    //                         SUB_TOTAL: subtotal,
    //                         TOTAL_ITEMS: totalItems,
    //                         items: cartAfterAddedItem.items
    //                     }
    //                     return cartInfo;
    //                 } else {
    //                     let items: Array<any>;
    //                     items = existedCart.items;
    //                     let subtotal: number;
    //                     let totalItems: number;
    //                     subtotal = 0;
    //                     totalItems = 0;
    //                     const getCartInfo = items.map(async item => {
    //                         const response = await this.getCartInfo(item, subtotal, totalItems);
    //                         subtotal += response.subtotal;
    //                         totalItems += response.totalItems;
    //                     });
    //                     await Promise.all(getCartInfo);
    //                     const cartInfo = {
    //                         SID: existedCart.SID,
    //                         SID_CUSTOMER: existedCart.SID_CUSTOMER,
    //                         CREATED_DATETIME: existedCart.CREATED_DATETIME,
    //                         STATUS: existedCart.STATUS,
    //                         SUB_TOTAL: subtotal,
    //                         TOTAL_ITEMS: totalItems,
    //                         items: existedCart.items
    //                     }
    //                     return cartInfo;
    //                 }
    //             }
    //         } else {
    //             const newCart = this.cartRepository.create({ SESSION_ID });
    //             await newCart.save();
    //             if (product_information.CAN_PREORDER || sellableQty > 0) {
    //                 const newCartItem = this.cartItemRepository.create({ SID_PRODUCT: addToCartDTO.SID_PRODUCT, CART_SID: newCart.SID, QUANTITY: QTY });
    //                 await newCartItem.save();
    //                 const cartAfterAddedItem = await this.cartRepository.findOne({ where: { SID: newCart.SID } });
    //                 let items: Array<any>;
    //                 items = cartAfterAddedItem.items;
    //                 let subtotal: number;
    //                 let totalItems: number;
    //                 subtotal = 0;
    //                 totalItems = 0;
    //                 const getCartInfo = items.map(async item => {
    //                     const response = await this.getCartInfo(item, subtotal, totalItems);
    //                     subtotal += response.subtotal;
    //                     totalItems += response.totalItems;
    //                 });
    //                 await Promise.all(getCartInfo);
    //                 const cartInfo = {
    //                     SID: cartAfterAddedItem.SID,
    //                     SID_CUSTOMER: cartAfterAddedItem.SID_CUSTOMER,
    //                     CREATED_DATETIME: cartAfterAddedItem.CREATED_DATETIME,
    //                     STATUS: cartAfterAddedItem.STATUS,
    //                     SUB_TOTAL: subtotal,
    //                     TOTAL_ITEMS: totalItems,
    //                     items: cartAfterAddedItem.items
    //                 }
    //                 return cartInfo;
    //             } else {
    //                 let subtotal: number;
    //                 let totalItems: number;
    //                 subtotal = 0;
    //                 totalItems = 0;
    //                 const cartInfo = {
    //                     SID: newCart.SID,
    //                     SID_CUSTOMER: newCart.SID_CUSTOMER,
    //                     CREATED_DATETIME: newCart.CREATED_DATETIME,
    //                     STATUS: newCart.STATUS,
    //                     SUB_TOTAL: subtotal,
    //                     TOTAL_ITEMS: totalItems,
    //                     items: newCart.items
    //                 }
    //                 return cartInfo;
    //             }
    //         }
    //     }
    // }

    async diminishFromCart(CUSTOMER_SID: string | null, SESSION_ID: string | null, diminishFromCartDTO: DiminishFromCartDTO) {
        if (CUSTOMER_SID) {
            const currentCart = await this.cartRepository.findOne({ where: { SID_CUSTOMER: CUSTOMER_SID, STATUS: 1 } });
            const items = currentCart.items;
            const SID_PRODUCT = diminishFromCartDTO.SID_PRODUCT;
            const itemToDiminish = items.filter(item => item.SID_PRODUCT === SID_PRODUCT)[0];
            if (itemToDiminish) {
                if (itemToDiminish.QUANTITY - diminishFromCartDTO.QTY > 0) {
                    itemToDiminish.QUANTITY = itemToDiminish.QUANTITY - diminishFromCartDTO.QTY;
                    await itemToDiminish.save();
                } else
                    if (itemToDiminish.QUANTITY - diminishFromCartDTO.QTY === 0) {
                        await this.cartItemRepository.remove(itemToDiminish);
                    }
                    else {
                        return { error: 'The diminished quantity is greater than the item cart quantity' };
                    }
                return {
                    cartInfo: await (await this.getCustomerCartInfo(CUSTOMER_SID, undefined)).cartInfo
                };
            }
            return { error: 'There is no product with that SID in your cart' };
        } else if (SESSION_ID) {
            const currentCart = await this.cartRepository.findOne({ where: { SESSION_ID, STATUS: 1 } });
            const items = currentCart.items;
            const SID_PRODUCT = diminishFromCartDTO.SID_PRODUCT;
            const itemToDiminish = items.filter(item => item.SID_PRODUCT === SID_PRODUCT)[0];
            if (itemToDiminish) {
                if (itemToDiminish.QUANTITY - diminishFromCartDTO.QTY > 0) {
                    itemToDiminish.QUANTITY = itemToDiminish.QUANTITY - diminishFromCartDTO.QTY;
                    await itemToDiminish.save();
                } else
                    if (itemToDiminish.QUANTITY - diminishFromCartDTO.QTY === 0) {
                        await this.cartItemRepository.remove(itemToDiminish);
                    }
                    else {
                        return { error: 'The diminished quantity is greater than the item cart quantity' };
                    }
                return {
                    cartInfo: await (await this.getCustomerCartInfo(undefined, SESSION_ID)).cartInfo
                };
            }
            return { error: 'There is no product with that SID in your cart' };

        }
    }

    // async diminishFromCart(CUSTOMER_SID: string | null, SESSION_ID: string | null, diminishFromCartDTO: DiminishFromCartDTO) {
    //     if (CUSTOMER_SID) {
    //         const currentCart = await this.cartRepository.findOne({ where: { SID_CUSTOMER: CUSTOMER_SID, STATUS: 1 } });
    //         const items = currentCart.items;
    //         const SID_PRODUCT = diminishFromCartDTO.SID_PRODUCT;
    //         const itemToDiminish = items.filter(item => item.SID_PRODUCT === SID_PRODUCT)[0];
    //         if (itemToDiminish) {
    //             if (itemToDiminish.QUANTITY > 1) {
    //                 itemToDiminish.QUANTITY = itemToDiminish.QUANTITY - 1;
    //                 await itemToDiminish.save();
    //                 const newCartAfterDimishedProduct = await this.cartRepository.findOne({ where: { SID: currentCart.SID } });
    //                 let items: Array<any>;
    //                 items = newCartAfterDimishedProduct.items;
    //                 let subtotal: number;
    //                 let totalItems: number;
    //                 subtotal = 0;
    //                 totalItems = 0;
    //                 const getCartInfo = items.map(async item => {
    //                     const response = await this.getCartInfo(item, subtotal, totalItems);
    //                     subtotal += response.subtotal;
    //                     totalItems += response.totalItems;
    //                 });
    //                 await Promise.all(getCartInfo);
    //                 const cartInfo = {
    //                     SID: newCartAfterDimishedProduct.SID,
    //                     SID_CUSTOMER: newCartAfterDimishedProduct.SID_CUSTOMER,
    //                     CREATED_DATETIME: newCartAfterDimishedProduct.CREATED_DATETIME,
    //                     STATUS: newCartAfterDimishedProduct.STATUS,
    //                     SUB_TOTAL: subtotal,
    //                     TOTAL_ITEMS: totalItems,
    //                     items: newCartAfterDimishedProduct.items
    //                 }
    //                 return { cartInfo };
    //             } else {
    //                 await this.cartItemRepository.remove(itemToDiminish);
    //                 const newCartAfterDimishedProduct = await this.cartRepository.findOne({ where: { SID: currentCart.SID } });
    //                 let items: Array<any>;
    //                 items = newCartAfterDimishedProduct.items;
    //                 let subtotal: number;
    //                 let totalItems: number;
    //                 subtotal = 0;
    //                 totalItems = 0;
    //                 const getCartInfo = items.map(async item => {
    //                     const response = await this.getCartInfo(item, subtotal, totalItems);
    //                     subtotal += response.subtotal;
    //                     totalItems += response.totalItems;
    //                 });
    //                 await Promise.all(getCartInfo);
    //                 const cartInfo = {
    //                     SID: newCartAfterDimishedProduct.SID,
    //                     SID_CUSTOMER: newCartAfterDimishedProduct.SID_CUSTOMER,
    //                     CREATED_DATETIME: newCartAfterDimishedProduct.CREATED_DATETIME,
    //                     STATUS: newCartAfterDimishedProduct.STATUS,
    //                     SUB_TOTAL: subtotal,
    //                     TOTAL_ITEMS: totalItems,
    //                     items: newCartAfterDimishedProduct.items
    //                 }
    //                 return { cartInfo };
    //             }
    //         }
    //         return { error: 'There is no product with that SID in your cart' };
    //     } else if (SESSION_ID) {
    //         const currentCart = await this.cartRepository.findOne({ where: { SESSION_ID, STATUS: 1 } });
    //         const items = currentCart.items;
    //         const SID_PRODUCT = diminishFromCartDTO.SID_PRODUCT;
    //         const itemToDiminish = items.filter(item => item.SID_PRODUCT === SID_PRODUCT)[0];
    //         if (itemToDiminish) {
    //             if (itemToDiminish.QUANTITY > 1) {
    //                 itemToDiminish.QUANTITY = itemToDiminish.QUANTITY - 1;
    //                 await itemToDiminish.save();
    //                 const newCartAfterDimishedProduct = await this.cartRepository.findOne({ where: { SID: currentCart.SID } });
    //                 let items: Array<any>;
    //                 items = newCartAfterDimishedProduct.items;
    //                 let subtotal: number;
    //                 let totalItems: number;
    //                 subtotal = 0;
    //                 totalItems = 0;
    //                 const getCartInfo = items.map(async item => {
    //                     const response = await this.getCartInfo(item, subtotal, totalItems);
    //                     subtotal += response.subtotal;
    //                     totalItems += response.totalItems;
    //                 });
    //                 await Promise.all(getCartInfo);
    //                 const cartInfo = {
    //                     SID: newCartAfterDimishedProduct.SID,
    //                     SID_CUSTOMER: newCartAfterDimishedProduct.SID_CUSTOMER,
    //                     CREATED_DATETIME: newCartAfterDimishedProduct.CREATED_DATETIME,
    //                     STATUS: newCartAfterDimishedProduct.STATUS,
    //                     SUB_TOTAL: subtotal,
    //                     TOTAL_ITEMS: totalItems,
    //                     items: newCartAfterDimishedProduct.items
    //                 }
    //                 return { cartInfo };
    //             } else {
    //                 await this.cartItemRepository.remove(itemToDiminish);
    //                 const newCartAfterDimishedProduct = await this.cartRepository.findOne({ where: { SID: currentCart.SID } });
    //                 let items: Array<any>;
    //                 items = newCartAfterDimishedProduct.items;
    //                 let subtotal: number;
    //                 let totalItems: number;
    //                 subtotal = 0;
    //                 totalItems = 0;
    //                 const getCartInfo = items.map(async item => {
    //                     const response = await this.getCartInfo(item, subtotal, totalItems);
    //                     subtotal += response.subtotal;
    //                     totalItems += response.totalItems;
    //                 });
    //                 await Promise.all(getCartInfo);
    //                 const cartInfo = {
    //                     SID: newCartAfterDimishedProduct.SID,
    //                     SID_CUSTOMER: newCartAfterDimishedProduct.SID_CUSTOMER,
    //                     CREATED_DATETIME: newCartAfterDimishedProduct.CREATED_DATETIME,
    //                     STATUS: newCartAfterDimishedProduct.STATUS,
    //                     SUB_TOTAL: subtotal,
    //                     TOTAL_ITEMS: totalItems,
    //                     items: newCartAfterDimishedProduct.items
    //                 }
    //                 return { cartInfo };
    //             }
    //         }
    //         return { error: 'There is no product with that SID in your cart' };

    //     }
    // }

    async putViewHist(custSID: String, PRODUCT_SID: String) {
        const manager = getManager();
        const d = new Date();
        const month = d.getMonth() + 1;
        const date = d.getFullYear() + "-" + month + "-" + d.getDate();
        console.log(date);
        const test = `da update`;
        let query = "";
        query = `
            INSERT INTO view_hist (SID_CUST, SID_PRODUCT_INFORMATION,CREATED_DATETIME) 
            VALUES ('${custSID}', '${PRODUCT_SID}', '${date}')`
        const similarTerms = await manager.query(query);
        return test;
    }
    async removeProductFromCart(CUSTOMER_SID: string | null, SESSION_ID: string | null, removeFromCartDTO: RemoveFromCartDTO) {
        if (CUSTOMER_SID) {
            const currentCart = await this.cartRepository.findOne({ where: { SID_CUSTOMER: CUSTOMER_SID, STATUS: 1 } });
            const items = currentCart.items;
            const SID_PRODUCT = removeFromCartDTO.SID_PRODUCT;
            const itemToRemove = items.filter(item => item.SID_PRODUCT === SID_PRODUCT)[0];
            if (itemToRemove) {
                await this.cartItemRepository.remove(itemToRemove);
                const newCartAfterDimishedProduct = await this.cartRepository.findOne({ where: { SID: currentCart.SID } });
                let items: Array<any>;
                items = newCartAfterDimishedProduct.items;
                let subtotal: number;
                let totalItems: number;
                subtotal = 0;
                totalItems = 0;
                const getCartInfo = items.map(async item => {
                    const response = await this.getCartInfo(item, subtotal, totalItems);
                    subtotal += response.subtotal;
                    totalItems += response.totalItems;
                });
                await Promise.all(getCartInfo);
                const cartInfo = {
                    SID: newCartAfterDimishedProduct.SID,
                    SID_CUSTOMER: newCartAfterDimishedProduct.SID_CUSTOMER,
                    CREATED_DATETIME: newCartAfterDimishedProduct.CREATED_DATETIME,
                    STATUS: newCartAfterDimishedProduct.STATUS,
                    SUB_TOTAL: subtotal,
                    TOTAL_ITEMS: totalItems,
                    items: newCartAfterDimishedProduct.items
                }
                return { cartInfo };
            }
            return { error: 'There is no product with that SID in your cart' };
        } else if (SESSION_ID) {
            const currentCart = await this.cartRepository.findOne({ where: { SESSION_ID, STATUS: 1 } });
            const items = currentCart.items;
            const SID_PRODUCT = removeFromCartDTO.SID_PRODUCT;
            const itemToRemove = items.filter(item => item.SID_PRODUCT === SID_PRODUCT)[0];
            if (itemToRemove) {
                await this.cartItemRepository.remove(itemToRemove);
                const newCartAfterDimishedProduct = await this.cartRepository.findOne({ where: { SID: currentCart.SID } });
                let items: Array<any>;
                items = newCartAfterDimishedProduct.items;
                let subtotal: number;
                let totalItems: number;
                subtotal = 0;
                totalItems = 0;
                const getCartInfo = items.map(async item => {
                    const response = await this.getCartInfo(item, subtotal, totalItems);
                    subtotal += response.subtotal;
                    totalItems += response.totalItems;
                });
                await Promise.all(getCartInfo);
                const cartInfo = {
                    SID: newCartAfterDimishedProduct.SID,
                    SID_CUSTOMER: newCartAfterDimishedProduct.SID_CUSTOMER,
                    CREATED_DATETIME: newCartAfterDimishedProduct.CREATED_DATETIME,
                    STATUS: newCartAfterDimishedProduct.STATUS,
                    SUB_TOTAL: subtotal,
                    TOTAL_ITEMS: totalItems,
                    items: newCartAfterDimishedProduct.items
                }
                return { cartInfo };
            }
            return { error: 'There is no product with that SID in your cart' };
        }
    }

    async getPromotionList() {
        const promotion = await this.promotionRepository.createQueryBuilder("promotion")
            .select("promotion")
            .leftJoinAndSelect("promotion.priority", "priority")
            .leftJoinAndSelect("promotion.item_rule", "item_rule")
            .leftJoinAndSelect("promotion.validation_customer_loyalty", "validation_customer_loyalty")
            .leftJoinAndSelect("item_rule.filter_element", "filter_element")
            .leftJoinAndSelect("promotion.reward_discount_item", "reward_discount_item")
            .orderBy("priority.LEVEL", "ASC")
        // console.log(promotion.getSql());
        return promotion.getMany();
    }

    async getCustomerCartInfo(SID_CUSTOMER?: string, SESSION_ID?: string) {
        const promotion = await this.getPromotionList();
        if (SID_CUSTOMER) {
            const cart = await this.cartRepository.findOne({ where: { SID_CUSTOMER: SID_CUSTOMER, STATUS: 1 } });
            if (cart) {
                let items: Array<any>;
                items = cart.items;
                let subtotal: number;
                let totalItems: number;
                let taxPrice: number = 0;
                subtotal = 0;
                totalItems = 0;
                let cartTemp: any = cart;
                const getCartInfo = items.map(async (item, index) => {
                    const response = await this.getCartInfo(item, subtotal, totalItems);
                    cartTemp.items[index].product.TAX = Number(response.taxPrice) / Number(cart.items[index].QUANTITY);
                    taxPrice += response.taxPrice;
                    subtotal += response.subtotal;
                    totalItems += response.totalItems;
                });
                await Promise.all(getCartInfo);
                let havePromo: boolean = false;
                let checkApplied: boolean = false;
                let promoName: string = "";
                let discValue: number = 0;
                let rewardType: number = 0;
                let itemsReward = null;
                let discountTransaction: Array<DiscountTransactionType> = [];
                let itemReward = [];
                let discountItems = [];
                for (let index: number = 0; index < promotion.length; index++) {
                    // console.log('a')
                    if (!promotion[index].ACTIVE) continue;
                    if (promotion[index].APPLY_COUNT !== null && Number(promotion[index].APPLY_COUNT) <= Number(promotion[index].COUNT)) continue;
                    if (checkApplied && !promotion[index].CAN_BE_APPLIED) continue;
                    const today: Date = new Date();
                    const startDate: Date = new Date(`${promotion[index].START_DATE}T00:00:00`);
                    const endDate: Date = new Date(`${promotion[index].END_DATE}T23:59:59`);
                    // console.log(today.getHours())
                    const time: number = today.getHours() * 3600 + today.getMinutes() * 60 + today.getSeconds();
                    if (!(today >= startDate && today <= endDate && time >= promotion[index].START_TIME && time <= promotion[index].END_TIME))
                        continue;
                    const type: string = promotion[index].PROMO_TYPE.toString();
                    console.log('b')
                    const cust = await this.customerRepository.query(`
                        select * from customer
                        where ${(promotion[index].VALIDATION_CUSTOMER_FILTER_STR && promotion[index].VALIDATION_CUSTOMER_FILTER_STR !== "") ? promotion[index].VALIDATION_CUSTOMER_FILTER_STR : 'true'}
                        and (SID = '${SID_CUSTOMER}') 
                    `)
                    // console.log(cust.length);
                    if (cust.length === 0) continue;
                    // console.log(promotion[index].VALIDATION_CUSTOMER_LOYALTY)
                    if (promotion[index].VALIDATION_CUSTOMER_LOYALTY === 1) {
                        let loyaltyCheck = false;
                        let point: number = Number(cust[0].POINT)
                        for (var j = 0; j < promotion[index].validation_customer_loyalty.length; j++) {
                            const loyalty = await this.customerLoyaltyLevelRepository.find({ where: { ID: promotion[index].validation_customer_loyalty[j].LOYALTY_SID } })
                            // console.log('abcd')
                            if (point >= loyalty[0].LOW_RANGE && point <= loyalty[0].UPPER_RANGE) {
                                loyaltyCheck = true;
                                break;
                            }
                        }
                        // console.log('d')
                        if (!loyaltyCheck) continue;
                    }

                    if ((promotion[index].VALIDATION_USE_SUBTOTAL && promotion[index].VALIDATION_SUBTOTAL <= subtotal) || !promotion[index].VALIDATION_USE_SUBTOTAL) {
                        //Check promotion discount item reward
                        if (Number(promotion[index].REWARD_MODE) === 2) {
                            // console.log('3');
                            let count: number = 0;
                            for (let i = 0; i < cartTemp.items.length; i++) {
                                for (let j = 0; j < promotion[index].reward_discount_item.length; j++)
                                    if (cartTemp.items[i].product.SID === promotion[index].reward_discount_item[j].SID_PRODUCT)
                                        count += 1
                            }
                            if (count === 0)
                                continue;
                            // console.log(4);
                            for (let i = 0; i < cartTemp.items.length; i++) {
                                for (let j = 0; j < promotion[index].reward_discount_item.length; j++)
                                    if (cartTemp.items[i].product.SID === promotion[index].reward_discount_item[j].SID_PRODUCT) {
                                        // console.log(5)
                                        cartTemp.items[i].product.PROMO_NAME = promotion[index].PROMO_NAME;
                                        cartTemp.items[i].product.DISC_VALUE = promotion[index].reward_discount_item[j].DISC_VALUE;
                                        discValue += Number(promotion[index].reward_discount_item[j].DISC_VALUE) * (Number(cartTemp.items[i].product.PRICE) + Number(cartTemp.items[i].product.TAX)) / 100;
                                    }
                            }
                        }

                        // console.log('2');
                        havePromo = true;
                        promoName = promotion[index].PROMO_NAME;
                        rewardType = promotion[index].REWARD_MODE;
                        if (Number(promotion[index].REWARD_MODE) === 0) {
                            let disc_Value = (promotion[index].REWARD_TRANSACTION) ?
                                ((Number(promotion[index].REWARD_TRANSACTION_DISC_TYPE) === 0) ? subtotal * Number(promotion[index].REWARD_TRANSACTION_DISC_VALUE) / 100 : Number(promotion[index].REWARD_TRANSACTION_DISC_VALUE))
                                : null;
                            discountTransaction.push({
                                PROMO_NAME: promoName,
                                disc_type: Number(promotion[index].REWARD_TRANSACTION_DISC_TYPE),
                                disc_Value: Number(promotion[index].REWARD_TRANSACTION_DISC_VALUE)
                            })
                        }

                        if (Number(promotion[index].REWARD_MODE) === 1) {
                            itemsReward = await this.productRepository.createQueryBuilder("product").select("")
                                .leftJoinAndSelect("product.productInformation", "productInformation")
                                .leftJoinAndSelect("product.images", "images")
                                .leftJoinAndSelect("productInformation.productPrices", "productPrices")
                                .orderBy('productPrices.CREATED_DATETIME','DESC')
                                .where('product.SID = :rsid', { rsid: promotion[index].REWARD_ITEMS_SID })
                                .getOne();
                            let productAttributeGroup = await this.productAttributeGroupRepository.createQueryBuilder("product_attribute_group")
                                .leftJoinAndSelect("product_attribute_group.productAttributeValues", "productAttributeValues")
                                .where("product_attribute_group.PRODUCT_INFORMATION_SID = :PINFO_SID", { PINFO_SID: itemsReward.SID_PRODUCT_INFORMATION })
                                .andWhere("productAttributeValues.SID_PRODUCT = :PSID", { PSID: promotion[index].REWARD_ITEMS_SID }).getOne();
                            itemReward = itemReward.concat([{ ...itemsReward, productAttributeGroup }]);
                            itemReward[0].PROMO_NAME = promotion[index].PROMO_NAME;
                        }

                    }
                    if (!promotion[index].CAN_BE_APPLIED) {
                        if (havePromo)
                            break;
                    }
                    else checkApplied = true;

                }
                subtotal = subtotal + taxPrice - discValue;
                discountTransaction = discountTransaction.sort((a, b) => b.disc_type - a.disc_type)
                const cartInfo = {
                    SID: cart.SID,
                    SID_CUSTOMER: cart.SID_CUSTOMER,
                    CREATED_DATETIME: cart.CREATED_DATETIME,
                    STATUS: cart.STATUS,
                    SUB_TOTAL: subtotal,
                    TOTAL_ITEMS: totalItems,
                    TAX_PRICE: taxPrice,
                    items: cartTemp.items,
                    discountItems,
                    discountTransaction,
                    itemReward
                }
                return { cartInfo };
            } else {
                return { cartInfo: null }
            }
        } else {
            const cart = await this.cartRepository.findOne({ where: { SESSION_ID, STATUS: 1 } });
            if (cart) {
                let items: Array<any>;
                items = cart.items;
                let subtotal: number;
                let totalItems: number;
                let taxPrice: number = 0;
                subtotal = 0;
                totalItems = 0;
                let cartTemp: any = cart;
                const getCartInfo = items.map(async (item, index) => {
                    const response = await this.getCartInfo(item, subtotal, totalItems);
                    cartTemp.items[index].product.TAX = Number(response.taxPrice) / Number(cart.items[index].QUANTITY);
                    taxPrice += response.taxPrice;
                    subtotal += response.subtotal;
                    totalItems += response.totalItems;
                });
                await Promise.all(getCartInfo);
                //Promotion
                let havePromo: boolean = false;
                let checkApplied: boolean = false;
                let promoName: string = "";
                let discValue: number = 0;
                let rewardType: number = 0;
                let itemsReward = null;
                let discountTransaction: Array<DiscountTransactionType> = [];
                let itemReward = [];
                let discountItems = [];
                for (let index: number = 0; index < promotion.length; index++) {
                    if (!promotion[index].APPLY_WITH_UNAUTHORIZED_CUSTOMER) continue;
                    if (!promotion[index].ACTIVE) continue;
                    if (promotion[index].APPLY_COUNT !== null && Number(promotion[index].APPLY_COUNT) <= Number(promotion[index].COUNT)) continue;
                    if (checkApplied && !promotion[index].CAN_BE_APPLIED) continue;
                    const today: Date = new Date();
                    const startDate: Date = new Date(`${promotion[index].START_DATE}T00:00:00`);
                    const endDate: Date = new Date(`${promotion[index].END_DATE}T23:59:59`);
                    const time: number = today.getHours() * 3600 + today.getMinutes() * 60 + today.getSeconds();
                    if (!(today >= startDate && today <= endDate && time >= promotion[index].START_TIME && time <= promotion[index].END_TIME))
                        continue;
                    const type: string = promotion[index].PROMO_TYPE.toString();

                    if ((promotion[index].VALIDATION_USE_SUBTOTAL && promotion[index].VALIDATION_SUBTOTAL <= subtotal) || !promotion[index].VALIDATION_USE_SUBTOTAL) {
                        //Check promotion discount item reward
                        if (Number(promotion[index].REWARD_MODE) === 2) {
                            // console.log('3');
                            let count: number = 0;
                            for (let i = 0; i < cartTemp.items.length; i++) {
                                for (let j = 0; j < promotion[index].reward_discount_item.length; j++)
                                    if (cartTemp.items[i].product.SID === promotion[index].reward_discount_item[j].SID_PRODUCT)
                                        count += 1
                            }
                            if (count === 0)
                                continue;
                            // console.log(4);
                            for (let i = 0; i < cartTemp.items.length; i++) {
                                for (let j = 0; j < promotion[index].reward_discount_item.length; j++)
                                    if (cartTemp.items[i].product.SID === promotion[index].reward_discount_item[j].SID_PRODUCT) {
                                        // console.log(5)
                                        cartTemp.items[i].product.PROMO_NAME = promotion[index].PROMO_NAME;
                                        cartTemp.items[i].product.DISC_VALUE = promotion[index].reward_discount_item[j].DISC_VALUE;
                                        discValue += Number(promotion[index].reward_discount_item[j].DISC_VALUE) * (Number(cartTemp.items[i].product.PRICE) + Number(cartTemp.items[i].product.TAX)) / 100;
                                    }
                            }
                        }

                        // console.log('2');
                        havePromo = true;
                        promoName = promotion[index].PROMO_NAME;
                        rewardType = promotion[index].REWARD_MODE;
                        if (Number(promotion[index].REWARD_MODE) === 0) {
                            let disc_Value = (promotion[index].REWARD_TRANSACTION) ?
                                ((Number(promotion[index].REWARD_TRANSACTION_DISC_TYPE) === 0) ? subtotal * Number(promotion[index].REWARD_TRANSACTION_DISC_VALUE) / 100 : Number(promotion[index].REWARD_TRANSACTION_DISC_VALUE))
                                : null;
                            discountTransaction.push({
                                PROMO_NAME: promoName,
                                disc_type: Number(promotion[index].REWARD_TRANSACTION_DISC_TYPE),
                                disc_Value: Number(promotion[index].REWARD_TRANSACTION_DISC_VALUE)
                            })
                        }

                        if (Number(promotion[index].REWARD_MODE) === 1) {
                            // console.log('abc');
                            itemsReward = await this.productRepository.createQueryBuilder("product").select("")
                                .leftJoinAndSelect("product.productInformation", "productInformation")
                                .leftJoinAndSelect("product.images", "images")
                                .leftJoinAndSelect("productInformation.productPrices", "productPrices")
                                .orderBy("productPrices.CREATED_DATETIME", 'DESC')
                                .where('product.SID = :rsid', { rsid: promotion[index].REWARD_ITEMS_SID })
                                .getOne();
                            let productAttributeGroup = await this.productAttributeGroupRepository.createQueryBuilder("product_attribute_group")
                                .leftJoinAndSelect("product_attribute_group.productAttributeValues", "productAttributeValues")
                                .where("product_attribute_group.PRODUCT_INFORMATION_SID = :PINFO_SID", { PINFO_SID: itemsReward.SID_PRODUCT_INFORMATION })
                                .andWhere("productAttributeValues.SID_PRODUCT = :PSID", { PSID: promotion[index].REWARD_ITEMS_SID }).getOne();
                            itemReward = itemReward.concat([{ ...itemsReward, productAttributeGroup }]);
                            itemReward[0].PROMO_NAME = promotion[index].PROMO_NAME;
                        }

                    }
                    if (!promotion[index].CAN_BE_APPLIED) {
                        if (havePromo)
                            break;
                    }
                    else checkApplied = true;

                }
                subtotal = subtotal + taxPrice - discValue;
                discountTransaction = discountTransaction.sort((a, b) => b.disc_type - a.disc_type)

                const cartInfo = {
                    SID: cart.SID,
                    SID_CUSTOMER: cart.SID_CUSTOMER,
                    CREATED_DATETIME: cart.CREATED_DATETIME,
                    STATUS: cart.STATUS,
                    SUB_TOTAL: subtotal,
                    TOTAL_ITEMS: totalItems,
                    TAX_PRICE: taxPrice,
                    items: cartTemp.items,
                    discountItems,
                    discountTransaction,
                    itemReward
                }
                return { cartInfo };
            } else {
                return { cartInfo: null };
            }
        }
    }

    async reLogginCustomerByToken(SID: string) {
        const customer = await this.customerRepository
            .createQueryBuilder('customer')
            .select('customer')
            .leftJoinAndSelect('customer.addresses', 'addresses')
            .where(`SID='${SID}'`)
            .getOne();
        if (customer) {
            let customer_info = customer;
            delete customer.HASH_PASSWORD;
            return {
                customer_info
            }
        } else {
            return {
                error: 'Cannot find any customer with this SID'
            }
        }
    }

    async addWishList(custSID: string, psid: string) {

        const product = await this.productInformationRepository.findOne({ where: { SID: psid } });
        if (product === null || product === undefined) {

            return {
                error: 'No product found.'
            }
        }
        // console.log(`custSID: ${custSID}`)
        // console.log(`psid: ${psid}`)
        const checkIfProductExisted = await this.customerWishListRepository.findOne({ where: { SID_PRODUCT: psid, SID_CUSTOMER: custSID } });
        if (checkIfProductExisted) {
            await this.customerWishListRepository.delete(checkIfProductExisted);
        } else {
            const new_wishlist = await this.customerWishListRepository.create({ SID_CUSTOMER: custSID, SID_PRODUCT: psid })
            await new_wishlist.save();
            return new_wishlist;
        }
    }

    async getWishList(custSID: string, psid: string) {
        const wishlist = await this.customerWishListRepository.findOne({ where: { SID_CUSTOMER: custSID, SID_PRODUCT: psid } })
        return wishlist;
    }

    async getWishListAll(custSID: string) {
        const wishedProducts = await this.customerWishListRepository.find({ where: { SID_CUSTOMER: custSID } });
        // let wishListProducts: Array<ProductInformationType>;
        // wishListProducts = [];
        // const getWishListProducts = wishedProducts.map(product => {
        //     wishListProducts.push(product.productInformation);
        // })
        // await Promise.all(getWishListProducts);
        return { wishlist: wishedProducts };
    }

    async deleteWithList(custSID: string, wlSid: string) {
        const withList = await this.customerWishListRepository.query(`
            DELETE FROM customer_wishlist
            WHERE SID = '${wlSid}' and SID_CUSTOMER = '${custSID}'
        `)
        return withList;
    }

    async activeAccount(SID: string) {
        try {
            const customer = await this.customerRepository
                .createQueryBuilder('customer')
                .select('customer')
                .where(`SID='${SID}'`)
                .getOne();
            if (!customer) return { error: 'Account not existed' };
            if (customer.ACTIVE === 1) return { error: 'Account already activated' };
            customer.ACTIVE = 1;
            await customer.save();
            return { message: 'Your account has been successfully actived' }
        } catch (error) {
            return { error };
        }
    }

    async getAllCustomerLoyaltyLevel() {
        try {
            const customerLoyaltyLevel = await this.customerLoyaltyLevelRepository.find();
            const customerLoyaltyRate = await this.customerLoyaltyRateRepository.findOne();
            return {
                loyaltyLevel: customerLoyaltyLevel,
                loyaltyRate: customerLoyaltyRate
            };
        }
        catch (error) {
        }
    }

    async updateCustomerLoyaltyRate(rate: number) {
        const response = await this.customerLoyaltyRateRepository.createQueryBuilder("customer_loyalty_rate").delete().execute();
        const newInsert = await this.customerLoyaltyRateRepository.createQueryBuilder("customer_loyalty_rate").insert().values({ RATE: rate }).execute();
        return newInsert;
    }

    async updateCustomerLoyaltyLevel(data: CustomerLoyaltyLevelArrayDTO) {
        const response = await this.customerLoyaltyLevelRepository.createQueryBuilder("customer_loyalty_level").delete().execute();
        const newInsert = await this.customerLoyaltyLevelRepository.createQueryBuilder("customer_loyalty_level").insert().values(data.data_lst).execute();
        return newInsert;
    }

    async getCustomerColumns() {
        const response = await this.customerRepository.query('show columns from customer');
        return response;
    }

    async checkCustomerPoint(SID_CUSTOMER: string) {
        const loyaltyLevel = await this.customerLoyaltyLevelRepository.find();
        const customer = await this.customerRepository
            .createQueryBuilder('customer')
            .select('customer')
            .where(`SID='${SID_CUSTOMER}'`)
            .getOne();
        const loyaltyRate = await this.customerLoyaltyRateRepository.findOne();
        let cur_point: number = Number(customer.POINT);
        let ind: number = -1;
        for (let index = 0; index < loyaltyLevel.length; index++)
            if (cur_point >= loyaltyLevel[index].LOW_RANGE && cur_point <= loyaltyLevel[index].UPPER_RANGE) {
                ind = index;
                break;
            }
        if (ind === -1)
            return { error: "You cannot use exchange point." }
        console.log(loyaltyLevel)
        return {
            REDEEM_MULTIPLIER: loyaltyLevel[ind].REDEEM_MULTIPLIER,
            CURRENT_POINT: cur_point,
            LOYALTY_RATE: loyaltyRate.RATE
        }
    }

    async getCustomerPoint(SID_CUSTOMER: string) {
        const customer = await this.customerRepository
            .createQueryBuilder('customer')
            .select('customer')
            .where(`SID='${SID_CUSTOMER}'`)
            .getOne();
        const order = await this.orderRepository.find({
            select: ["ID", "POINT", "CREATED_DATETIME", "TRANSACTION_TOTAL_WITH_TAX", "REDEEM_POINT"],
            where: { SID_CUSTOMER, POINT: Not(0) },
            order: {
                CREATED_DATETIME: "DESC"
            }
        });
        const customerLoyaltyLevel = await this.customerLoyaltyLevelRepository.findOne({
            where: {
                LOW_RANGE: LessThanOrEqual(customer.POINT),
                UPPER_RANGE: MoreThanOrEqual(customer.POINT)
            }
        });
        return {
            order,
            customerLoyaltyLevel,
            POINT: customer.POINT
        }
    }

    async insertCoupon(body: CouponInsertDTO) {
        try {
            if (body.FILTER_STR === "")
                return {
                    status: 'error',
                    msg: 'Filter String must not be empty'
                }
            const customer_list = await this.customerRepository.query(`
                select * from customer
                where ${body.FILTER_STR}
            `)
            //Insert
            const newCoupon = await this.couponRepository.create({
                ...body,
                customer_coupon: customer_list.map((ele: any) => {
                    return {
                        SID_CUSTOMER: ele.SID
                    };
                })
            })
            console.log(newCoupon);
            await newCoupon.save();
            // console.log('2')
            return {
                status: "success"
            }
        }
        catch (ex) {
            return {
                status: 'error',
                msg: ex.message
            };
        }

    }

    async getCouponWithType(type: string) {
        let today = moment(new Date()).format('YYYY-MM-DD')
        const response = await this.couponRepository.createQueryBuilder("coupon").select();
        if (type === '0')
            response.where(':date >= START_DATE', { date: today })
                .andWhere(':date <= END_DATE', { date: today })
        else if (type === '1')
            response.where(':date < START_DATE', { date: today })
        else if (type === '2')
            response.where(':date > END_DATE', { date: today })
        // console.log(response.getSql())
        const list_coupon = await response.getMany()
        return list_coupon
    }

    async updateCouponWithSID(sid: string, ACTIVE: boolean) {
        const coupon = await this.couponRepository.createQueryBuilder("coupon").update().set({ ACTIVE: ACTIVE }).where("SID = :sid", { sid }).execute()
        return "success";
    }

    async getCouponListWithSID(SID: string) {
        let today = moment(new Date());
        let date = today.format("YYYY-MM-DD");
        let time = today.hours() * 3600 + today.minutes() * 60 + today.seconds();
        const res_list = await this.customerCouponRepository.
            createQueryBuilder("customer_coupon")
            .select("customer_coupon")
            .leftJoinAndSelect("customer_coupon.coupon", "coupon")
            .where("customer_coupon.SID_CUSTOMER = :SID", { SID })
            .andWhere(":date >= coupon.START_DATE", { date })
            .andWhere(":date <= coupon.END_DATE", { date })
            .andWhere(":time >= coupon.START_TIME", { time })
            .andWhere(":time <= coupon.END_TIME", { time })
            .getMany()
        return res_list;
    }

    async createCustomerAddress(SID_CUSTOMER: string, createCustomerAddressDTO: CreateCustomerAddressDTO) {
        const {
            CITY,
            COUNTRY,
            DISTRICT,
            IS_DEFAULT_ADDRESS,
            PHONE,
            STREET_ADDRESS,
            FIRST_NAME,
            LAST_NAME
        } = createCustomerAddressDTO;
        try {
            if (!IS_DEFAULT_ADDRESS) {
                const newCustomerAddress = this.customerAddressRepository.create({
                    CITY,
                    COUNTRY,
                    DISTRICT,
                    IS_DEFAULT_ADDRESS: 0,
                    PHONE,
                    STREET_ADDRESS,
                    SID_CUSTOMER,
                    FIRST_NAME,
                    LAST_NAME
                });
                await newCustomerAddress.save();
                return { newCustomerAddress };
            } else {
                const previousDefaultAddress = await this.customerAddressRepository.findOne({
                    SID_CUSTOMER,
                    IS_DEFAULT_ADDRESS: 1
                });
                if (previousDefaultAddress) {
                    previousDefaultAddress.IS_DEFAULT_ADDRESS = 0;
                    await previousDefaultAddress.save();
                }
                const newCustomerAddress = this.customerAddressRepository.create({
                    CITY,
                    COUNTRY,
                    DISTRICT,
                    IS_DEFAULT_ADDRESS: 1,
                    PHONE,
                    STREET_ADDRESS,
                    SID_CUSTOMER,
                    FIRST_NAME,
                    LAST_NAME
                });
                await newCustomerAddress.save();
                return { newCustomerAddress };
            }
        } catch (error) {
            console.log(error);
            return { error };
        }
    }

    async getAddressesByCustomer(SID_CUSTOMER: string) {
        const addresses = await this.customerAddressRepository.find({ where: { SID_CUSTOMER } });
        return { addresses };
    }

    async getCustomerAddressDetails(ID: number) {
        const customerAddress = await this.customerAddressRepository.findOne({ where: { ID } });
        return { customerAddress };
    }
}

export default CustomerService;