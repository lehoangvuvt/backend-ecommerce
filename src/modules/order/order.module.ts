import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import ProductInformation from "../product/product_information.entity";
import Cart from "../customer/cart.entity";
import Product from "../product/product.entity";
import OrderController from "./order.controller";
import Order from "./order.entity";
import OrderService from "./order.service";
import OrderItem from "./order_item.entity";
import ProductAttribute from "../product/product_attribute.entity";
import ProductAttributeValue from "../product/product_attribute_value.entity";
import ProductAttributeGroup from "../product/product_attribute_group.entity";
import OrderHistory from "./order_history.entity";
import CustomerLoyaltyRate from "../customer/customer_loyalty_rate.entity";
import Customer from '../customer/customer.entity'
import CustomerLoyaltyLevel from "../customer/customer_loyalty_level.entity";
import Promotion from '../promotion/promotion.entity'
import { AdminModule } from "../admin/admin.module";
import Store from "../store/store.entity";
import ShippingMethod from "../shipping/entity/shipping_method.entity";
import Users from "../admin/entity/users.entity";
import StoreEcom from "../store/store_ecom.entity";

@Module({
    imports: [TypeOrmModule.forFeature([
        Order,
        OrderItem,
        Product,
        ProductInformation,
        Cart,
        ProductAttribute,
        ProductAttributeValue,
        ProductAttributeGroup,
        OrderHistory,
        CustomerLoyaltyRate,
        Customer,
        CustomerLoyaltyLevel,
        Promotion,
        Store,
        ShippingMethod,
        Users,
        StoreEcom
    ]),
    JwtModule.register({}), AdminModule],
    controllers: [OrderController],
    providers: [OrderService],
})

export class OrderModule { }