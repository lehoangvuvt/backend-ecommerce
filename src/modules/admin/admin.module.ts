import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import Category from '../category/category.entity';
import Customer from '../customer/customer.entity';
import Order from '../order/order.entity';
import ProductInformation from '../product/product_information.entity';
import AdminController from './admin.controller';
import AuthController from './controller/auth.controller';
import AdminService from './admin.service';
import Roles from './entity/role.entity';
import UserRole from './entity/user.role.entity';
import Users from './entity/users.entity';
import PermissionController from './controller/permission.controller';
import Permissions from './entity/permission.entity';
import Resources from './entity/resource.entity';
import AuthService from './services/auth.service';
import ReportController from './controller/report.controller';
import ReportService from './services/report.service';
import PrismController from './controller/prism.controller';
import PrismService from './services/prism.service';
import PrismCrawlHistory from './entity/prism_crawl_history.entity';
import Store from '../store/store.entity';
import ProductBrand from '../product/product_brand.entity';
import MailSetting from './entity/mail_setting.entity';
import MailTemplate from './entity/mail_template.entity';
import SettingController from './controller/setting.controller';
import SettingService from './services/setting.service';
import SenderMailConfig from './entity/sender_mail_config.entity';
import Coupon from '../customer/coupon.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductInformation,
      ProductBrand,
      Customer,
      Order,
      Category,
      Users,
      Roles,
      UserRole,
      Permissions,
      Resources,
      PrismCrawlHistory,
      Coupon,
      Store,
      MailSetting,
      MailTemplate,
      SenderMailConfig
    ]),
    JwtModule.register({}),
  ],
  controllers: [
    AdminController,
    AuthController,
    PermissionController,
    ReportController,
    PrismController,
    SettingController,
  ],
  providers: [
    AdminService,
    AuthService,
    ReportService,
    PrismService,
    SettingService,
  ],
  exports: [
    AuthService,
    PrismService
  ],
})
export class AdminModule { }
