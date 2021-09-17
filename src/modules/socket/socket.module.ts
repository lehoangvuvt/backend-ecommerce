import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import Order from "../order/order.entity";
import { OrdersGateway } from "./gateways/orders.gateway";
import { PrismGateWay } from "./gateways/prism.gateway";

@Module({
    imports: [TypeOrmModule.forFeature([Order])],
    controllers: [],
    providers: [OrdersGateway],
})

export class SocketModule { }