import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import axios from "axios";
import { PrismCategoryType, PrismInventoryType, PrismStoreType, ProductAttributeGroupType, ProductAttributeType, ProductInformationType, ProductType } from "../../../types/types";
import { DefaultNamingStrategy, Repository } from "typeorm";
import CreateStoreDTO from "../../../modules/store/dto/create-store.dto";
import PrismCrawlHistory from "../entity/prism_crawl_history.entity";
import * as moment from "moment";
import Store from "../../../modules/store/store.entity";
import CreateCategoryDTO from "../../../modules/category/dto/create-category.dto";
import Category from "../../../modules/category/category.entity";
import CreateProductBrandDTO from "../../../modules/product/dto/create-product-brand.dto";
import ProductBrand from "../../../modules/product/product_brand.entity";
import CreateProductInformationDTO from "../../../modules/product/dto/create-product-information.dto";
import Order from "src/modules/order/order.entity";
import { CreateOrderDTO } from "src/modules/order/dto/create-order.dto";
import { response } from "express";
import { create } from "domain";
import Coupon from '../../customer/coupon.entity'
import { DefaultEventsMap } from "socket.io-client/build/typed-events";
import { io } from "socket.io-client";
import ProductInformation from "../../../modules/product/product_information.entity";
import ProductPrice from "../../../modules/product/product_price.entity";

type OptionType = {
    UPC: string,
    groupAttributeValue: string,
    subAttributeValue: string,
    QTY: number,
    IMAGE1_URL: string,
    IMAGE2_URL: string,
    IMAGE3_URL: string
}

type ImportedProductType = {
    PRODUCT_NAME: string,
    SKU: string,
    CATEGORY_SID: string,
    SID_BRAND: string,
    SHORT_DESCRIPTION: string,
    SHORT_DESCRIPTION_TEXT: string,
    LONG_DESCRIPTION: string,
    LONG_DESCRIPTION_TEXT: string,
    PRODUCT_GENDER: "Men" | "Women" | "Both",
    PRICE: number,
    TAX: number,
    THRESHOLD: number,
    options: Array<OptionType>,
}

@Injectable()
export default class PrismService {
    constructor(
        @InjectRepository(PrismCrawlHistory) private prismCrawlHistoryRepository: Repository<PrismCrawlHistory>,
        @InjectRepository(Store) private storeRepository: Repository<Store>,
        @InjectRepository(Category) private categoryRepository: Repository<Category>,
        @InjectRepository(ProductBrand) private productBrandRepository: Repository<ProductBrand>,
        @InjectRepository(ProductInformation) private productInformationRepository: Repository<ProductInformation>,
        @InjectRepository(ProductPrice) private productPriceRepository: Repository<ProductPrice>,
        @InjectRepository(Coupon) private couponRepository: Repository<Coupon>
    ) { }
    private BASE_URL = "http://desktop-7kk869t"
    private REST_BASE_URL = `${this.BASE_URL}/v1/rest`;
    private BACK_OFFICE_BASE_URL = `${this.BASE_URL}/api/backoffice`;
    private API_COMMON_BASE_URL = `${this.BASE_URL}/api/common`;
    private token: {
        value: string,
        createdAt: Date,
    } = null;

    async authenticate() {
        const currentTimestamp = new Date().getTime();
        const oneHourInMS = 1000 * 60 * 60;
        if (this.token === null || (currentTimestamp - this.token.createdAt.getTime()) > oneHourInMS) {
            const authURL = `${this.REST_BASE_URL}/auth`;
            const authURLResponse = await axios({
                url: authURL,
                method: 'GET'
            })
            let fNonce1 = authURLResponse.headers['auth-nonce'];
            const fNonce2 = authURLResponse.headers['auth-nonce'];
            let intNonce = parseInt(fNonce1);
            intNonce = Math.floor(intNonce / 13) % 99999 * 17;
            fNonce1 = intNonce.toString();
            const authWithLoginURL = `${this.REST_BASE_URL}/auth?pwd=sysadmin&usr=sysadmin`;
            const authWithLoginURLResponse = await axios({
                url: authWithLoginURL,
                method: 'GET',
                headers: {
                    "Auth-Nonce": fNonce2,
                    "Auth-Nonce-Response": intNonce
                }
            })
            const fAuthToken = authWithLoginURLResponse.headers['auth-session'];
            const getTokenURL = `${this.REST_BASE_URL}/sit?ws=webclient`;
            const getTokenResponse = await axios({
                url: getTokenURL,
                method: 'GET',
                headers: {
                    "Auth-Session": fAuthToken,
                }
            })
            const data = getTokenResponse.status;
            if (data !== 200) return { error: 'Authorize failed' };
            const value = fAuthToken;
            const createdAt = new Date();
            this.token = {
                value,
                createdAt
            }
        }
        return { token: this.token.value };
    }

    async updateNotiInStoreCode(store_code: string) {
        const url = "http://localhost:5035/socket/orders";
        const socket = io(url, { transports: ["websocket"] });
        socket.emit('newOrders', { store: store_code });
    }

    async updateOrder(createOrderDTO: CreateOrderDTO, store_code: string) {
        try {
            let customer_id = await this.updateCustomer(createOrderDTO);
            await this.createOrder(customer_id, createOrderDTO, store_code);
            this.updateNotiInStoreCode(store_code)
        }
        catch (ex) {
            console.log(ex.response.data);
        }
    }

    async loadInventory(PRODUCT_NAME: string, ATTRIBUTE: string, ITEMSIZE: string) {
        let product_info_name: string = PRODUCT_NAME.split('-')[0].trim();
        const invn = await axios({
            method: "GET",
            // url:  `${this.BACK_OFFICE_BASE_URL}/inventory?cols=*&filter=(description1,eq,Ecommerce product)`,
            url: `${this.BACK_OFFICE_BASE_URL}/inventory?cols=*&filter=(description1,eq,"${product_info_name}")and((attribute,eq,${ATTRIBUTE})and(itemsize,eq,${ITEMSIZE}))`,
            headers: {
                'Content-Type': 'application/json',
                'Auth-Session': this.token.value,
                'Accept': 'application/json, version=2',
            }
        })
        return invn;
    }

    async loadStore(store_code: string) {
        const store = await axios({
            method: "GET",
            url: `${this.REST_BASE_URL}/store?cols=*&filter=(store_code,eq,${store_code})`,
            headers: {
                'Content-Type': 'application/json',
                'Auth-Session': this.token.value,
                'Accept': 'application/json, version=2',
            }
        })
        // console.log(store.data);
        if (store.data.length > 0)
            return store.data[0].sid;
        return "";
    }

