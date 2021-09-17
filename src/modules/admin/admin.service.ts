import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import ProductInformation from '../product/product_information.entity';
import Category from '../category/category.entity';
import Customer from '../customer/customer.entity';
import Order from '../order/order.entity';
import { Between, getManager, LessThan, MoreThan, Repository } from 'typeorm';
import { OrderType } from '../../types/types';
import { getCustomerSegments, checkIfHighSpender, checkIfIdle, checkIfOneTimer } from '../customer/utils/customers.util';

@Injectable()
export default class AdminService {
    constructor(
        @InjectRepository(ProductInformation)
        private productInformationRepository: Repository<ProductInformation>,
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
        @InjectRepository(Order) private orderRepository: Repository<Order>,
        @InjectRepository(Customer)
        private customerRepository: Repository<Customer>,
    ) { }

    async globalSearch(query: any) {
        const { q } = query;
        const firstWord = q.split(' ')[0];
        const products = await this.productInformationRepository
            .createQueryBuilder('product_information')
            .select('product_information')
            .leftJoinAndSelect(
                'product_information.productAttributeGroups',
                'productAttributeGroups',
            )
            .leftJoinAndSelect(
                'productAttributeGroups.productAttributeValues',
                'productAttributeValues',
            )
            .leftJoinAndSelect(
                'productAttributeValues.productAttribute',
                'productAttribute',
            )
            .leftJoinAndSelect(
                'product_information.categoryConnections',
                'categoryConnections',
            )
            .leftJoinAndSelect('categoryConnections.category', 'category')
            .leftJoinAndSelect('product_information.products', 'products')
            .leftJoinAndSelect('product_information.productPrices', 'productPrices')
            .leftJoinAndSelect('product_information.productBrand', 'productBrand')
            .leftJoinAndSelect('products.images', 'images')
            .where(
                `MATCH(PRODUCT_NAME) AGAINST('+${firstWord}* ${q}' in boolean mode)`,
            )
            .orWhere(`MATCH(PRODUCT_NAME) AGAINST('${q}')`)
            .take(5)
            .getMany();
        const customers = await this.customerRepository
            .createQueryBuilder('customer')
            .select('customer')
            .leftJoinAndSelect('customer.addresses', 'addresses')
            .where(`EMAIL Like '%${q}%'`)
            .take(5)
            .getMany();
        return {
            products,
            customers,
        };
    }

    async getCustomersReport(query: any) {
        const { fromDate, toDate } = query;
        let customersList: Array<{
            id: string,
            SID: string,
            NAME: string,
            BIRTHDAY: string,
            EMAIL: string,
            GENDER: string,
            PHONE: string,
            ADDRESS: string,
            segments: Array<string>,
            orders: Array<OrderType>
        }> = [];
        const getCustomersQuery = this.customerRepository
            .createQueryBuilder('customer')
            .select('customer')
            .leftJoinAndSelect('customer.addresses', 'addresses')
            .leftJoinAndSelect('customer.orders', 'orders')
        const customers = await getCustomersQuery.getMany();
        customers.map(customer => {
            const id = customer.SID;
            const SID = customer.SID;
            const FIRST_NAME = customer.FIRST_NAME;
            const LAST_NAME = customer.LAST_NAME;
            const NAME = FIRST_NAME + ' ' + LAST_NAME;
            const BIRTH_DAY = customer.BIRTH_DAY;
            const BIRTH_MONTH = customer.BIRTH_MONTH;
            const BIRTH_YEAR = customer.BIRTH_YEAR;
            let BIRTHDAY = '';
            if (BIRTH_DAY && BIRTH_MONTH && BIRTH_YEAR) {
                BIRTHDAY = BIRTH_DAY + '/' + BIRTH_MONTH + '/' + BIRTH_YEAR;
            }
            const EMAIL = customer.EMAIL;
            const GENDER = customer.GENDER;
            const PHONE = customer.PHONE;
            let CITY = "";
            let DISTRICT = "";
            let STREET_ADDRESS = "";
            let ADDRESS = "";
            if (customer.addresses.length > 0) {
                const defaultAddress = customer.addresses.filter(address => address.IS_DEFAULT_ADDRESS === 1)[0];
                CITY = defaultAddress.CITY;
                DISTRICT = defaultAddress.DISTRICT;
                STREET_ADDRESS = defaultAddress.STREET_ADDRESS;
                ADDRESS = STREET_ADDRESS + ', ' + DISTRICT + ', ' + CITY;
            }
            let orders = customer.orders;
            if (fromDate && toDate) {
                orders = orders.filter(order => order.CREATED_DATETIME.getTime() >= new Date(fromDate).getTime()
                    && order.CREATED_DATETIME.getTime() <= new Date(toDate).getTime());
            }
            const segments = getCustomerSegments(customer);
            customersList.push({ id, SID, NAME, BIRTHDAY, EMAIL, GENDER, PHONE, ADDRESS, segments, orders });
        });
        return { customers: customersList };
    }

    async getSegmentsReport(query: any) {
        const { fromDate, toDate } = query;
        let segments: Array<{ name: string, amount: number }> = [
            {
                name: 'High Spenders',
                amount: 0
            },
            {
                name: 'One Timers',
                amount: 0
            },
            {
                name: 'Idle Customers',
                amount: 0
            }
        ];
        const customers = await this.customerRepository
            .createQueryBuilder('customer')
            .select('customer')
            .leftJoinAndSelect('customer.orders', 'orders')
            .leftJoinAndSelect('customer.addresses', 'addresses')
            .getMany();
        const getSegments = customers.map(customer => {
            let customerSegments = [];
            customerSegments = getCustomerSegments(customer);
            if (fromDate && toDate) {
                customerSegments = getCustomerSegments(customer, fromDate, toDate);
            } else {
                customerSegments = getCustomerSegments(customer);
            }
            customerSegments.map(customerSegment => {
                segments.filter(segment => segment.name === customerSegment)[0].amount += 1;
            })
            return segments;
        })
        await Promise.all(getSegments);
        return { segments };
    }

