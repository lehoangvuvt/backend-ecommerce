import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import OrderItem from "../order/order_item.entity";
import Order from "../order/order.entity";
import Product from "../product/product.entity";
import Cart from "./cart.entity";
import CartItem from "./cart_item.entity";
import { CustomerController } from "./customer.controller";
import Customer from "./customer.entity";
import CustomerService from "./customer.service";
import CustomerWishlist from "./customer_wishlist.entity";
import RecoveryPassword from "./recovery_password.entity";
import CustomerAddress from "./customer_address.entity";
import ProductInformation from "../product/product_information.entity";
import ProductAttributeGroup from "../product/product_attribute_group.entity";
import ProductAttributeValue from "../product/product_attribute_value.entity";
import Promotion from "../../modules/promotion/promotion.entity";
import CustomerLoyaltyLevel from "./customer_loyalty_level.entity";
import CustomerLoyaltyRate from "./customer_loyalty_rate.entity";
import CustomerCoupon from './customer_coupon.entity';
import Coupon from './coupon.entity';

@Module({
    imports: [TypeOrmModule.forFeature([
        Customer,
        CustomerAddress,
        RecoveryPassword,
        Cart,
        CartItem,
        Product,
        CustomerWishlist,
        Order,
        OrderItem,
        ProductInformation,
        ProductAttributeGroup,
        ProductAttributeValue,
        Promotion,
        CustomerLoyaltyLevel,
        CustomerLoyaltyRate,
        CustomerCoupon,
        Coupon
    ]),
    JwtModule.register({ })],
    controllers: [CustomerController],
    providers: [
        CustomerService,
    ],
})

export class CustomerModule { }