    async createOrder(customer_id: number, createOrderDTO: CreateOrderDTO, store_code: string) {
        // const stores = await this.storeRepository.findOne({where: {STORE_ID: createOrderDTO.STORE_ID}});
        const store_uid = await this.loadStore(store_code);
        let document = {
            origin_application: "Ecommerce",
            status: 3,
            bt_cuid: customer_id,
            st_address_line1: 'TRUE',
            st_address_line2: 'ready',
            store_uid: store_uid,
            tracking_number: createOrderDTO.ID.toString(),
        }
        // console.log(store_code);
        // console.log(document);
        const new_document = await axios({
            method: 'POST',
            url: `${this.REST_BASE_URL}/document`,
            headers: {
                'Auth-Session': this.token.value,
                'Accept': 'application/json, version=2',
            },
            data: [document]
        })
        let doc_sid: string;
        if (new_document.status === 201) {
            doc_sid = new_document.data[0].sid;
        }
        // console.log(doc_sid);
        //Document Item
        let document_items = []
        const findInfoItem = createOrderDTO.ITEMS.map(async (item) => {
            let invn_sbs_item_sid: string = "";
            // console.log(item.PRODUCT_NAME + item.ATTRIBUTE + item.ITEMSIZE);
            let invn = await this.loadInventory(item.PRODUCT_NAME, item.ATTRIBUTE, item.ITEMSIZE);
            // console.log(invn.data);
            if (invn.status === 200) {
                // if (invn.data.data.length === 0) {
                //     console.log('Import items');
                //Import data
                //     let ORIG_PRICE: number = Number(item.ORIG_PRICE);
                //     console.log(ORIG_PRICE)
                //     const importItems = await axios({
                //         method: "POST",
                //         url: `${this.BACK_OFFICE_BASE_URL}/inventory?action=InventorySaveItems`,
                //         headers: {
                //             'Content-Type': 'application/json',
                //             'Accept': 'application/json, version=2',
                //             'Auth-Session': this.token.value
                //         },
                //         data: {
                //             "data": [{ 
                //                 "OriginApplication": "RProPrismWeb", 
                //                 "PrimaryItemDefinition": { 
                //                     "dcssid": "605153064000182141", 
                //                     "vendsid": null, 
                //                     "description1":  "Ecommerce product", 
                //                     "description2": null, 
                //                     "attribute": null, 
                //                     "itemsize": null, 
                //                     "sid": null 
                //                 }, 
                //                 "InventoryItems": [{ 
                //                     "sbssid": "604545061000197257", 
                //                     "dcssid": "605153064000182141", 
                //                     "description1": "Ecommerce product", 
                //                     "text1": item.PRODUCT_NAME,
                //                     "spif": 0, 
                //                     "taxcodesid": 
                //                     "604545110000119580", 
                //                     "useqtydecimals": 0, 
                //                     "regional": false, 
                //                     "active": true, 
                //                     "maxdiscperc1": 100, 
                //                     "maxdiscperc2": 100, 
                //                     "serialtype": 0, 
                //                     "lottype": 0, 
                //                     "activestoresid": "604545062000104261", 
                //                     "activepricelevelsid": "604545109000141555", 
                //                     "activeseasonsid": "604545109000194568", 
                //                     "actstrohqty": 0, 
                //                     "dcscode": "CARLUXXXX", 
                //                     "invnprice": [{ 
                //                         "price": 6, 
                //                         "invnsbsitemsid": 0, 
                //                         "sbssid": "604545061000197257", 
                //                         "pricelvlsid": "604545109000141555", 
                //                         "seasonsid": "604545109000194568" 
                //                     }] 
                //                 }], 
                //                 "UpdateStyleDefinition": false, 
                //                 "UpdateStyleCost": false, 
                //                 "UpdateStylePrice": false 
                //             }]
                //         }
                //     })
                //     invn = await this.loadInventory(item.PRODUCT_NAME);
                // }
                // console.log(invn.data.data.length);
                if (invn.data.data.length === 0) return;
                invn_sbs_item_sid = invn.data.data[0].sid;
                // console.log(invn_sbs_item_sid);
                document_items.push({
                    document_sid: doc_sid,
                    invn_sbs_item_sid,
                    item_type: 1,
                    kit_type: 0,
                    origin_application: "Ecommerce",
                    quantity: item.QUANTITY,
                    manual_disc_type: 2,
                    manual_disc_value: Number(item.ORIG_PRICE) - Number(item.PRICE),
                    manual_disc_reason: null,
                    tax_perc_lock: false
                })
            }
        })
        await Promise.all(findInfoItem);
        //
        // console.log(findInfoItem)
        const doc_items = await axios({
            method: "POST",
            url: `${this.REST_BASE_URL}/document/${doc_sid}/item`,
            headers: {
                'Content-Type': 'application/json',
                'Auth-Session': this.token.value,
                'Accept': 'application/json, version=2',
            },
            data: document_items
        })

        //Coupon
        //  console.log('Create coupon')
        //  console.log(createOrderDTO.COUPON_SID)
        if (createOrderDTO.COUPON_SID !== null && createOrderDTO.COUPON_SID !== "") {
            const couponCode = await this.couponRepository.findOne({ where: { SID: createOrderDTO.COUPON_SID } });
            // console.log(couponCode);
            const coupon = await axios({
                method: "POST",
                url: `${this.REST_BASE_URL}/document/${doc_sid}/coupon`,
                headers: {
                    'Content-Type': 'application/json',
                    'Auth-Session': this.token.value,
                    'Accept': 'application/json, version=2',
                },
                data: [{
                    coupon_code: couponCode.COUPON_NAME,
                    doc_sid: doc_sid,
                    in_or_out: 1,
                    origin_application: 'Ecommerce'
                }]
            })
        }

        // console.log('Update doc_items')

        let doc = await axios({
            method: "GET",
            url: `${this.REST_BASE_URL}/document/${doc_sid}?cols=*`,
            headers: {
                'Content-Type': 'application/json',
                'Auth-Session': this.token.value,
                'Accept': 'application/json, version=2',
            }
        })

        if (Number(createOrderDTO.DISC_AMT) + Number(createOrderDTO.COUPON_VALUE) + Number(createOrderDTO.REDEEM_AMOUNT) > 0) {
            const putDiscount = await axios({
                method: "PUT",
                url: `${this.REST_BASE_URL}/document/${doc_sid}?filter=(row_version,eq,${doc.data[0].row_version})`,
                headers: {
                    'Content-Type': 'application/json',
                    'Auth-Session': this.token.value,
                    'Accept': 'application/json, version=2',
                },
                data: [{
                    manual_disc_type: 2,
                    manual_disc_value: Number(createOrderDTO.DISC_AMT) + Number(createOrderDTO.COUPON_VALUE) + Number(createOrderDTO.REDEEM_AMOUNT),
                    manual_disc_reason: Number(createOrderDTO.REDEEM_AMOUNT) > 0 ? "REDEEM_LOYALTY" : null,
                    manual_order_disc_reason: null
                }]
            })
            if (putDiscount.status === 200)
                doc = putDiscount;
        }


        doc = await axios({
            method: "GET",
            url: `${this.REST_BASE_URL}/document/${doc_sid}?cols=*`,
            headers: {
                'Content-Type': 'application/json',
                'Auth-Session': this.token.value,
                'Accept': 'application/json, version=2',
            }
        })

        let taken_amt: number;
        if (doc.status === 200) {
            taken_amt = doc.data[0].sale_total_amt;
        }

        //Tender 
        const paymentType = Number(createOrderDTO.PAYMENT_METHOD);
        let tender_name: string = "";
        let tender_type: number = 0;
        let card_type_name: string = "";
        if (paymentType === 2) {
            tender_type = 3;
            tender_name = "COD";
        }
        else if (paymentType === 1) {
            tender_name = "Visa/Master/JCB";
            tender_type = 2;
            card_type_name = "Visa";
        }
        else if (paymentType === 3) {
            tender_name = "ATM/Internet Banking";
            tender_type = 2;
            card_type_name = "ATM";
        }
        const tender = await axios({
            method: "POST",
            url: `${this.REST_BASE_URL}/document/${doc_sid}/tender/?sort=created_datetime,asc`,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, version=2',
                'Auth-Session': this.token.value
            },
            data: [{
                document_sid: doc_sid,
                origin_application: "ECommerce",
                taken: Number(taken_amt),
                tender_name: tender_name,
                tender_type: tender_type,
                card_type_name: card_type_name
            }]
        })
        // console.log(tender);
        // console.log(doc_sid);
    }

    async updateCustomer(createOrderDTO: CreateOrderDTO) {
        await this.authenticate();
        const customer = await axios({
            method: "GET",
            url: `${this.API_COMMON_BASE_URL}/customer?cols=*&filter=(custphone.phoneno,eq,${createOrderDTO.S_PHONE})`,
            headers: {
                'Content-Type': 'application/json',
                'Auth-Session': this.token.value,
                'Accept': 'application/json, version=2',
            }
        })
        if (customer.data.data.length === 0) {
            //Update customer
            console.log('Update customer')
            let customer = {
                active: 1,
                firstname: createOrderDTO.S_FIRST_NAME,
                lastname: createOrderDTO.S_LAST_NAME,
                originapplication: "Ecommerce",
                udf1date: createOrderDTO.PICKUP_DATETIME,
                company: createOrderDTO.S_COMPANY,
                custphone: [{
                    originapplication: "Ecommerce",
                    phoneno: createOrderDTO.S_PHONE,
                }],
                custaddress: [{
                    address1: createOrderDTO.S_STREET_ADDRESS,
                    address2: createOrderDTO.S_DISTRICT,
                    adderss3: createOrderDTO.S_CITY,
                    address4: createOrderDTO.S_COUNTRY,
                    originapplication: "Ecommerce"
                }],
                custemail: [{
                    emailaddress: createOrderDTO.EMAIL,
                    originapplication: "Ecommerce"
                }]
            }
            const update = await axios({
                method: "POST",
                url: `${this.API_COMMON_BASE_URL}/customer`,
                headers: {
                    'Auth-Session': this.token.value,
                    'Accept': 'application/json, version=2',
                },
                data: {
                    data: [customer]
                }
            })
            console.log('Customer successfully')
            if (update.status === 200) {
                return update.data.data[0].sid;
            }
        }
        else {
            return customer.data.data[0].sid;
        }
    }

    async getStore() {
        const currentDT = new Date();
        await this.authenticate();
        const crawlHistory = await this.prismCrawlHistoryRepository.findOne({ where: { TABLE_NAME: 'store' } });
        console.log(crawlHistory);
        if (!crawlHistory) {
            const url = `${this.REST_BASE_URL}/store?cols=*`;
            const response = await axios({
                url,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Auth-Session': this.token.value
                }
            })
            let stores: Array<PrismStoreType> = [];
            let storeList: Array<{
                NAME: string,
                STORE_CODE: string,
                CITY: string,
                ADDRESS: string,
                PHONE: string;
            }> = [];
            stores = response.data;
            const getAllStores = stores.map(store => {
                const ADDRESS = store.address1;
                const STORE_CODE = store.store_code;
                const NAME = store.store_name;
                const CITY = store.tax_area_name;
                const PHONE = store.phone1;
                storeList.push({
                    NAME,
                    STORE_CODE,
                    CITY,
                    ADDRESS,
                    PHONE,
                })
                return storeList;
            })
            await Promise.all(getAllStores);
            storeList.map(async store => {
                let createStoreDTO = new CreateStoreDTO();
                createStoreDTO.NAME = store.NAME;
                createStoreDTO.STORE_CODE = store.STORE_CODE;
                createStoreDTO.CITY = store.CITY;
                createStoreDTO.ADDRESS = store.ADDRESS;
                createStoreDTO.PHONE = store.PHONE;
                const response = await axios({
                    url: 'http://localhost:5035/stores/create',
                    method: 'POST',
                    withCredentials: true,
                    data: createStoreDTO,
                })
                const data = response.data;
            })
            const prismCrawlHistory = this.prismCrawlHistoryRepository.create({
                LAST_CRAWL_DATETIME: currentDT,
                TABLE_NAME: 'store',
            });
            await prismCrawlHistory.save();
            return { stores };
        } else {
            const filterDate = moment(new Date(crawlHistory.LAST_CRAWL_DATETIME.toString())).format('YYYY-MM-DDTHH:mm:ss');
            const url = `${this.REST_BASE_URL}/store?cols=*&filter=(modified_datetime,ge,${filterDate})or(created_datetime,ge,${filterDate})`;
            console.log(url);
            const response = await axios({
                url,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Auth-Session': this.token.value
                }
            })
            console.log(response.data);
            let stores: Array<PrismStoreType> = [];
            let storeList: Array<{
                NAME: string,
                STORE_CODE: string,
                CITY: string,
                ADDRESS: string,
                PHONE: string;
            }> = [];
            stores = response.data;
            if (stores.length > 0) {
                const getAllStores = stores.map(store => {
                    const ADDRESS = store.address1;
                    const STORE_CODE = store.store_code;
                    const NAME = store.store_name;
                    const CITY = store.tax_area_name;
                    const PHONE = store.phone1;
                    storeList.push({
                        NAME,
                        STORE_CODE,
                        CITY,
                        ADDRESS,
                        PHONE,
                    })
                    return storeList;
                })
                await Promise.all(getAllStores);
                storeList.map(async store => {
                    const existedStore = await this.storeRepository.findOne({ where: { NAME: store.NAME } });
                    if (!existedStore) {
                        let createStoreDTO = new CreateStoreDTO();
                        createStoreDTO.NAME = store.NAME;
                        createStoreDTO.STORE_CODE = store.STORE_CODE;
                        createStoreDTO.CITY = store.CITY;
                        createStoreDTO.ADDRESS = store.ADDRESS;
                        createStoreDTO.PHONE = store.PHONE;
                        const response = await axios({
                            url: 'http://localhost:5035/stores/create',
                            method: 'POST',
                            withCredentials: true,
                            data: createStoreDTO,
                        })
                        const data = response.data;
                    } else {
                        existedStore.ADDRESS = store.ADDRESS;
                        existedStore.CITY = store.CITY;
                        existedStore.PHONE = store.PHONE
                        const result = await existedStore.save();
                    }
                })
            }
            crawlHistory.LAST_CRAWL_DATETIME = currentDT;
            await crawlHistory.save();
        }
    }

    async getCategories() {
        const currentDT = new Date();
        await this.authenticate();
        const crawlHistory = await this.prismCrawlHistoryRepository.findOne({ where: { TABLE_NAME: 'category' } });
        if (!crawlHistory) {
            const url = `${this.BACK_OFFICE_BASE_URL}/dcs?cols=*`;
            const response = await axios({
                url,
                method: 'GET',
                headers: {
                    'Accept': 'application/json,version=2',
                    'Auth-Session': this.token.value
                }
            })
            let categories: Array<PrismCategoryType> = [];
            let categoryList: Array<{
                CATEGORY_NAME: string,
                CATEGORY_CODE: string,
                LONG_DESCRIPTION: string,
                SHORT_DESCRIPTION: string;
            }> = []
            categories = response.data.data;
            const getAllCategories = categories.map(category => {
                const CATEGORY_NAME = category.dname + ' ' + category.cname + ' ' + category.sname;
                categoryList.push({
                    CATEGORY_NAME,
                    CATEGORY_CODE: category.dcscode,
                    LONG_DESCRIPTION: `This is ${CATEGORY_NAME}`,
                    SHORT_DESCRIPTION: `This is ${CATEGORY_NAME}`,
                })
                return categoryList;
            })
            await Promise.all(getAllCategories);
            categoryList.map(async category => {
                const createCategoryDTO = new CreateCategoryDTO();
                createCategoryDTO.CATEGORY_NAME = category.CATEGORY_NAME;
                createCategoryDTO.CATEGORY_CODE = category.CATEGORY_CODE;
                createCategoryDTO.LONG_DESCRIPTION = category.LONG_DESCRIPTION;
                createCategoryDTO.SHORT_DESCRIPTION = category.SHORT_DESCRIPTION;
                const response = await axios({
                    url: 'http://localhost:5035/categories/create',
                    method: 'POST',
                    withCredentials: true,
                    data: createCategoryDTO,
                })
            })
            const prismCrawlHistory = this.prismCrawlHistoryRepository.create({
                LAST_CRAWL_DATETIME: currentDT,
                TABLE_NAME: 'category',
            });
            await prismCrawlHistory.save();
        } else {
            console.log('start')
            const filterDate = moment(new Date(crawlHistory.LAST_CRAWL_DATETIME.toString())).format('YYYY-MM-DDTHH:mm:ss');
            const url = `${this.BACK_OFFICE_BASE_URL}/dcs?cols=*&filter=(modifieddatetime,ge,${filterDate})or(createddatetime,ge,${filterDate})`;
            console.log(url);
            const response = await axios({
                url,
                method: 'GET',
                headers: {
                    'Accept': 'application/json,version=2',
                    'Auth-Session': this.token.value
                }
            })
            console.log(response);
            let categories: Array<PrismCategoryType> = [];
            let categoryList: Array<{
                CATEGORY_NAME: string,
                CATEGORY_CODE: string,
                LONG_DESCRIPTION: string,
                SHORT_DESCRIPTION: string;
            }> = []
            categories = response.data.data;
            if (categories.length > 0) {
                const getAllCategories = categories.map(category => {
                    const CATEGORY_NAME = category.dname + ' ' + category.cname + ' ' + category.sname;
                    categoryList.push({
                        CATEGORY_NAME,
                        CATEGORY_CODE: category.dcscode,
                        LONG_DESCRIPTION: '',
                        SHORT_DESCRIPTION: '',
                    })
                    return categoryList;
                })
                await Promise.all(getAllCategories);
                categoryList.map(async category => {
                    const existedCategory = await this.categoryRepository.findOne({ where: { CATEGORY_CODE: category.CATEGORY_CODE } });
                    if (!existedCategory) {
                        let createCategoryDTO = new CreateCategoryDTO();
                        createCategoryDTO.CATEGORY_NAME = category.CATEGORY_NAME;
                        createCategoryDTO.CATEGORY_CODE = category.CATEGORY_CODE;
                        createCategoryDTO.LONG_DESCRIPTION = category.LONG_DESCRIPTION;
                        createCategoryDTO.SHORT_DESCRIPTION = category.SHORT_DESCRIPTION;
                        const response = await axios({
                            url: 'http://localhost:5035/categories/create',
                            method: 'POST',
                            withCredentials: true,
                            data: createCategoryDTO,
                        })
                        const data = response.data;
                    } else {
                        existedCategory.CATEGORY_NAME = category.CATEGORY_NAME;
                        existedCategory.LONG_DESCRIPTION = category.LONG_DESCRIPTION;
                        existedCategory.SHORT_DESCRIPTION = category.SHORT_DESCRIPTION;
                        const result = await existedCategory.save();
                    }
                })
            }
            crawlHistory.LAST_CRAWL_DATETIME = currentDT;
            await crawlHistory.save();
        }
    }

    async getBrands() {
        const currentDT = new Date();
        await this.authenticate();
        const crawlHistory = await this.prismCrawlHistoryRepository.findOne({ where: { TABLE_NAME: 'product_brand' } });
        if (!crawlHistory) {
            const url = `${this.BACK_OFFICE_BASE_URL}/vendor?cols=*`;
            const response = await axios({
                url,
                method: 'GET',
                headers: {
                    'Accept': 'application/json,version=2',
                    'Auth-Session': this.token.value
                }
            })
            let brands: Array<{
                vendname: string,
            }> = [];
            let brandList: Array<{
                NAME: string,
            }> = []
            brands = response.data.data;
            const getAllBrands = brands.map(brand => {
                const NAME = brand.vendname;
                brandList.push({
                    NAME,
                })
                return brandList;
            })
            await Promise.all(getAllBrands);
            brandList.map(async brand => {
                const createBrandDTO = new CreateProductBrandDTO();
                createBrandDTO.NAME = brand.NAME;
                const response = await axios({
                    url: 'http://localhost:5035/products/brand/create',
                    method: 'POST',
                    withCredentials: true,
                    data: createBrandDTO,
                })
            })
            const prismCrawlHistory = this.prismCrawlHistoryRepository.create({
                LAST_CRAWL_DATETIME: currentDT,
                TABLE_NAME: 'product_brand',
            });
            await prismCrawlHistory.save();
        } else {
            const filterDate = moment(new Date(crawlHistory.LAST_CRAWL_DATETIME.toString())).format('YYYY-MM-DDTHH:mm:ss');
            const url = `${this.BACK_OFFICE_BASE_URL}/vendor?cols=*&filter=(modifieddatetime,ge,${filterDate})or(createddatetime,ge,${filterDate})`;
            const response = await axios({
                url,
                method: 'GET',
                headers: {
                    'Accept': 'application/json,version=2',
                    'Auth-Session': this.token.value
                }
            })
            let brands: Array<{
                vendname: string,
            }> = [];
            let brandList: Array<{
                NAME: string,
            }> = []
            brands = response.data.data;
            if (brands.length > 0) {
                const getAllBrands = brands.map(brand => {
                    const NAME = brand.vendname;
                    brandList.push({
                        NAME,
                    })
                    return brandList;
                })
                await Promise.all(getAllBrands);
                brandList.map(async brand => {
                    const existedBrand = await this.productBrandRepository.findOne({ where: { NAME: brand.NAME } });
                    if (!existedBrand) {
                        let createBrandDTO = new CreateProductBrandDTO();
                        createBrandDTO.NAME = brand.NAME;
                        const response = await axios({
                            url: 'http://localhost:5035/products/brand/create',
                            method: 'POST',
                            withCredentials: true,
                            data: createBrandDTO,
                        })
                        const data = response.data;
                    }
                })
            }
            crawlHistory.LAST_CRAWL_DATETIME = currentDT;
            await crawlHistory.save();
        }
    }

    async getProductInformation() {
        const currentDT = new Date();
        await this.authenticate();
        const crawlHistory = await this.prismCrawlHistoryRepository.findOne({ where: { TABLE_NAME: 'product_information' } });
        if (!crawlHistory) {

            const url = `${this.REST_BASE_URL}/inventory?cols=*,sbsinventoryqty.*,sbsinventorystoreqty.*,sbsinventoryactiveprice.*`;
            const response = await axios({
                url,
                method: 'GET',
                headers: {
                    'Accept': 'application/json,version=2',
                    'Auth-Session': this.token.value
                }
            })
            let datas: Array<PrismInventoryType> = [];
            datas = response.data;
            let productInformationList: Array<ImportedProductType> = [];
            const getProductInfos = datas.map(async (data, i) => {
                const PRODUCT_NAME = data.description1;
                const SKU = PRODUCT_NAME.split(' ')[0].substr(0, 2) + i.toString() + PRODUCT_NAME.split(' ')[1].substr(0, 2);
                const price = data.active_price;
                let SHORT_DESCRIPTION = "";
                if (data.description) {
                    SHORT_DESCRIPTION = data.description;
                } else {
                    SHORT_DESCRIPTION = `Default short des`;
                }
                let LONG_DESCRIPTION = "";
                if (data.longdescription) {
                    LONG_DESCRIPTION = data.description;
                } else {
                    LONG_DESCRIPTION = `Default short des`;
                }
                const CATEGORY_CODE = data.dcs_code;
                const category = await this.categoryRepository.findOne({ where: { CATEGORY_CODE } });
                const brandName = data.vendor_name;
                const brand = await this.productBrandRepository.findOne({ where: { NAME: brandName } });
                const BRAND_SID = brand.SID;
                const CATEGORY_SID = category.SID;
                const dscode = data.dcs_code;
                const color = data.attribute;
                const size = data.item_size;
                const qty = data.sbsinventoryqtys.reduce((total, inv) => total + inv.quantity, 0);
                const imagePath = data.image_path.replace(/\\/g, '/');
                const imageName = data.image_path.replace(/\\/g, '').replace('inventory', '') + data.inventory_item_uid.substring(1, data.inventory_item_uid.length);
                const fileType = '.jpg';
                const IMAGE1_URL = data.image_path + '\\' + imageName + fileType;
                const IMAGE2_URL = data.image_path + '\\' + imageName + + '%232' + fileType;
                const IMAGE3_URL = data.image_path + '\\' + imageName + + '%233' + fileType;
                let THRESHOLD = 0;
                if (data.sbsinventoryqtys.length > 0) {
                    THRESHOLD = data.sbsinventoryqtys[0].minimum_quantity;
                }
                let PRODUCT_GENDER: 'Women' | 'Men' | 'Both' = 'Both';
                if (dscode.toString().includes('WOM')) {
                    PRODUCT_GENDER = 'Women'
                } else if (dscode.toString().includes('MEN')) {
                    PRODUCT_GENDER = 'Men'
                }
                const productInfo: ImportedProductType = {
                    PRODUCT_NAME,
                    SKU,
                    SHORT_DESCRIPTION,
                    LONG_DESCRIPTION,
                    LONG_DESCRIPTION_TEXT: LONG_DESCRIPTION,
                    SHORT_DESCRIPTION_TEXT: SHORT_DESCRIPTION,
                    PRODUCT_GENDER,
                    TAX: 0,
                    SID_BRAND: BRAND_SID,
                    PRICE: price,
                    THRESHOLD,
                    CATEGORY_SID,
                    options: [
                        {
                            groupAttributeValue: color,
                            subAttributeValue: size,
                            QTY: qty,
                            UPC: data.upc,
                            IMAGE1_URL,
                            IMAGE2_URL,
                            IMAGE3_URL
                        }
                    ]
                }
                if (color) {
                    if (productInformationList.length === 0) {
                        productInformationList.push(productInfo);
                    } else {
                        if (productInformationList.filter(product => product.PRODUCT_NAME === PRODUCT_NAME).length === 0) {
                            productInformationList.push(productInfo);
                        } else {
                            productInformationList.filter(product => product.PRODUCT_NAME === PRODUCT_NAME)[0].options.push({
                                groupAttributeValue: color,
                                subAttributeValue: size,
                                QTY: qty,
                                UPC: data.upc,
                                IMAGE1_URL,
                                IMAGE2_URL,
                                IMAGE3_URL
                            })
                        }
                    }
                }
                return productInformationList;
            });
            await Promise.all(getProductInfos);
            for (let i = 0; i < productInformationList.length; i++) {
                const createProductInformationDTO = new CreateProductInformationDTO();
                createProductInformationDTO.PRODUCT_NAME = productInformationList[i].PRODUCT_NAME;
                createProductInformationDTO.SKU = productInformationList[i].SKU;
                createProductInformationDTO.SID_BRAND = productInformationList[i].SID_BRAND;
                createProductInformationDTO.PRODUCT_GENDER = productInformationList[i].PRODUCT_GENDER;
                createProductInformationDTO.LONG_DESCRIPTION = productInformationList[i].LONG_DESCRIPTION;
                createProductInformationDTO.LONG_DESCRIPTION_TEXT = productInformationList[i].LONG_DESCRIPTION_TEXT;
                createProductInformationDTO.SHORT_DESCRIPTION = productInformationList[i].SHORT_DESCRIPTION;
                createProductInformationDTO.SHORT_DESCRIPTION_TEXT = productInformationList[i].SHORT_DESCRIPTION_TEXT;
                createProductInformationDTO.UNIT_PRICE = productInformationList[i].PRICE;
                createProductInformationDTO.TAX = productInformationList[i].TAX;
                createProductInformationDTO.THRESHOLD = productInformationList[i].THRESHOLD;
                createProductInformationDTO.DISCOUNT = 0;
                const createProductInformationResponse = await axios({
                    url: 'http://localhost:5035/products/product-information/create',
                    method: 'POST',
                    withCredentials: true,
                    data: createProductInformationDTO
                })
                const createProductInformationResult = createProductInformationResponse.data;
                if (!createProductInformationResult.error) {
                    const productInformation: ProductInformationType = createProductInformationResult.productInformation;
                    const body = {
                        CATEGORY_ID_ARRAY: [productInformationList[i].CATEGORY_SID],
                        SID_PRODUCT: productInformation.SID,
                    }
                    const addCategoryForProductResponse = await axios({
                        url: `http://localhost:5035/products/add-categories`,
                        method: 'POST',
                        data: body,
                        withCredentials: true,
                    });
                    const addCategoryForProductResult = addCategoryForProductResponse.data;
                    if (addCategoryForProductResult.success.length > 0) {
                        for (let y = 0; y < productInformationList[i].options.length; y++) {
                            const createProductInfo = {
                                QTY: productInformationList[i].options[y].QTY,
                                SID_PRODUCT_INFORMATION: productInformation.SID,
                                UPC: productInformationList[i].options[y].UPC,
                            }
                            const createProductResponse = await axios({
                                url: `http://localhost:5035/products/product/create`,
                                method: 'POST',
                                data: createProductInfo,
                                withCredentials: true,
                            })
                            let createProductResult = createProductResponse.data;
                            if (!createProductResult.error) {
                                const product: ProductType = createProductResult.product;
                                const addImagesToProductResponse = await axios({
                                    url: `http://localhost:5035/products/add-prism-images/${product.SID}`,
                                    method: 'POST',
                                    withCredentials: true,
                                    data: {
                                        IMAGE1_URL: productInformationList[i].options[y].IMAGE1_URL,
                                        IMAGE2_URL: productInformationList[i].options[y].IMAGE2_URL,
                                        IMAGE3_URL: productInformationList[i].options[y].IMAGE3_URL
                                    }
                                })
                                const createAttributeGroupResponse = await axios({
                                    url: `http://localhost:5035/products/attribute-group/create`,
                                    method: 'POST',
                                    data: {
                                        GROUP_ATTRIBUTE_ID: 1,
                                        PRODUCT_INFORMATION_SID: productInformation.SID,
                                        GROUP_VALUE_VARCHAR: productInformationList[i].options[y].groupAttributeValue
                                    },
                                    withCredentials: true,
                                })
                                const createAttributeGroupResult = createAttributeGroupResponse.data;
                                if (!createAttributeGroupResult.error) {
                                    let attributeGroup: ProductAttributeGroupType = createAttributeGroupResult.newAttributeGroup;
                                    const createAttributeValueResponse = await axios({
                                        url: `http://localhost:5035/products/attribute-value/create`,
                                        method: 'POST',
                                        data: {
                                            SID_PRODUCT: product.SID,
                                            PRODUCT_ATTRIBUTE_ID: 2,
                                            PRODUCT_ATTRIBUTE_GROUP_ID: attributeGroup.ID,
                                            VALUE_VARCHAR: productInformationList[i].options[y].subAttributeValue
                                        },
                                        withCredentials: true,
                                    })
                                    let newAttributeValue: ProductAttributeType;
                                    const createAttributeValueResult = createAttributeValueResponse.data;
                                    if (!createAttributeValueResult.error) {
                                        newAttributeValue = createAttributeValueResult.newAttributeValue;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            const prismCrawlHistory = this.prismCrawlHistoryRepository.create({
                LAST_CRAWL_DATETIME: currentDT,
                TABLE_NAME: 'product_information',
            });
            await prismCrawlHistory.save();
            return { datas };
        } else {
            console.log(true);
            const filterDate = moment(new Date(crawlHistory.LAST_CRAWL_DATETIME.toString())).format('YYYY-MM-DDTHH:mm:ss');
            const url = `${this.REST_BASE_URL}/inventory?cols=*,sbsinventoryqty.*,sbsinventorystoreqty.*,sbsinventoryactiveprice.*&filter=(modified_datetime,ge,${filterDate})or(created_datetime,ge,${filterDate})`;
            const response = await axios({
                url,
                method: 'GET',
                headers: {
                    'Accept': 'application/json,version=2',
                    'Auth-Session': this.token.value
                }
            })
            let datas: Array<PrismInventoryType> = [];
            datas = response.data;
            if (datas.length > 0) {
                let productInformationList: Array<ImportedProductType> = [];
                const getProductInfos = datas.map(async (data, i) => {
                    const PRODUCT_NAME = data.description1;
                    const SKU = PRODUCT_NAME.split(' ')[0].substr(0, 2) + i.toString() + PRODUCT_NAME.split(' ')[1].substr(0, 2);
                    const price = data.active_price;
                    let SHORT_DESCRIPTION = "";
                    if (data.description) {
                        SHORT_DESCRIPTION = data.description;
                    } else {
                        SHORT_DESCRIPTION = `Default short des`;
                    }
                    let LONG_DESCRIPTION = "";
                    if (data.longdescription) {
                        LONG_DESCRIPTION = data.description;
                    } else {
                        LONG_DESCRIPTION = `Default short des`;
                    }
                    const CATEGORY_CODE = data.dcs_code;
                    const category = await this.categoryRepository.findOne({ where: { CATEGORY_CODE } });
                    const brandName = data.vendor_name;
                    const brand = await this.productBrandRepository.findOne({ where: { NAME: brandName } });
                    const BRAND_SID = brand.SID;
                    const CATEGORY_SID = category.SID;
                    const dscode = data.dcs_code;
                    const color = data.attribute;
                    const size = data.item_size;
                    const qty = data.sbsinventoryqtys.reduce((total, inv) => total + inv.quantity, 0);
                    const imagePath = data.image_path.replace(/\\/g, '/');
                    const imageName = data.image_path.replace(/\\/g, '').replace('inventory', '') + data.inventory_item_uid.substring(1, data.inventory_item_uid.length);
                    const fileType = '.jpg';
                    const IMAGE1_URL = data.image_path + '\\' + imageName + fileType;
                    const IMAGE2_URL = data.image_path + '\\' + imageName + + '%232' + fileType;
                    const IMAGE3_URL = data.image_path + '\\' + imageName + + '%233' + fileType;
                    let THRESHOLD = 0;
                    if (data.sbsinventoryqtys.length > 0) {
                        THRESHOLD = data.sbsinventoryqtys[0].minimum_quantity;
                    }
                    let PRODUCT_GENDER: 'Women' | 'Men' | 'Both' = 'Both';
                    if (dscode.toString().includes('WOM')) {
                        PRODUCT_GENDER = 'Women'
                    } else if (dscode.toString().includes('')) {
                        PRODUCT_GENDER = 'Men'
                    }
                    const productInfo: ImportedProductType = {
                        PRODUCT_NAME,
                        SKU,
                        SHORT_DESCRIPTION,
                        LONG_DESCRIPTION,
                        LONG_DESCRIPTION_TEXT: LONG_DESCRIPTION,
                        SHORT_DESCRIPTION_TEXT: SHORT_DESCRIPTION,
                        PRODUCT_GENDER,
                        TAX: 0,
                        SID_BRAND: BRAND_SID,
                        PRICE: price,
                        THRESHOLD,
                        CATEGORY_SID,
                        options: [
                            {
                                groupAttributeValue: color,
                                subAttributeValue: size,
                                QTY: qty,
                                UPC: data.upc,
                                IMAGE1_URL,
                                IMAGE2_URL,
                                IMAGE3_URL
                            }
                        ]
                    }
                    if (color) {
                        if (productInformationList.length === 0) {
                            productInformationList.push(productInfo);
                        } else {
                            if (productInformationList.filter(product => product.PRODUCT_NAME === PRODUCT_NAME).length === 0) {
                                productInformationList.push(productInfo);
                            } else {
                                productInformationList.filter(product => product.PRODUCT_NAME === PRODUCT_NAME)[0].options.push({
                                    groupAttributeValue: color,
                                    subAttributeValue: size,
                                    QTY: qty,
                                    UPC: data.upc,
                                    IMAGE1_URL,
                                    IMAGE2_URL,
                                    IMAGE3_URL
                                })
                            }
                        }
                    }
                    return productInformationList;
                });
                await Promise.all(getProductInfos);

                for (let i = 0; i < productInformationList.length; i++) {
                    const SKU = productInformationList[i].SKU;
                    const PRODUCT_NAME = productInformationList[i].PRODUCT_NAME;
                    const existedProductInformation = await this.productInformationRepository.findOne({ where: { PRODUCT_NAME } });
                    console.log(existedProductInformation);
                    if (!existedProductInformation) {
                        const createProductInformationDTO = new CreateProductInformationDTO();
                        createProductInformationDTO.PRODUCT_NAME = productInformationList[i].PRODUCT_NAME;
                        createProductInformationDTO.SKU = productInformationList[i].SKU;
                        createProductInformationDTO.SID_BRAND = productInformationList[i].SID_BRAND;
                        createProductInformationDTO.PRODUCT_GENDER = productInformationList[i].PRODUCT_GENDER;
                        createProductInformationDTO.LONG_DESCRIPTION = productInformationList[i].LONG_DESCRIPTION;
                        createProductInformationDTO.LONG_DESCRIPTION_TEXT = productInformationList[i].LONG_DESCRIPTION_TEXT;
                        createProductInformationDTO.SHORT_DESCRIPTION = productInformationList[i].SHORT_DESCRIPTION;
                        createProductInformationDTO.SHORT_DESCRIPTION_TEXT = productInformationList[i].SHORT_DESCRIPTION_TEXT;
                        createProductInformationDTO.UNIT_PRICE = productInformationList[i].PRICE;
                        createProductInformationDTO.TAX = productInformationList[i].TAX;
                        createProductInformationDTO.THRESHOLD = productInformationList[i].THRESHOLD;
                        createProductInformationDTO.DISCOUNT = 0;
                        const createProductInformationResponse = await axios({
                            url: 'http://localhost:5035/products/product-information/create',
                            method: 'POST',
                            withCredentials: true,
                            data: createProductInformationDTO
                        })
                        const createProductInformationResult = createProductInformationResponse.data;
                        if (!createProductInformationResult.error) {
                            const productInformation: ProductInformationType = createProductInformationResult.productInformation;
                            console.log('1135:' + productInformation.SID);
                            const body = {
                                CATEGORY_ID_ARRAY: [productInformationList[i].CATEGORY_SID],
                                SID_PRODUCT: productInformation.SID,
                            }
                            const addCategoryForProductResponse = await axios({
                                url: `http://localhost:5035/products/add-categories`,
                                method: 'POST',
                                data: body,
                                withCredentials: true,
                            });
                            const addCategoryForProductResult = addCategoryForProductResponse.data;
                            if (addCategoryForProductResult.success.length > 0) {
                                for (let y = 0; y < productInformationList[i].options.length; y++) {
                                    const createProductInfo = {
                                        QTY: productInformationList[i].options[y].QTY,
                                        SID_PRODUCT_INFORMATION: productInformation.SID,
                                        UPC: productInformationList[i].options[y].UPC,
                                    }
                                    const createProductResponse = await axios({
                                        url: `http://localhost:5035/products/product/create`,
                                        method: 'POST',
                                        data: createProductInfo,
                                        withCredentials: true,
                                    })
                                    let createProductResult = createProductResponse.data;
                                    if (!createProductResult.error) {
                                        const product: ProductType = createProductResult.product;
                                        const addImagesToProductResponse = await axios({
                                            url: `http://localhost:5035/products/add-prism-images/${product.SID}`,
                                            method: 'POST',
                                            withCredentials: true,
                                            data: {
                                                IMAGE1_URL: productInformationList[i].options[y].IMAGE1_URL,
                                                IMAGE2_URL: productInformationList[i].options[y].IMAGE2_URL,
                                                IMAGE3_URL: productInformationList[i].options[y].IMAGE3_URL
                                            }
                                        })
                                        const createAttributeGroupResponse = await axios({
                                            url: `http://localhost:5035/products/attribute-group/create`,
                                            method: 'POST',
                                            data: {
                                                GROUP_ATTRIBUTE_ID: 1,
                                                PRODUCT_INFORMATION_SID: productInformation.SID,
                                                GROUP_VALUE_VARCHAR: productInformationList[i].options[y].groupAttributeValue
                                            },
                                            withCredentials: true,
                                        })
                                        const createAttributeGroupResult = createAttributeGroupResponse.data;
                                        if (!createAttributeGroupResult.error) {
                                            let attributeGroup: ProductAttributeGroupType = createAttributeGroupResult.newAttributeGroup;
                                            console.log('1186:' + product.SID);
                                            const createAttributeValueResponse = await axios({
                                                url: `http://localhost:5035/products/attribute-value/create`,
                                                method: 'POST',
                                                data: {
                                                    SID_PRODUCT: product.SID,
                                                    PRODUCT_ATTRIBUTE_ID: 2,
                                                    PRODUCT_ATTRIBUTE_GROUP_ID: attributeGroup.ID,
                                                    VALUE_VARCHAR: productInformationList[i].options[y].subAttributeValue
                                                },
                                                withCredentials: true,
                                            })
                                            let newAttributeValue: ProductAttributeType;
                                            const createAttributeValueResult = createAttributeValueResponse.data;
                                            if (!createAttributeValueResult.error) {
                                                newAttributeValue = createAttributeValueResult.newAttributeValue;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        try {
                            await this.productInformationRepository
                                .createQueryBuilder('product_information')
                                .update()
                                .set({
                                    SHORT_DESCRIPTION: productInformationList[i].SHORT_DESCRIPTION,
                                    SHORT_DESCRIPTION_TEXT: productInformationList[i].SHORT_DESCRIPTION_TEXT,
                                    LONG_DESCRIPTION: productInformationList[i].LONG_DESCRIPTION,
                                    LONG_DESCRIPTION_TEXT: productInformationList[i].LONG_DESCRIPTION_TEXT,
                                })
                                .where(`product_information.PRODUCT_NAME='${productInformationList[i].PRODUCT_NAME}'`)
                                .execute();
                        } catch (error) {
                            console.log(error);
                        }
                        const newProductInfoPrice = this.productPriceRepository.create({
                            UNIT_PRICE: productInformationList[i].PRICE,
                            SID_PRODUCT_INFORMATION: existedProductInformation.SID,
                        });
                        await newProductInfoPrice.save();

                        for (let h = 0; h < productInformationList[i].options.length; h++) {
                            const currentOption = productInformationList[i].options[h];
                            const color = currentOption.groupAttributeValue;
                            const size = currentOption.subAttributeValue;
                            if (existedProductInformation.productAttributeGroups.filter(
                                group => group.GROUP_VALUE_VARCHAR === color).length > 0) {
                                const exixtedAttributeGroup = existedProductInformation.productAttributeGroups.filter(
                                    group => group.GROUP_VALUE_VARCHAR === color)[0];
                                if (exixtedAttributeGroup.productAttributeValues.filter(attributeValue =>
                                    attributeValue.VALUE_VARCHAR === size).length === 0) {
                                    const createProductInfo = {
                                        QTY: currentOption.QTY,
                                        SID_PRODUCT_INFORMATION: existedProductInformation.SID,
                                        UPC: currentOption.UPC,
                                    }
                                    const createProductResponse = await axios({
                                        url: `http://localhost:5035/products/product/create`,
                                        method: 'POST',
                                        data: createProductInfo,
                                        withCredentials: true,
                                    })
                                    let createProductResult = createProductResponse.data;
                                    if (!createProductResult.error) {
                                        const product: ProductType = createProductResult.product;
                                        const addImagesToProductResponse = await axios({
                                            url: `http://localhost:5035/products/add-prism-images/${product.SID}`,
                                            method: 'POST',
                                            withCredentials: true,
                                            data: {
                                                IMAGE1_URL: currentOption.IMAGE1_URL,
                                                IMAGE2_URL: currentOption.IMAGE2_URL,
                                                IMAGE3_URL: currentOption.IMAGE3_URL
                                            }
                                        })
                                        let attributeGroup: ProductAttributeGroupType = exixtedAttributeGroup;
                                        console.log('1253: ' + product.SID);
                                        const createAttributeValueResponse = await axios({
                                            url: `http://localhost:5035/products/attribute-value/create`,
                                            method: 'POST',
                                            data: {
                                                SID_PRODUCT: product.SID,
                                                PRODUCT_ATTRIBUTE_ID: 2,
                                                PRODUCT_ATTRIBUTE_GROUP_ID: attributeGroup.ID,
                                                VALUE_VARCHAR: size,
                                            },
                                            withCredentials: true,
                                        })
                                        let newAttributeValue: ProductAttributeType;
                                        const createAttributeValueResult = createAttributeValueResponse.data;
                                        if (!createAttributeValueResult.error) {
                                            newAttributeValue = createAttributeValueResult.newAttributeValue;
                                        }
                                    }
                                } else {
                                    const existedProduct = exixtedAttributeGroup.productAttributeValues.filter(attributeValue =>
                                        attributeValue.VALUE_VARCHAR === size)[0].product;
                                    existedProduct.images.forEach(async (image, i: number) => {
                                        image.PRISM_URL = currentOption[`IMAGE${i + 1}_URL`];
                                        try {
                                            await image.save();
                                        } catch (error) {
                                            console.log(error);
                                        }
                                    })
                                }
                            } else {
                                const createProductInfo = {
                                    QTY: currentOption.QTY,
                                    SID_PRODUCT_INFORMATION: existedProductInformation.SID,
                                    UPC: currentOption.UPC,
                                }
                                const createProductResponse = await axios({
                                    url: `http://localhost:5035/products/product/create`,
                                    method: 'POST',
                                    data: createProductInfo,
                                    withCredentials: true,
                                })
                                let createProductResult = createProductResponse.data;
                                if (!createProductResult.error) {
                                    const product: ProductType = createProductResult.product;
                                    const addImagesToProductResponse = await axios({
                                        url: `http://localhost:5035/products/add-prism-images/${product.SID}`,
                                        method: 'POST',
                                        withCredentials: true,
                                        data: {
                                            IMAGE1_URL: currentOption.IMAGE1_URL,
                                            IMAGE2_URL: currentOption.IMAGE2_URL,
                                            IMAGE3_URL: currentOption.IMAGE3_URL
                                        }
                                    })
                                    const createAttributeGroupResponse = await axios({
                                        url: `http://localhost:5035/products/attribute-group/create`,
                                        method: 'POST',
                                        data: {
                                            GROUP_ATTRIBUTE_ID: 1,
                                            PRODUCT_INFORMATION_SID: existedProductInformation.SID,
                                            GROUP_VALUE_VARCHAR: color,
                                        },
                                        withCredentials: true,
                                    })
                                    const createAttributeGroupResult = createAttributeGroupResponse.data;
                                    if (!createAttributeGroupResult.error) {
                                        let attributeGroup: ProductAttributeGroupType = createAttributeGroupResult.newAttributeGroup;
                                        console.log('1310:' + product.SID);
                                        const createAttributeValueResponse = await axios({
                                            url: `http://localhost:5035/products/attribute-value/create`,
                                            method: 'POST',
                                            data: {
                                                SID_PRODUCT: product.SID,
                                                PRODUCT_ATTRIBUTE_ID: 2,
                                                PRODUCT_ATTRIBUTE_GROUP_ID: attributeGroup.ID,
                                                VALUE_VARCHAR: size,
                                            },
                                            withCredentials: true,
                                        })
                                        let newAttributeValue: ProductAttributeType;
                                        const createAttributeValueResult = createAttributeValueResponse.data;
                                        if (!createAttributeValueResult.error) {
                                            newAttributeValue = createAttributeValueResult.newAttributeValue;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            crawlHistory.LAST_CRAWL_DATETIME = currentDT;
            await crawlHistory.save();
        }
    }

    async getStoresQty(upc: string) {
        await this.authenticate();
        const url = `${this.BACK_OFFICE_BASE_URL}/inventory?cols=invnquantity.storecode,invnquantity.qty,invnquantity.MinQty&filter=(upc,eq,${parseInt(upc)})`;
        const response = await axios({
            url,
            method: 'GET',
            headers: {
                'Accept': 'application/json,version=2',
                'Auth-Session': this.token.value
            }
        })
        const data = response.data;
        let storesQty: Array<{
            storecode: string,
            qty: number,
            minqty: number,
        }> = [];
        const getStoresQty = data.data[0].invnquantity.map((store: any) => {
            storesQty.push({
                storecode: store.storecode,
                qty: store.qty,
                minqty: store.minqty
            })
        });
        await Promise.all(getStoresQty);
        console.log(storesQty);
        return { storesQty: storesQty };
    }
}