    async getSegmentDetailsReport(query: any) {
        const { fromDate, toDate, stype } = query;
        let customers = await this.customerRepository
            .createQueryBuilder('customer')
            .select('customer')
            .leftJoinAndSelect('customer.orders', 'orders')
            .leftJoinAndSelect('customer.addresses', 'addresses')
            .getMany();
        let filteredCustomers: Array<{
            SID: string,
            NAME: string,
            BIRTHDAY: string,
            EMAIL: string,
            PHONE: string,
            ADDRESS: string,
            ACTIVE?: number,
            TOTAL_SPENT?: number,
            PURCHASE_DATE?: Date,
        }> = [];
        switch (stype) {
            case 'high_spenders':
                customers = customers.filter(customer => checkIfHighSpender(customer, fromDate, toDate));
                customers.map(customer => {
                    const { SID, EMAIL, FIRST_NAME, LAST_NAME, BIRTH_DAY, BIRTH_MONTH, BIRTH_YEAR } = customer;
                    const PHONE = customer.PHONE;
                    let CITY = "";
                    let DISTRICT = "";
                    let STREET_ADDRESS = "";
                    let ADDRESS = "";
                    if (customer.addresses.length > 0) {
                        const defaultAddress = customer.addresses.filter(address => address.IS_DEFAULT_ADDRESS === 1)[0];
                        CITY = defaultAddress.CITY;
                        DISTRICT = defaultAddress.DISTRICT;
                        STREET_ADDRESS = defaultAddress.STREET_ADDRESS;
                        ADDRESS = STREET_ADDRESS + ', ' + DISTRICT + ', ' + CITY;
                    }
                    const NAME = FIRST_NAME + ' ' + LAST_NAME;
                    let BIRTHDAY = '';
                    if (BIRTH_DAY) {
                        BIRTHDAY = BIRTH_DAY + '/' + BIRTH_MONTH + '/' + BIRTH_YEAR;
                    }
                    const TOTAL_SPENT = customer.orders.reduce((total: number, order) => total + parseFloat(order.TRANSACTION_TOTAL_WITH_TAX.toString()), 0);
                    filteredCustomers = [...filteredCustomers, { SID, NAME, BIRTHDAY, EMAIL, PHONE, ADDRESS, TOTAL_SPENT }]
                })
                break;
            case 'one_timers':
                customers = customers.filter(customer => checkIfOneTimer(customer, fromDate, toDate));
                customers.map(customer => {
                    const { SID, EMAIL, FIRST_NAME, LAST_NAME, BIRTH_DAY, BIRTH_MONTH, BIRTH_YEAR } = customer;
                    const PHONE = customer.PHONE;
                    let CITY = "";
                    let DISTRICT = "";
                    let STREET_ADDRESS = "";
                    let ADDRESS = "";
                    if (customer.addresses.length > 0) {
                        const defaultAddress = customer.addresses.filter(address => address.IS_DEFAULT_ADDRESS === 1)[0];
                        CITY = defaultAddress.CITY;
                        DISTRICT = defaultAddress.DISTRICT;
                        STREET_ADDRESS = defaultAddress.STREET_ADDRESS;
                        ADDRESS = STREET_ADDRESS + ', ' + DISTRICT + ', ' + CITY;
                    }
                    const NAME = FIRST_NAME + ' ' + LAST_NAME;
                    let BIRTHDAY = '';
                    if (BIRTH_DAY) {
                        BIRTHDAY = BIRTH_DAY + '/' + BIRTH_MONTH + '/' + BIRTH_YEAR;
                    }
                    const PURCHASE_DATE = customer.orders[0].CREATED_DATETIME;
                    filteredCustomers = [...filteredCustomers, { SID, NAME, BIRTHDAY, EMAIL, PHONE, ADDRESS, PURCHASE_DATE }]
                })
                break;
            case 'idle_customers':
                customers = customers.filter(customer => checkIfIdle(customer));
                customers.map(customer => {
                    const { SID, ACTIVE, EMAIL, FIRST_NAME, LAST_NAME, BIRTH_DAY, BIRTH_MONTH, BIRTH_YEAR } = customer;
                    const PHONE = customer.PHONE;
                    let CITY = "";
                    let DISTRICT = "";
                    let STREET_ADDRESS = "";
                    let ADDRESS = "";
                    if (customer.addresses.length > 0) {
                        const defaultAddress = customer.addresses.filter(address => address.IS_DEFAULT_ADDRESS === 1)[0];
                        CITY = defaultAddress.CITY;
                        DISTRICT = defaultAddress.DISTRICT;
                        STREET_ADDRESS = defaultAddress.STREET_ADDRESS;
                        ADDRESS = STREET_ADDRESS + ', ' + DISTRICT + ', ' + CITY;
                    }
                    const NAME = FIRST_NAME + ' ' + LAST_NAME;
                    const BIRTHDAY = BIRTH_DAY + '/' + BIRTH_MONTH + '/' + BIRTH_YEAR;
                    filteredCustomers = [...filteredCustomers, { SID, ACTIVE, NAME, BIRTHDAY, EMAIL, PHONE, ADDRESS }]
                })
                break;
            default:
                break;
        }
        return { customers: filteredCustomers };
    }

