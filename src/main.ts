import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';
// import {WsAdapter} from '@nestjs/platform-ws'
import PrismService from './modules/admin/services/prism.service';
import { Repository } from 'typeorm';
import PrismCrawlHistory from './modules/admin/entity/prism_crawl_history.entity';
import axios from 'axios';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.useWebSocketAdapter(new WsAdapter(app));
  const config = new DocumentBuilder()
    .setTitle('LBC Ecommerce')
    .setDescription('This is some bullshit swagger document')
    .setVersion('1.0')
    .build();
  const options: SwaggerDocumentOptions = {
    deepScanRoutes: true
  };
  const document = SwaggerModule.createDocument(app, config, options);
  SwaggerModule.setup('api', app, document);
  app.use(cors({
    credentials: true,
    exposedHeaders: 'Content-Disposition',
    origin: true
  }));
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(5035);

  // setInterval(async () => {
    // await axios({
    //   url: 'http://localhost:5035/prism/stores',
    //   method: 'GET',
    //   withCredentials: true
    // })
    // await axios({
    //   url: 'http://localhost:5035/prism/categories',
    //   method: 'GET',
    //   withCredentials: true
    // })
    // await axios({
    //   url: 'http://localhost:5035/prism/brands',
    //   method: 'GET',
    //   withCredentials: true
    // })
    // await axios({
    //   url: 'http://localhost:5035/prism/product-informations',
    //   method: 'GET',
    //   withCredentials: true,
    // });
  //   console.log('Finished');
  // }, 1000 * 20);

  // await axios({
  //   url: 'http://localhost:5035/prism/product-informations',
  //   method: 'GET',
  //   withCredentials: true,
  // });
  // console.log('Finished');

  // await axios({
  //   url: 'http://localhost:5035/prism/stores',
  //   method: 'GET',
  //   withCredentials: true
  // })
  // console.log('finished');

  // await axios({
  //   url: 'http://localhost:5035/prism/categories',
  //   method: 'GET',
  //   withCredentials: true
  // })
  // console.log('Finished');
}
bootstrap();
