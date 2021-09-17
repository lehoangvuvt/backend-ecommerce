import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryModule } from './modules/category/category.module';
import { CustomerModule } from './modules/customer/customer.module';
import { OrderModule } from './modules/order/order.module';
import { ProductModule } from './modules/product/product.module';
import { StoreModule } from './modules/store/store.module';
import { PromotionModule } from './modules/promotion/promotion.module';
import upload from './middlewares/upload.middleware';
import { AdminModule } from './modules/admin/admin.module';
import { PermissionMiddleware } from './middlewares/permission.middleware';
import { JwtModule } from '@nestjs/jwt';
import { SocketModule } from './modules/socket/socket.module';
import { PaymentModule } from './modules/payment/module/payment.module';
import { ShippingModule } from './modules/shipping/module/shipping.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    CustomerModule,
    ProductModule,
    CategoryModule,
    OrderModule,
    StoreModule,
    PromotionModule,
    AdminModule,
    SocketModule,
    PaymentModule,
    ShippingModule,
    JwtModule.register({ }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(upload.array('files', 12))
      .forRoutes({ path: '/products/add-images', method: RequestMethod.POST }, { path: '/promotion/add-images', method: RequestMethod.POST });
    consumer
      .apply(PermissionMiddleware)
      .exclude({ path: '/auth/login', method: RequestMethod.POST })
      .exclude({ path: '/auth/logout', method: RequestMethod.POST })
      .forRoutes({
        // path: '*',
        path: '/permissions',
        method: RequestMethod.ALL,
      });
  }
}