    async getAccountsReport(query: any) {
        const { fromDate, toDate } = query;
        let newCustomers: Array<{
            ROW_NO: number,
            SID: string,
            CREATED_DATETIME: Date,
            NAME: string,
            ACTIVE: number,
            BIRTHDAY: string,
            CUST_TYPE: number,
            GENDER: string,
            EMAIL: string
        }> = [];
        let allCustomers = await this.customerRepository
            .createQueryBuilder('customer')
            .select('customer')
            .getMany();
        if (fromDate && toDate) {
            let filterdedCustomers = allCustomers.filter(customer => customer.CREATED_DATETIME.getTime() >= new Date(fromDate).getTime()
                && customer.CREATED_DATETIME.getTime() <= new Date(toDate).getTime());
            filterdedCustomers.map((customer, i: number) => {
                let birthDay = '';
                if (customer.BIRTH_DAY) {
                    birthDay = `${customer.BIRTH_DAY}/${customer.BIRTH_MONTH}/${customer.BIRTH_YEAR}`;
                }
                const NAME = `${customer.FIRST_NAME} ${customer.LAST_NAME}`;
                const newCustomer = {
                    ROW_NO: i + 1,
                    SID: customer.SID,
                    CREATED_DATETIME: customer.CREATED_DATETIME,
                    NAME,
                    ACTIVE: customer.ACTIVE,
                    BIRTHDAY: birthDay,
                    CUST_TYPE: customer.CUST_TYPE,
                    GENDER: customer.GENDER,
                    EMAIL: customer.EMAIL
                };
                newCustomers = [...newCustomers, newCustomer];
            })
        }
        return { newCustomers };
    }

    async getDashboardReports() {
        const msInDay = 24 * 60 * 60 * 1000;
        const totalProductAmount = await this.productInformationRepository
            .createQueryBuilder('product_information')
            .select('product_information')
            .getCount();
        const totalCategoryAmount = await this.categoryRepository
            .createQueryBuilder('category')
            .select('category')
            .getCount();
        const currentDT = new Date();
        let currentDay = currentDT.getDay();
        if (currentDT.getDay() === 0) {
            currentDay = 7;
        }
        const currentMonth = currentDT.getMonth() + 1;
        const startDate = new Date(
            currentDT.getFullYear(),
            currentMonth - 1,
            1,
            0,
            0,
            0,
        );
        const orders = await this.orderRepository.find();
        const revenueInMonth = orders
            .filter(
                (order) =>
                    new Date(order.CREATED_DATETIME.toString()).getTime() >=
                    startDate.getTime() &&
                    new Date(order.CREATED_DATETIME.toString()).getTime() <
                    currentDT.getTime(),
            )
            .reduce(
                (total: number, order) =>
                    total + parseFloat(order.TRANSACTION_TOTAL_WITH_TAX.toString()),
                0,
            );
        const revenueAllTime = orders.reduce(
            (total: number, order) =>
                total + parseFloat(order.TRANSACTION_TOTAL_WITH_TAX.toString()),
            0,
        );
        const totalOrders = orders.length;
        let lastSundayDate = new Date();
        lastSundayDate.setDate(currentDT.getDate() - currentDay);
        lastSundayDate.setHours(23);
        lastSundayDate.setMinutes(59);
        lastSundayDate.setSeconds(59);
        let lastMondayDate = new Date(
            lastSundayDate.getTime() - 7 * msInDay + 1000,
        );
        let avgOrderValueLastWeek = orders
            .filter(
                (order) =>
                    new Date(order.CREATED_DATETIME.toString()).getTime() >=
                    lastMondayDate.getTime() &&
                    new Date(order.CREATED_DATETIME.toString()).getTime() <=
                    lastSundayDate.getTime(),
            )
            .reduce(
                (total: number, order) =>
                    total + parseFloat(order.TRANSACTION_TOTAL_WITH_TAX.toString()),
                0,
            );
        avgOrderValueLastWeek = Math.round(
            avgOrderValueLastWeek /
            orders.filter(
                (order) =>
                    new Date(order.CREATED_DATETIME.toString()).getTime() >=
                    lastMondayDate.getTime() &&
                    new Date(order.CREATED_DATETIME.toString()).getTime() <=
                    lastSundayDate.getTime(),
            ).length,
        );
        const thisWeekMonday = new Date();
        thisWeekMonday.setDate(currentDT.getDate() - currentDay + 1);
        thisWeekMonday.setHours(0);
        thisWeekMonday.setMinutes(0);
        thisWeekMonday.setSeconds(0);
        let avgOrderValueThisWeek = orders
            .filter(
                (order) =>
                    new Date(order.CREATED_DATETIME.toString()).getTime() >=
                    thisWeekMonday.getTime() &&
                    new Date(order.CREATED_DATETIME.toString()).getTime() <=
                    currentDT.getTime(),
            )
            .reduce(
                (total: number, order) =>
                    total + parseFloat(order.TRANSACTION_TOTAL_WITH_TAX.toString()),
                0,
            );
        avgOrderValueThisWeek = Math.round(
            avgOrderValueThisWeek /
            orders.filter(
                (order) =>
                    new Date(order.CREATED_DATETIME.toString()).getTime() >=
                    thisWeekMonday.getTime() &&
                    new Date(order.CREATED_DATETIME.toString()).getTime() <=
                    currentDT.getTime(),
            ).length,
        );

        return {
            totalProductAmount,
            totalCategoryAmount,
            revenueInMonth,
            revenueAllTime,
            totalOrders,
            avgOrderValueLastWeek,
            avgOrderValueThisWeek,
        };
    }

