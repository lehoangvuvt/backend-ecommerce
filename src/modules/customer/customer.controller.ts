import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { tokenConfig } from '../../config/token.config';
import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import * as nodemailer from 'nodemailer';
import LoginDTO from './dto/login.dto';
import CustomerService from './customer.service';
import RegisterCustomerDTO from './dto/register-customer.dto';
import { getNodeMailerConfig } from '../../config/nodemailer.config';
import AddToCartDTO from './dto/add-to-cart.dto';
import { DefineGuard } from '../../auth/define.guard';
import { TokenGuard } from '../../auth/token.guard';
import DiminishFromCartDTO from './dto/diminish-from-cart.dto';
import RemoveFromCartDTO from './dto/remove-from-cart.dto';
import { WishList } from './dto/wishlist.dto';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import Customer from './customer.entity';
import { CustomerLoyaltyRateDTO } from './dto/customer_loyalty_rate.dto';
import { CustomerLoyaltyLevelDTO, CustomerLoyaltyLevelArrayDTO } from './dto/customer_loyalty_level.dto';
import { CheckExchangePointDTO } from './dto/check_exchange_point.dto'
import CouponInsertDTO from './dto/coupon_insert.dto';
import UpdateCoupon from './dto/update_coupon.dto'
import axios from 'axios';
import { MailSettingType } from '../../types/types';
import { Any } from 'typeorm';
import CreateCustomerAddressDTO from './dto/create-customer-address.dto';

@Controller('customers')
export class CustomerController {
    constructor(
        private readonly service: CustomerService,
        private jwtService: JwtService,
    ) { }

    @Post('/login')
    @ApiBody({ type: [LoginDTO] })
    @ApiResponse({ type: Customer })
    async login(
        @Body() loginDTO: LoginDTO,
        @Res() res: Response
    ) {
        const response = await this.service.login(loginDTO);
        if (response.error) return res.json({ message: response.error });
        const acesss_token = await this.jwtService.signAsync({ SID: response.customer_info.SID }, { secret: tokenConfig.accesss_token_secret_key });
        const refresh_token = await this.jwtService.signAsync({ SID: response.customer_info.SID }, { secret: tokenConfig.refresh_token_secret_key });
        res.cookie('access_token', acesss_token, { httpOnly: true, expires: new Date(Date.now() + tokenConfig.access_token_duration * 1000) });
        res.cookie('refresh_token', refresh_token, { httpOnly: true, expires: new Date(Date.now() + tokenConfig.refresh_token_duration * 1000) });
        return res.status(200).json({
            customer_info: response.customer_info
        })
    }

