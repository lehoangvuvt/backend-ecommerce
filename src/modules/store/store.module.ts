import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import StoreController from "./store.controller";
import Store from "./store.entity";
import StoreService from "./store.service";
import StoreEcom from "./store_ecom.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Store, StoreEcom]), JwtModule.register({})],
    controllers: [StoreController],
    providers: [StoreService],
})

export class StoreModule { }