    async getSalesStatistics(query: any) {
        const msInDay = 24 * 60 * 60 * 1000;
        const { mode } = query;
        let salesStatistics: Array<{
            timestamp: number;
            totalOrders: number;
            totalQty: number;
        }> = [];
        if (mode === 'tyear') {
            const currentDT = new Date();
            for (let i = 0; i < currentDT.getMonth() + 1; i++) {
                const totalDaysInMonth = new Date(
                    currentDT.getFullYear(),
                    i + 1,
                    0,
                ).getDate();
                let timestamp = 0;
                if (i < currentDT.getMonth()) {
                    timestamp = new Date(
                        currentDT.getFullYear(),
                        i,
                        totalDaysInMonth,
                        23,
                        59,
                        59,
                    ).getTime();
                } else {
                    timestamp = new Date(
                        currentDT.getFullYear(),
                        i,
                        currentDT.getDate(),
                        23,
                        59,
                        59,
                    ).getTime();
                }
                salesStatistics.push({ timestamp, totalOrders: 0, totalQty: 0 });
            }
            const getSalesStatistics = salesStatistics.map(async (sale) => {
                const date = new Date(sale.timestamp);
                let startDate = new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    1,
                    0,
                    0,
                    0,
                );
                const ordersInMonth = await this.orderRepository.find({
                    where: {
                        CREATED_DATETIME: Between(
                            new Date(startDate),
                            new Date(sale.timestamp),
                        ),
                    },
                });
                const totalOrders = ordersInMonth.length;
                const totalQty = ordersInMonth.reduce(
                    (totalQty: number, order) => totalQty + order.TOTAL_ITEM_COUNT,
                    0,
                );
                sale.totalOrders = totalOrders;
                sale.totalQty = totalQty;
                return salesStatistics;
            });
            await Promise.all(getSalesStatistics);
        } else if (mode === 'tmonth') {
            const currentDT = new Date();
            for (let i = 0; i < currentDT.getDate(); i++) {
                let dateInMonth = new Date();
                if (i < currentDT.getDate() - 1) {
                    dateInMonth.setDate(i + 1);
                    dateInMonth.setHours(23);
                    dateInMonth.setMinutes(59);
                    dateInMonth.setSeconds(59);
                }
                salesStatistics.push({
                    timestamp: dateInMonth.getTime(),
                    totalOrders: 0,
                    totalQty: 0,
                });
            }
            const getSalesStatistics = salesStatistics.map(async (sale) => {
                let startDate = new Date(sale.timestamp);
                startDate.setHours(0);
                startDate.setMinutes(0);
                startDate.setSeconds(0);
                const ordersInMonth = await this.orderRepository.find({
                    where: {
                        CREATED_DATETIME: Between(startDate, new Date(sale.timestamp)),
                    },
                });
                const totalOrders = ordersInMonth.length;
                const totalQty = ordersInMonth.reduce(
                    (totalQty: number, order) => totalQty + order.TOTAL_ITEM_COUNT,
                    0,
                );
                sale.totalOrders = totalOrders;
                sale.totalQty = totalQty;
                return salesStatistics;
            });
            await Promise.all(getSalesStatistics);
        } else if (mode === 'lmonth') {
            const currentDT = new Date();
            const totalDaysInLastMonth = new Date(
                currentDT.getFullYear(),
                currentDT.getMonth(),
                0,
            ).getDate();
            for (let i = 0; i < totalDaysInLastMonth; i++) {
                let dateInMonth = new Date();
                dateInMonth.setDate(i + 1);
                dateInMonth.setMonth(currentDT.getMonth() - 1);
                dateInMonth.setHours(23);
                dateInMonth.setMinutes(59);
                dateInMonth.setSeconds(59);
                salesStatistics.push({
                    timestamp: dateInMonth.getTime(),
                    totalOrders: 0,
                    totalQty: 0,
                });
            }
            const getSalesStatistics = salesStatistics.map(async (sale) => {
                let startDate = new Date(sale.timestamp);
                startDate.setHours(0);
                startDate.setMinutes(0);
                startDate.setSeconds(0);
                const ordersInMonth = await this.orderRepository.find({
                    where: {
                        CREATED_DATETIME: Between(startDate, new Date(sale.timestamp)),
                    },
                });
                const totalOrders = ordersInMonth.length;
                const totalQty = ordersInMonth.reduce(
                    (totalQty: number, order) => totalQty + order.TOTAL_ITEM_COUNT,
                    0,
                );
                sale.totalOrders = totalOrders;
                sale.totalQty = totalQty;
                return salesStatistics;
            });
            await Promise.all(getSalesStatistics);
        } else if (mode === 'lweek') {
            const currentDT = new Date();
            let currentDay = currentDT.getDay();
            if (currentDT.getDay() === 0) {
                currentDay = 7;
            }
            let lastWeekMondayDate = new Date();
            lastWeekMondayDate.setDate(currentDT.getDate() - currentDay - 6);
            lastWeekMondayDate.setHours(23);
            lastWeekMondayDate.setMinutes(59);
            lastWeekMondayDate.setSeconds(59);
            for (let i = 0; i < 7; i++) {
                let timestamp = lastWeekMondayDate.getTime() + msInDay * i;
                salesStatistics.push({ timestamp, totalOrders: 0, totalQty: 0 });
            }
            const getSalesStatistics = salesStatistics.map(async (sale) => {
                let startDateTime = new Date(sale.timestamp);
                startDateTime.setHours(0);
                startDateTime.setMinutes(0);
                startDateTime.setSeconds(0);
                const ordersInDay = await this.orderRepository.find({
                    where: {
                        CREATED_DATETIME: Between(startDateTime, new Date(sale.timestamp)),
                    },
                });
                const totalOrders = ordersInDay.length;
                const totalQty = ordersInDay.reduce(
                    (totalQty: number, order) => totalQty + order.TOTAL_ITEM_COUNT,
                    0,
                );
                sale.totalOrders = totalOrders;
                sale.totalQty = totalQty;
                return salesStatistics;
            });
            await Promise.all(getSalesStatistics);
        } else if (mode === 'tweek') {
            const currentDT = new Date();
            let thisWeekMondayDate = new Date();
            let currentDay = currentDT.getDay();
            if (currentDT.getDay() === 0) {
                currentDay = 7;
            }
            thisWeekMondayDate.setDate(currentDT.getDate() - currentDay + 1);
            thisWeekMondayDate.setHours(0);
            thisWeekMondayDate.setMinutes(0);
            thisWeekMondayDate.setSeconds(0);
            for (let i = 0; i < currentDay; i++) {
                let timestamp = 0;
                timestamp = thisWeekMondayDate.getTime() + msInDay * i;
                salesStatistics.push({ timestamp, totalOrders: 0, totalQty: 0 });
            }
            const getSalesStatistics = salesStatistics.map(
                async (sale, i: number) => {
                    let endDateTime = new Date(sale.timestamp);
                    if (i < salesStatistics.length - 1) {
                        endDateTime.setHours(23);
                        endDateTime.setMinutes(59);
                        endDateTime.setSeconds(59);
                    } else {
                        endDateTime = currentDT;
                    }
                    const ordersInDay = await this.orderRepository.find({
                        where: {
                            CREATED_DATETIME: Between(new Date(sale.timestamp), endDateTime),
                        },
                    });
                    const totalOrders = ordersInDay.length;
                    const totalQty = ordersInDay.reduce(
                        (totalQty: number, order) => totalQty + order.TOTAL_ITEM_COUNT,
                        0,
                    );
                    sale.timestamp = endDateTime.getTime();
                    sale.totalOrders = totalOrders;
                    sale.totalQty = totalQty;
                    return salesStatistics;
                },
            );
            await Promise.all(getSalesStatistics);
        } else if (mode === 'today') {
            const currentDT = new Date();
            let beginDayHourTime = new Date(currentDT);
            beginDayHourTime.setHours(0);
            beginDayHourTime.setMinutes(59);
            beginDayHourTime.setSeconds(59);
            salesStatistics.push({
                timestamp: beginDayHourTime.getTime(),
                totalOrders: 0,
                totalQty: 0,
            });
            for (let i = 0; i < currentDT.getHours() + 1; i++) {
                let dateTime = new Date();
                if (i < currentDT.getHours()) {
                    dateTime.setHours(i);
                    dateTime.setMinutes(59);
                    dateTime.setSeconds(59);
                }
                salesStatistics.push({
                    timestamp: dateTime.getTime(),
                    totalOrders: 0,
                    totalQty: 0,
                });
            }
            const getSalesStatistics = salesStatistics.map(
                async (sale, i: number) => {
                    let startTimestamp = sale.timestamp - (59 * 60 * 1000 + 59 * 1000);
                    const ordersInHour = await this.orderRepository.find({
                        where: {
                            CREATED_DATETIME: Between(
                                new Date(startTimestamp),
                                new Date(sale.timestamp),
                            ),
                        },
                    });
                    const totalOrders = ordersInHour.length;
                    const totalQty = ordersInHour.reduce(
                        (totalQty: number, order) => totalQty + order.TOTAL_ITEM_COUNT,
                        0,
                    );
                    sale.totalOrders = totalOrders;
                    sale.totalQty = totalQty;
                    return salesStatistics;
                },
            );
            await Promise.all(getSalesStatistics);
        }
        return { salesStatistics };
    }
    async getlowStockReport(FROM: String, TO: String) {
        let productList: Array<{
            id: number,
            SKU: string,
            SID: string,
            PRODUCT_NAME: string,
            CATEGORY_NAME: string,
            BRAND: string,
            UNIT_PRICE: string,
            SIZE: string,
            COLOR: string,
            QTY: string,
        }> = [];
        const manager = getManager();

        const query = `SELECT PI.SKU, P.SID,PI.PRODUCT_NAME,C.CATEGORY_NAME,PB.NAME,PP.UNIT_PRICE, ATR.VALUE_VARCHAR AS SIZE,
        AG.GROUP_VALUE_VARCHAR AS COLOR,P.QTY FROM PRODUCT P
        LEFT JOIN inventory_history INVN ON INVN.PRODUCT_SID=P.SID
        LEFT JOIN order_item ORD ON ORD.SID_PRODUCT=P.SID
        LEFT JOIN product_information PI ON PI.SID=P.SID_PRODUCT_INFORMATION
        LEFT JOIN product_category PC on PI.SID = PC.SID_PRODUCT
        LEFT JOIN CATEGORY C ON PC.SID_CATEGORY =C.SID
        LEFT JOIN PRODUCT_BRAND PB ON PB.SID=PI.SID_BRAND
        LEFT JOIN product_attribute_value ATR ON ATR.SID_PRODUCT=P.SID
        LEFT JOIN product_attribute_group AG ON AG.PRODUCT_INFORMATION_SID=PI.SID
        LEFT JOIN PRODUCT_PRICE PP ON PI.SID = PP.SID_PRODUCT_INFORMATION
        WHERE ORD.CREATED_DATETIME >= '${FROM}' 
        AND ORD.CREATED_DATETIME <= '${TO}'
        AND (P.QTY-ORD.QUANTITY) < PI.THRESHOLD
        GROUP BY P.SID`;
        const product = await manager.query(query);
        let i = 0;
        product.map(product => {
            const id = i++;
            const SKU = product.SKU;
            const SID = product.SID;
            const PRODUCT_NAME = product.PRODUCT_NAME;
            const CATEGORY_NAME = product.CATEGORY_NAME;
            const BRAND = product.NAME;
            const UNIT_PRICE = product.UNIT_PRICE;
            const SIZE = product.SIZE;
            const COLOR = product.COLOR;
            const QTY = product.QTY;
            productList.push({ id, SKU, SID, PRODUCT_NAME, CATEGORY_NAME, BRAND, UNIT_PRICE, SIZE, COLOR, QTY });
        })
        console.log(productList);
        return { product: productList };
    }

    async getOrderedReport(FROM: String, TO: String) {
        let productList: Array<{
            id: number,
            SKU: string,
            SID: string,
            PRODUCT_NAME: string,
            BRAND: string,
            UNIT_PRICE: string,
            SIZE: string,
            COLOR: string,
            ORDER_QTY: string,

        }> = [];
        const manager = getManager();

        const query = `SELECT PI.SKU, ORD.SID_PRODUCT,PI.PRODUCT_NAME,PB.NAME,PP.UNIT_PRICE,ATR.VALUE_DECIMAL AS SIZE,AG.GROUP_VALUE_VARCHAR AS COLOR, SUM(ORD.QUANTITY) AS ORDER_QTY FROM ORDER_ITEM ORD
        JOIN product P ON P.SID = ORD.SID_PRODUCT
        JOIN PRODUCT_INFORMATION PI ON PI.SID = P.SID_PRODUCT_INFORMATION
        JOIN PRODUCT_BRAND PB ON PB.SID = PI.SID_BRAND
        JOIN PRODUCT_PRICE PP ON PI.SID = PP.SID_PRODUCT_INFORMATION
        JOIN product_attribute_value ATR ON ATR.SID_PRODUCT=P.SID
        JOIN product_attribute_group AG ON AG.PRODUCT_INFORMATION_SID=PI.SID
        WHERE ORD.CREATED_DATETIME >= '${FROM}' 
        AND ORD.CREATED_DATETIME <= '${TO}' 
        AND ATR.VALUE_DECIMAL IS NOT NULL
        group by ORD.SID_PRODUCT
        UNION 
        SELECT PI.SKU, ORD.SID_PRODUCT,PI.PRODUCT_NAME,PB.NAME,PP.UNIT_PRICE,ATR.VALUE_VARCHAR AS SIZE,AG.GROUP_VALUE_VARCHAR AS COLOR, SUM(ORD.QUANTITY) AS ORDER_QTY FROM ORDER_ITEM ORD
        JOIN product P ON P.SID = ORD.SID_PRODUCT
        JOIN PRODUCT_INFORMATION PI ON PI.SID = P.SID_PRODUCT_INFORMATION
        JOIN PRODUCT_BRAND PB ON PB.SID = PI.SID_BRAND
        JOIN PRODUCT_PRICE PP ON PI.SID = PP.SID_PRODUCT_INFORMATION
        JOIN product_attribute_value ATR ON ATR.SID_PRODUCT=P.SID
        JOIN product_attribute_group AG ON AG.PRODUCT_INFORMATION_SID=PI.SID
        WHERE ORD.CREATED_DATETIME >= '${FROM}' 
        AND ORD.CREATED_DATETIME <= '${TO}' 
        AND ATR.VALUE_VARCHAR IS NOT NULL
        group by ORD.SID_PRODUCT
	`;
        const product = await manager.query(query);
        let i = 0;
        product.map(product => {
            const id = i++;
            const SKU = product.SKU;
            const SID = product.SID_PRODUCT;
            const PRODUCT_NAME = product.PRODUCT_NAME;
            const BRAND = product.NAME;
            const UNIT_PRICE = product.UNIT_PRICE;
            const SIZE = product.SIZE;
            const COLOR = product.COLOR;
            const ORDER_QTY = product.ORDER_QTY;
            productList.push({ id, SKU, SID, PRODUCT_NAME, BRAND, UNIT_PRICE, SIZE, COLOR, ORDER_QTY });
        })
        console.log(productList);
        return { product: productList };
    }

    async getOrderedDetail(FROM: String, TO: String, PSID: string) {
        let detailtList: Array<{
            id: number,
            FIRST_NAME: string,
            LAST_NAME: string,
            EMAIL: string,
            QUANTITY: string,
            CREATED_DATETIME: string,


        }> = [];
        const manager = getManager();

        const query = `SELECT C.FIRST_NAME,C.LAST_NAME,C.EMAIL, OI.QUANTITY,ORD.CREATED_DATETIME FROM mydb.order_item OI
        left join  mydb.ORDER ORD ON ORD.ID=OI.order_id
        left join product p on OI.SID_PRODUCT=P.SID
        left join product_information PI on P.SID_PRODUCT_INFORMATION =PI.SID
        left join customer C ON C.SID =ORD.SID_CUSTOMER
        WHERE OI.SID_PRODUCT='${PSID}'
        AND ORD.CREATED_DATETIME >= '${FROM}' 
        AND ORD.CREATED_DATETIME <= '${TO}'
	`;
        const detail = await manager.query(query);
        let i = 0;
        detail.map(details => {
            const id = i++;
            const FIRST_NAME = details.FIRST_NAME;
            const LAST_NAME = details.LAST_NAME;
            const EMAIL = details.EMAIL;
            const QUANTITY = details.QUANTITY;
            const CREATED_DATETIME = details.CREATED_DATETIME;
            detailtList.push({ id, FIRST_NAME, LAST_NAME, EMAIL, QUANTITY, CREATED_DATETIME });
        })
        console.log(detailtList);
        return { List: detailtList };
    }

    async getBestsellersReport(FROM: String, TO: String) {
        let productList: Array<{
            id: number,
            SKU: string,
            PRODUCT_NAME: string,
            BRAND: string,
            UNIT_PRICE: string,
            SIZE: string,
            COLOR: string,
            ORDER_QTY: string,

        }> = [];
        const manager = getManager();

        const query = `SELECT PI.SKU, ORD.SID_PRODUCT, PI.PRODUCT_NAME, PB.NAME, PP.UNIT_PRICE,
        ATR.VALUE_DECIMAL AS SIZE,AG.GROUP_VALUE_VARCHAR AS COLOR, 
         SUM(ORD.QUANTITY) AS ORDER_QTY FROM ORDER_ITEM ORD
                JOIN product P ON P.SID = ORD.SID_PRODUCT
                JOIN PRODUCT_INFORMATION PI ON PI.SID = P.SID_PRODUCT_INFORMATION
                JOIN PRODUCT_BRAND PB ON PB.SID = PI.SID_BRAND
                JOIN PRODUCT_PRICE PP ON PI.SID = PP.SID_PRODUCT_INFORMATION
                JOIN product_attribute_value ATR ON ATR.SID_PRODUCT=P.SID
                JOIN product_attribute_group AG ON AG.PRODUCT_INFORMATION_SID=PI.SID
                WHERE ORD.CREATED_DATETIME >= '${FROM}' AND ORD.CREATED_DATETIME <= '${TO}'
                AND ATR.VALUE_DECIMAL IS NOT NULL
                group by SID_PRODUCT
                UNION
                SELECT PI.SKU, ORD.SID_PRODUCT, PI.PRODUCT_NAME, PB.NAME, PP.UNIT_PRICE,
        ATR.VALUE_VARCHAR AS SIZE,AG.GROUP_VALUE_VARCHAR AS COLOR, 
         SUM(ORD.QUANTITY) AS ORDER_QTY FROM ORDER_ITEM ORD
                JOIN product P ON P.SID = ORD.SID_PRODUCT
                JOIN PRODUCT_INFORMATION PI ON PI.SID = P.SID_PRODUCT_INFORMATION
                JOIN PRODUCT_BRAND PB ON PB.SID = PI.SID_BRAND
                JOIN PRODUCT_PRICE PP ON PI.SID = PP.SID_PRODUCT_INFORMATION
                JOIN product_attribute_value ATR ON ATR.SID_PRODUCT=P.SID
                JOIN product_attribute_group AG ON AG.PRODUCT_INFORMATION_SID=PI.SID
                WHERE ORD.CREATED_DATETIME >= '${FROM}' AND ORD.CREATED_DATETIME <= '${TO}'
                AND ATR.VALUE_VARCHAR IS NOT NULL
                group by SID_PRODUCT
                ORDER BY ORDER_QTY DESC
                LIMIT 5`;
        const product = await manager.query(query);
        let i = 0;
        product.map(product => {
            const id = i++;
            const SKU = product.SKU;
            const PRODUCT_NAME = product.PRODUCT_NAME;
            const BRAND = product.NAME;
            const UNIT_PRICE = product.UNIT_PRICE
            const SIZE = product.SIZE;
            const COLOR = product.COLOR;
            const ORDER_QTY = product.ORDER_QTY;
            productList.push({ id, SKU, PRODUCT_NAME, BRAND, UNIT_PRICE, SIZE, COLOR, ORDER_QTY });
        })
        console.log(productList);
        return { product: productList };
    }
    async getProductViewReport(FROM: String, TO: String) {


        let productList: Array<{
            id: number,
            SKU: string,
            PRODUCT_NAME: string,
            CATEGORY_NAME: string,
            BRAND: string,
            QTY: string,
            VIEWED: string,

        }> = [];
        const manager = getManager();

        const query = `SELECT PI.SKU, PI.SID, PI.PRODUCT_NAME, C.CATEGORY_NAME, PB.NAME, P.QTY, COUNT(W.SID_PRODUCT_INFORMATION) AS VIEWED FROM product_information PI
        JOIN product P ON P.SID_PRODUCT_INFORMATION = PI.SID
        JOIN product_category PC on PI.SID = PC.SID_PRODUCT
        JOIN CATEGORY C ON PC.SID_CATEGORY = C.SID
        JOIN PRODUCT_BRAND PB ON PB.SID = PI.SID_BRAND
        JOIN VIEW_HIST W ON W.SID_PRODUCT_INFORMATION = PI.SID
        WHERE W.CREATED_DATETIME >= '${FROM}' AND W.CREATED_DATETIME <= '${TO}'
        GROUP BY PI.SID
        ORDER BY VIEWED DESC`;
        const product = await manager.query(query);
        let i = 0;
        product.map(product => {
            const id = i++;
            const SKU = product.SKU;
            const PRODUCT_NAME = product.PRODUCT_NAME;
            const CATEGORY_NAME = product.CATEGORY_NAME;
            const BRAND = product.NAME;
            const QTY = product.QTY;
            const VIEWED = product.VIEWED;
            productList.push({ id, SKU, PRODUCT_NAME, CATEGORY_NAME, BRAND, QTY, VIEWED });
        })
        console.log(productList);
        return { product: productList };
    }
    async getProductInCart(FROM: String, TO: String) {
        let productList: Array<{
            id: number,
            SKU: string,
            SID: string,
            PRODUCT_NAME: string,
            BRAND: string,
            UNIT_PRICE: string,
            SIZE: string,
            COLOR: string,
            CART: number,

        }> = [];
        const manager = getManager();

        const query = `SELECT PI.SKU, CI.SID_PRODUCT, PI.PRODUCT_NAME,PB.NAME,PP.UNIT_PRICE,ATR.VALUE_DECIMAL AS SIZE,AG.GROUP_VALUE_VARCHAR AS COLOR ,count(CI.CART_SID) as CART
        FROM cart_item CI
                JOIN CART C ON C.SID=CI.CART_SID
                LEFT JOIN product P ON CI.SID_PRODUCT = P.SID
                LEFT JOIN PRODUCT_INFORMATION PI ON PI.SID=P.SID_PRODUCT_INFORMATION
                LEFT JOIN PRODUCT_BRAND PB ON PB.SID = PI.SID_BRAND
                LEFT JOIN PRODUCT_PRICE PP ON PI.SID = PP.SID_PRODUCT_INFORMATION
                LEFT JOIN product_attribute_value ATR ON ATR.SID_PRODUCT=P.SID
                LEFT JOIN product_attribute_group AG ON AG.PRODUCT_INFORMATION_SID=PI.SID
        WHERE CI.CREATED_DATETIME >= '${FROM}' 
        AND CI.CREATED_DATETIME <= '${TO}'
        AND ATR.VALUE_DECIMAL IS NOT NULL
        AND C.STATUS=1
        group by  CI.SID_PRODUCT
        
        UNION 
        SELECT PI.SKU, CI.SID_PRODUCT, PI.PRODUCT_NAME,PB.NAME,PP.UNIT_PRICE,ATR.VALUE_VARCHAR AS SIZE,AG.GROUP_VALUE_VARCHAR AS COLOR,count(CI.CART_SID) as cart
        FROM cart_item CI
        JOIN CART C ON C.SID=CI.CART_SID
        LEFT JOIN product P ON CI.SID_PRODUCT = P.SID
        LEFT JOIN PRODUCT_INFORMATION PI ON PI.SID=P.SID_PRODUCT_INFORMATION
        LEFT JOIN PRODUCT_BRAND PB ON PB.SID = PI.SID_BRAND
        LEFT JOIN PRODUCT_PRICE PP ON PI.SID = PP.SID_PRODUCT_INFORMATION
        LEFT JOIN product_attribute_value ATR ON ATR.SID_PRODUCT=P.SID
        LEFT JOIN product_attribute_group AG ON AG.PRODUCT_INFORMATION_SID=PI.SID
        WHERE CI.CREATED_DATETIME >= '${FROM}'
        AND CI.CREATED_DATETIME <= '${TO}'
        AND ATR.VALUE_VARCHAR IS NOT NULL
        AND C.STATUS=1
        group by  CI.SID_PRODUCT
        
        `;
        const product = await manager.query(query);
        let i = 0;
        product.map(product => {
            const id = i++;
            const SKU = product.SKU
            const SID = product.SID_PRODUCT;
            const PRODUCT_NAME = product.PRODUCT_NAME;
            const BRAND = product.NAME;
            const UNIT_PRICE = product.UNIT_PRICE
            const SIZE = product.SIZE;
            const COLOR = product.COLOR;
            const ORDER_QTY = product.ORDER_QTY;
            const CART = product.CART;
            productList.push({ id, SKU, SID, PRODUCT_NAME, BRAND, UNIT_PRICE, SIZE, COLOR, CART });
        })
        console.log(productList);
        return { product: productList };
    }

    async getProductInCartDetail(FROM: String, TO: String, PSID: string) {
        let detailtList: Array<{
            id: number,
            CART_SID: string,
            PRODUCT_NAME: string,
            FIRST_NAME: string,
            LAST_NAME: string,
            EMAIL: string,
            QUANTITY: number,


        }> = [];
        const manager = getManager();

        const query = `SELECT CI.CART_SID, PI.PRODUCT_NAME,CUST.FIRST_NAME,CUST.LAST_NAME,CUST.EMAIL, CI.QUANTITY
        FROM cart_item CI
		JOIN CART C ON C.SID=CI.CART_SID
        LEFT JOIN CUSTOMER CUST ON CUST.SID=C.SID_CUSTOMER
        LEFT JOIN product P ON CI.SID_PRODUCT = P.SID
        LEFT JOIN PRODUCT_INFORMATION PI ON PI.SID=P.SID_PRODUCT_INFORMATION
        WHERE CI.CREATED_DATETIME >= '${FROM}'
        AND CI.CREATED_DATETIME <= '${TO}'
        AND P.SID ='${PSID}'
        AND C.STATUS=1
	`;
        const detail = await manager.query(query);
        let i = 0;
        detail.map(details => {
            const id = i++;
            const CART_SID = details.CART_SID;
            const PRODUCT_NAME = details.PRODUCT_NAME;
            const FIRST_NAME = details.FIRST_NAME;
            const LAST_NAME = details.LAST_NAME;
            const EMAIL = details.EMAIL;
            const QUANTITY = details.QUANTITY;
            detailtList.push({ id, CART_SID, PRODUCT_NAME, FIRST_NAME, LAST_NAME, EMAIL, QUANTITY });
        })
        console.log(detailtList);
        return { List: detailtList };
    }

    async getSearchTerm(FROM: String, TO: String) {
        let SearchList: Array<{
            id: number,
            SEARCH_TERM: string,
            COUNT: number,
            TOTAL_RECORD: number,
            MODIFIED_DATETIME: string,

        }> = [];
        const manager = getManager();

        const query = `select ID,SEARCH_TERM,COUNT,TOTAL_RECORD, MODIFIED_DATETIME from search_term
        WHERE MODIFIED_DATETIME >= '${FROM}'
        AND MODIFIED_DATETIME <= '${TO}'
        ORDER BY COUNT DESC
        `;
        const SearchTerm = await manager.query(query);
        let i = 0;
        SearchTerm.map(SearchString => {
            const id = SearchString.ID;
            const SEARCH_TERM = SearchString.SEARCH_TERM;
            const COUNT = SearchString.COUNT;
            const TOTAL_RECORD = SearchString.TOTAL_RECORD
            const MODIFIED_DATETIME = SearchString.MODIFIED_DATETIME;
            SearchList.push({ id, SEARCH_TERM, COUNT, TOTAL_RECORD, MODIFIED_DATETIME });
        })
        console.log(SearchList);
        return { SearchString: SearchList };
    }
    async setRecommend(TYPE: String) {
        const manager = getManager();
        const query = `update Recommend_active set active = 0
        where sid > 0`;
        const result = await manager.query(query);
        const query1 = `update Recommend_active set active = 1
        where TYPE_SID = '${TYPE}'`;
        const result1 = await manager.query(query1);
        return result1;
    }

    async getRecommend() {
        let ListaActive: Array<{
            TYPE: string;
            ACTIVE: number;
            DESCRPITION: string;
        }> = [];
        const manager = getManager();
        const query = `select TYPE_SID,ACTIVE, DESCRPITION FROM Recommend_active`;
        const result = await manager.query(query);
        result.map((active) => {

            const TYPE = active.TYPE_SID;
            const ACTIVE = active.ACTIVE;
            const DESCRPITION = active.DESCRPITION;
            ListaActive.push({ TYPE, ACTIVE, DESCRPITION });
        });
        return { result: ListaActive };
    }
}