    @Post('/register')
    @ApiBody({ type: RegisterCustomerDTO })
    async register(
        @Body() registerCustomerDTO: RegisterCustomerDTO,
        @Res() res: Response
    ) {
        const response = await this.service.register(registerCustomerDTO);
        if (response.error) return res.json({ error: { message: response.error } });
        const registeredEmail = response.customer.EMAIL;
        const SID = response.customer.SID;
        const active_token = await this.jwtService.signAsync({ SID }, { secret: tokenConfig.active_account_token_secret_key, expiresIn: tokenConfig.active_account_token_duration });
        const nodeMailerConfig = await getNodeMailerConfig();
        const sender = nodemailer.createTransport({
            service: nodeMailerConfig.service,
            auth: {
                user: nodeMailerConfig.email,
                pass: nodeMailerConfig.password
            }
        });
        const ACTIVE_LINK = `http://localhost:3002/active-account/${active_token}`;
        const getTemplatesResponse = await axios({
            url: `http://localhost:5035/setting/mail-settings/details/1`,
            withCredentials: true,
            method: 'GET',
        })
        let dataFields: Array<{
            fieldName: string,
            value: any,
        }> = [];
        dataFields.push({
            fieldName: 'ACTIVE_LINK',
            value: ACTIVE_LINK,
        });
        for (let key in response.customer) {
            dataFields.push({
                fieldName: key,
                value: response.customer[key]
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
        const mailOptions = {
            from: nodeMailerConfig.email,
            to: registeredEmail,
            subject: MAIL_SUBJECT,
            html: MAIL_CONTENTS,
        };
        sender.sendMail(mailOptions, (error, info) => {
            if (error) return res.json({ error: { message: error } });
            return res.json({
                success: 'Email sent: ' + info.response
            });
        })
    }

    @Get('/refresh-token')
    async refreshToken(
        @Req() req: Request,
        @Res() res: Response
    ) {
        try {
            const decoded = await this.jwtService.verifyAsync(req.cookies.refresh_token, { secret: tokenConfig.refresh_token_secret_key });
            if (!decoded) throw new UnauthorizedException();
            const SID = decoded.SID;
            const access_token = await this.jwtService.signAsync({ SID }, { secret: tokenConfig.accesss_token_secret_key, expiresIn: tokenConfig.access_token_duration });
            res.cookie('access_token', access_token, { httpOnly: true });
            return res.json({
                message: 'refresh token success'
            });
        } catch (error) {
            console.log(error);
            throw new UnauthorizedException();
        }
    }

    @Get('/forgot-password/:email')
    async forgotPassword(
        @Param('email') EMAIL: string,
        @Res() res: Response,
    ) {
        const response = await this.service.forgotPassword(EMAIL);
        if (response.error) return res.json({ error: response.error });
        const nodeMailerConfig = await getNodeMailerConfig();
        const sender = nodemailer.createTransport({
            service: nodeMailerConfig.service,
            auth: {
                user: nodeMailerConfig.email,
                pass: nodeMailerConfig.password
            }
        });
        const mailOptions = {
            from: nodeMailerConfig.email,
            to: EMAIL,
            subject: 'Reset password link',
            text: `Go to this link to reset your password: <a>${response.recoveryId}`
        };
        sender.sendMail(mailOptions, (error, info) => {
            if (error) return res.json({ error: { message: error } });
            return res.json({
                success: 'Email sent: ' + info.response
            });
        })
    }

    @Put('/reset-password/:id')
    async resetPassword(
        @Body('NEW_PASSWORD') NEW_PASSWORD: string,
        @Param('id') RECOVERY_ID: string,
        @Res() res: Response,
    ) {
        const response = await this.service.resetPassword(RECOVERY_ID, NEW_PASSWORD);
        if (response.error) return res.json({ error: { message: response.error } });
        return res.json({
            success: response.message,
        })
    }

    @Post('/add-to-cart')
    @UseGuards(DefineGuard)
    @ApiBody({ type: AddToCartDTO })
    async addToCart(
        @Body() addToCartDTO: AddToCartDTO,
        @Req() req: any,
        @Res() res: Response,
    ) {
        if (req.customer && req.customer.SID) {
            const response = await this.service.addToCart(req.customer.SID, null, addToCartDTO);
            return res.json({
                CART: response,
            })
        } else {
            if (req.cookies['session_id']) {
                const response = await this.service.addToCart(null, req.cookies['session_id'], addToCartDTO);
                return res.json({
                    CART: response,
                })
            } else {
                const SESSION_ID = uuid();
                const date = new Date();
                date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
                res.cookie('session_id', SESSION_ID, { httpOnly: true, expires: date });
                const response = await this.service.addToCart(null, SESSION_ID, addToCartDTO);
                return res.json({
                    CART: response,
                })
            }
        }
    }

    @Post('/diminish-from-cart')
    @UseGuards(DefineGuard)
    @ApiBody({ type: DiminishFromCartDTO })
    async diminishFromCart(
        @Body() diminishFromCartDTO: DiminishFromCartDTO,
        @Req() req: any,
        @Res() res: Response,
    ) {
        if (req.customer && req.customer.SID) {
            const response = await this.service.diminishFromCart(req.customer.SID, null, diminishFromCartDTO);
            if (!response.error) {
                return res.json({
                    CART: response.cartInfo,
                })
            } else {
                return res.json({
                    error: response.error,
                })
            }
        } else {
            const SESSION_ID = req.cookies['session_id'];
            const response = await this.service.diminishFromCart(null, SESSION_ID, diminishFromCartDTO);
            if (!response.error) {
                return res.json({
                    CART: response.cartInfo,
                })
            } else {
                return res.json({
                    error: response.error,
                })
            }
        }
    }

    @Post('/remove-from-cart')
    @UseGuards(DefineGuard)
    @ApiBody({ type: RemoveFromCartDTO })
    async removeFromCart(
        @Body() removeFromCartDTO: RemoveFromCartDTO,
        @Req() req: any,
        @Res() res: Response,
    ) {
        if (req.customer && req.customer.SID) {
            const response = await this.service.removeProductFromCart(req.customer.SID, null, removeFromCartDTO);
            if (!response.error) {
                return res.json({
                    CART: response.cartInfo,
                })
            } else {
                return res.json({
                    error: response.error,
                })
            }
        } else {
            const SESSION_ID = req.cookies['session_id'];
            const response = await this.service.removeProductFromCart(null, SESSION_ID, removeFromCartDTO);
            if (!response.error) {
                return res.json({
                    CART: response.cartInfo,
                })
            } else {
                return res.json({
                    error: response.error,
                })
            }
        }
    }

    @Get('/cart')
    @UseGuards(DefineGuard)
    async getCustomerCartInfo(
        @Res() res: Response,
        @Req() req: any,
    ) {
        if (req.customer && req.customer.SID) {
            const response = await this.service.getCustomerCartInfo(req.customer.SID, undefined);
            return res.json({
                cart: response.cartInfo
            });
        } else if (req.cookies['session_id']) {
            const SESSION_ID = req.cookies['session_id'];
            const response = await this.service.getCustomerCartInfo(null, SESSION_ID);
            return res.json({
                cart: response.cartInfo
            });
        } else {
            return res.json({
                error: 'Cannot find any cart info'
            })
        }

    }

    @Get('/check')
    @UseGuards(TokenGuard)
    async checkIfUserLoggedIn(
        @Res() res: Response,
        @Req() req: any,
    ) {
        const CUSTOMER_SID = req.customer.SID;
        const response = await this.service.reLogginCustomerByToken(CUSTOMER_SID);
        if (response.error) return UnauthorizedException;
        return res.status(200).json({
            customer_info: response.customer_info,
        })
    }

    @Get('/logout')
    @UseGuards(TokenGuard)
    async logout(
        @Res() res: Response,
        @Req() req: Request,
    ) {
        res.clearCookie('access_token', { httpOnly: true, path: '/' });
        res.clearCookie('refresh_token', { httpOnly: true, path: '/' });
        return res.status(200).json({
            message: 'Log out successfully'
        })
    }

    @Post('/wishlist')
    @UseGuards(DefineGuard)
    async addWishList(
        @Res() res: Response,
        @Req() req: any,
        @Body() body: WishList
    ) {
        // console.log(req);
        if (req.customer && req.customer.SID) {
            const response = await this.service.addWishList(req.customer.SID, body.PRODUCT_SID);
            return res.status(200).json(response);
        }
        else
            return res.status(200).json({
                error: 'The customer token ran into the problem'
            });
    }

    @Get('/wishlist')
    @UseGuards(DefineGuard)
    async getWishList(
        @Req() req: any,
        @Res() res: Response,
        @Query('psid') psid: string
    ) {
        if (psid === null || psid === "" || psid === undefined)
            return res.json(200).json({
                error: 'Product SID is null'
            })
        if (req.customer && req.customer.SID) {
            const response = await this.service.getWishList(req.customer.SID, psid);
            return res.status(200).json(response);
        }
        else
            return res.status(200).json({
                error: 'The customer token ran into the problem'
            });
    }

    @Get('/wishlist/all')
    @UseGuards(DefineGuard)
    async getWishListAll(
        @Req() req: any,
        @Res() res: Response
    ) {
        if (req.customer && req.customer.SID) {
            const response = await this.service.getWishListAll(req.customer.SID);
            return res.status(200).json(response);
        }
        else {
            return res.status(200).json({
                error: 'The customer token ran into the problem'
            })
        }
    }

    @Get('/wishlist/count')
    @UseGuards(DefineGuard)
    async getWishListNumber(
        @Req() req: any,
        @Res() res: Response
    ) {
        if (req.customer && req.customer.SID) {
            const response = await this.service.getWishListAll(req.customer.SID);
            return res.status(200).json({
                count: response.wishlist.length
            })
        }
        else {
            return res.status(200).json({
                count: 0
            })
        }
    }

    @Delete('/wishlist')
    @UseGuards(DefineGuard)
    async deleteWithList(
        @Req() req: any,
        @Res() res: Response,
        @Query('wlsid') wlsid: string
    ) {
        if (wlsid === null || wlsid === "" || wlsid === undefined)
            return res.json(200).json({
                error: 'WishList SID is null'
            })
        if (req.customer && req.customer.SID) {
            const response = await this.service.deleteWithList(req.customer.SID, wlsid);
            return res.status(200).json(response);
        }
        else
            return res.status(200).json({
                error: 'The customer token ran into the problem'
            });
    }

    @Get('/active-account/:token')
    async activeAccount(
        @Param('token') token: string,
        @Res() res: Response,
    ) {
        try {
            const decoded = await this.jwtService.verifyAsync(token, { secret: tokenConfig.active_account_token_secret_key })
            console.log(decoded);
            if (!decoded) return res.json({ error: 'Token is expired or invalid' });
            const SID = decoded.SID;
            const response = await this.service.activeAccount(SID);
            if (response.error) return res.json({ error: { message: response.error } });
            return res.json({
                success: response.message,
            })
        } catch (error) {
            return res.json({ error: { message: error.message } });
        }
    }

    @Get()
    async getAllCustomers(
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const query = req.query;
        const response = await this.service.getAllCustomers(query);
        return res.json({
            customers: response.customers,
            totalRecords: response.totalRecords
        });
    }

    @Get('/loyalty')
    async getCustomerLoyaltyLevel(
        @Req() req: any,
        @Res() res: Response
    ) {
        const response = await this.service.getAllCustomerLoyaltyLevel();
        return res.status(200).json(response);
    }

    @Post('/loyalty/rate')
    async postLoyaltyRate(
        @Req() req: any,
        @Res() res: Response,
        @Body() body: CustomerLoyaltyRateDTO
    ) {
        const response = await this.service.updateCustomerLoyaltyRate(body.RATE);
        if (response.raw.affectedRows >= 1)
            return res.status(200).json();
        return res.status(500);
    }

    @Post('/loyalty/level')
    async postLoyaltyLevel(
        @Req() req: any,
        @Res() res: Response,
        @Body() body: CustomerLoyaltyLevelArrayDTO
    ) {
        let check: boolean = true;
        for (let index = 0; index < body.data_lst.length - 1; index++)
            if (body.data_lst[index + 1].LOW_RANGE - body.data_lst[index].UPPER_RANGE !== 1) {
                check = false;
                break;
            }
        // console.log(check)
        if (!check)
            return res.status(400).json({
                messages: ["The LOW_RANGE in next element must be greater 1 than THE UPPER_RANGE in current element."],
                error: "Bad Request"
            })
        const response = await this.service.updateCustomerLoyaltyLevel(body);
        if (response.raw.affectedRows === body.data_lst.length)
            return res.status(200).json();
        return res.status(500);
    }

    @Post('/loyalty/exchange-point')
    @UseGuards(DefineGuard)
    async checkExchangePoint(
        @Req() req: any,
        @Res() res: Response,
    ) {
        if (req.customer && req.customer.SID) {
            const response = await this.service.checkCustomerPoint(req.customer.SID)
            return res.status(200).json(response);
        }
        else
            return res.status(200).json({
                error: 'Logging in session is expired'
            })
    }

    @Get('/get/point')
    @UseGuards(DefineGuard)
    async getCustomerPoint(
        @Req() req: any,
        @Res() res: Response
    ) {
        if (req.customer && req.customer.SID) {
            const response = await this.service.getCustomerPoint(req.customer.SID);
            return res.status(200).json(response);
        }
        return res.status(500);
    }

    @Get('/columns-info')
    async getColumnInfoCustomer(
        @Req() req: any,
        @Res() res: Response
    ) {
        const response = await this.service.getCustomerColumns();
        return res.status(200).json(response);
    }

    @Get('/viewHist')
    async addviewHist(

        @Query('CUST_SID') CUST_SID: String,
        @Query('TSID') PRODUCT_SID: string,
        @Res() res: Response,
    ) {

        const response = await this.service.putViewHist(CUST_SID, PRODUCT_SID);
        return res.json({
            details: response
        })

    }

    @Post('/coupon')
    async insertCoupon(
        @Req() req: any,
        @Res() res: Response,
        @Body() body: CouponInsertDTO
    ) {
        const response = await this.service.insertCoupon(body);
        if (response.status === 'success')
            return res.status(200).json({});
        else return res.status(500).json({
            error: response.msg
        })
    }

    @Get('/coupon/:type')
    async getCouponWithType(
        @Req() req: any,
        @Res() res: Response,
        @Param('type') type: string
    ) {
        const response = await this.service.getCouponWithType(type)
        return res.status(200).json(response);
    }

    @Get('/coupon')
    @UseGuards(DefineGuard)
    async getCouponListWithCustSID(
        @Res() res: Response,
        @Req() req: any,
    ) {
        // console.log(req.customer.SID);
        if (req.customer && req.customer.SID) {
            const response = await this.service.getCouponListWithSID(req.customer.SID);
            return res.status(200).json(response);
        }
        else res.status(403).json();
    }

    @Put('/coupon/:SID')
    async updateCouponWithSID(
        @Req() req: any,
        @Res() res: Response,
        @Param('SID') sid: string,
        @Body() body: UpdateCoupon
    ) {
        const response = await this.service.updateCouponWithSID(sid, body.ACTIVE);
        return res.status(200).json();
    }

    @Post('/customer-address/create')
    @UseGuards(DefineGuard)
    async createCustomerAddress(
        @Req() req: any,
        @Res() res: Response,
        @Body() createCustomerAddressDTO: CreateCustomerAddressDTO,
    ) {
        if (req.customer && req.customer.SID) {
            const response = await this.service.createCustomerAddress(req.customer.SID, createCustomerAddressDTO);
            if (response.error) return res.json({ error: response.error });
            return res.status(200).json({
                newCustomerAddress: response.newCustomerAddress
            });
        } else {
            res.status(200).json({
                error: 'The customer ID is forbidden',
            });
        }
    }

    @Get('/customer-address')
    @UseGuards(DefineGuard)
    async getAddressesByCustomer(
        @Req() req: any,
        @Res() res: Response,
    ) {
        if (req.customer && req.customer.SID) {
            const response = await this.service.getAddressesByCustomer(req.customer.SID);
            return res.status(200).json({
                addresses: response.addresses
            });
        } else {
            res.status(200).json({
                error: 'The customer ID is forbidden',
            });
        }
    }

    @Get('/customer-address/:ID')
    async getCustomerAddressDetails(
        @Param("ID") ID: number,
        @Res() res: Response,
    ) {
        const response = await this.service.getCustomerAddressDetails(ID);
        return res.json({ customerAddress: response.customerAddress });
    }
}
