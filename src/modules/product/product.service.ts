import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, getManager, getConnection, DeleteResult, Not, In } from "typeorm";
import AddCategoriesForProductDTO from "./dto/add-categories-for-product.dto";
import Product from "./product.entity";
import ProductCategory from "./product_category.entity";
import { CategoryType, FailAddedCategoryIdType, ProductAttributeType, DiscountPromotionType, ProductAttributeValueType, ProductBrandType, ProductImageType, ProductInformationType, ProductType, SizesType } from "../../types/types";
import ProductImage from "./product_image.entity";
import validator from "validator";
import SearchTerm from "./search_term.entity";
import ProductInformation from "./product_information.entity";
import CreateProductInformationDTO from "./dto/create-product-information.dto";
import ProductPrice from "./product_price.entity";
import CreateProductBrandDTO from "./dto/create-product-brand.dto";
import ProductBrand from "./product_brand.entity";
import CreateProductDTO from "./dto/create-product.dto";
import ProductAttribute from "./product_attribute.entity";
import ProductAttributeGroup from "./product_attribute_group.entity";
import ProductAttributeSet from "./product_attribute_set.entity";
import CreateAttributeSetDTO from "./dto/create-attribute-set.dto";
import ProductAttributeValue from "./product_attribute_value.entity";
import CreateAttributeGroupDTO from "./dto/create-attribute-group.dto";
import CreateAttributeValueDTO from "./dto/create-attribute-value.dto";
import * as path from 'path';
import { promises } from 'fs';
import CreateAttributeDTO from "./dto/create-attribute.dto";
import UpdateProductInformationDTO from "./dto/update-product-info.dto";
import UpdateProductDTO from "./dto/update-product.dto";
import InventoryHistory from "./inventory_history.entity";
import Category from "../category/category.entity";
import * as moment from 'moment'
import AddPrismImagesDTO from "./dto/add-prism-images.dto";
import UpdatePrismQtyDTO from "./dto/update-prism-qty.dto";
import Order from "../order/order.entity";
import axios from "axios";

@Injectable()
export default class ProductService {
    constructor(
        @InjectRepository(Product) private productRepository: Repository<Product>,
        @InjectRepository(ProductInformation) private productInformationRepository: Repository<ProductInformation>,
        @InjectRepository(ProductPrice) private productPriceRepository: Repository<ProductPrice>,
        @InjectRepository(ProductAttribute) private productAttributeRepository: Repository<ProductAttribute>,
        @InjectRepository(ProductAttributeGroup) private productAttributeGroupRepository: Repository<ProductAttributeGroup>,
        @InjectRepository(ProductAttributeSet) private productAttributeSetRepository: Repository<ProductAttributeSet>,
        @InjectRepository(ProductAttributeValue) private productAttributeValueRepository: Repository<ProductAttributeValue>,
        @InjectRepository(ProductCategory) private productCategoryRepository: Repository<ProductCategory>,
        @InjectRepository(ProductImage) private productImageRepository: Repository<ProductImage>,
        @InjectRepository(ProductBrand) private productBrandRepository: Repository<ProductBrand>,
        @InjectRepository(SearchTerm) private searchTermRepository: Repository<SearchTerm>,
        @InjectRepository(InventoryHistory) private inventoryHistoryRepository: Repository<InventoryHistory>,
        @InjectRepository(Category) private categoryRepository: Repository<Category>,
        @InjectRepository(Order) private orderRepository: Repository<Order>,
    ) { }

    async createNewProductInformation(createProductInformationDTO: CreateProductInformationDTO) {
        try {
            const newProductInformation = this.productInformationRepository.create(createProductInformationDTO);
            await newProductInformation.save();
            const { UNIT_PRICE, TAX, DISCOUNT } = createProductInformationDTO;
            const newProductPrice = this.productPriceRepository.create({ UNIT_PRICE, TAX, DISCOUNT, SID_PRODUCT_INFORMATION: newProductInformation.SID });
            await newProductPrice.save();
            return {
                productInformation: newProductInformation,
            }
        } catch (error) {
            return { error: error };
        }
    }

    async createNewProduct(createNewProductDTO: CreateProductDTO) {
        try {
            const newProduct = this.productRepository.create(createNewProductDTO);
            await newProduct.save();
            const newInventoryHistory = this.inventoryHistoryRepository.create({
                QTY: newProduct.QTY,
                ORIGINAL_QTY: 0,
                PRODUCT_SID: newProduct.SID
            });
            await newInventoryHistory.save();
            return { product: newProduct };
        } catch (error) {
            return { error };
        }
    }

    async createProductBrand(createProductBrandDTO: CreateProductBrandDTO) {
        try {
            const newBrand = this.productBrandRepository.create(createProductBrandDTO);
            await newBrand.save();
            return {
                productBrand: newBrand,
            }
        } catch (error) {
            return { error }
        }
    }

    async getAllProducts() {
        const allProducts = await this.productInformationRepository.find();
        return { allProducts };
    }

    async findProducts(query: any, role: string) {
        let conditionalQuery: string;
        conditionalQuery = '';
        const q = query.q;
        const take = 4;
        const skip = (query.page - 1) * take;
        delete query.q;
        delete query.page;
        let queries: Array<string>;
        let groupAttributeQuery: string;
        let brandQuery: string;
        let categoryQuery: string;
        groupAttributeQuery = '';
        brandQuery = '';
        categoryQuery = '';
        queries = [];
        for (const property in query) {
            if (property.toString().includes('brand_sid')) {
                if (query[property].split(' ').length > 1) {
                    const values = query[property].split(' ');
                    for (let i = 0; i < values.length; i++) {
                        if (i === values.length - 1) {
                            brandQuery += `productBrand.SID='${values[i]}'`;
                        } else {
                            brandQuery += `productBrand.SID='${values[i]}' OR `;
                        }
                    }
                } else {
                    brandQuery = `productBrand.SID='${query[property]}'`;
                }
            }
            if (property.toString().includes('category_sid')) {
                if (query[property].split(' ').length > 1) {
                    const values = query[property].split(' ');
                    for (let i = 0; i < values.length; i++) {
                        if (i === values.length - 1) {
                            categoryQuery += `category.SID='${values[i]}'`;
                        } else {
                            categoryQuery += `category.SID='${values[i]}' OR `;
                        }
                    }
                } else {
                    categoryQuery = `category.SID='${query[property]}'`;
                }
            }
            if (property.toString().includes('patb')) {
                const attributeType = property.toString().split('_')[1];
                const attributeId = property.toString().split('_')[2];
                let value = query[property] + '';
                if (value.split(' ').length === 1) {
                    const attribute = await this.productAttributeRepository.findOne({ where: { ID: parseInt(attributeId) } });
                    const valueType = attribute.VALUE_TYPE;
                    let parsedValue: any;
                    parsedValue = null;
                    if (valueType === 'INT') parsedValue = parseInt(value);
                    if (valueType === 'DECIMAL') parsedValue = parseFloat(value);
                    if (valueType === 'VARCHAR') parsedValue = "'" + value + "'";
                    if (attributeType.toString() === 'm') {
                        groupAttributeQuery = `productAttributeGroups.GROUP_VALUE_${valueType}=${parsedValue} AND productAttributeGroups.GROUP_ATTRIBUTE_ID=${attributeId}`;
                    } else {
                        queries.push(`productAttributeValues.PRODUCT_ATTRIBUTE_ID=${attributeId} AND productAttributeValues.VALUE_${valueType}=${parsedValue}`);
                    }
                } else {
                    const values = value.split(' ');
                    for (let i = 0; i < values.length; i++) {
                        const attribute = await this.productAttributeRepository.findOne({ where: { ID: parseInt(attributeId) } });
                        const valueType = attribute.VALUE_TYPE;
                        let parsedValue: any;
                        parsedValue = null;
                        if (valueType === 'INT') parsedValue = parseInt(values[i]);
                        if (valueType === 'DECIMAL') parsedValue = parseFloat(values[i]);
                        if (valueType === 'VARCHAR') parsedValue = "'" + values[i] + "'";
                        if (i === values.length - 1) {
                            queries.push(`(productAttributeValues.PRODUCT_ATTRIBUTE_ID=${attributeId} AND productAttributeValues.VALUE_${valueType}=${parsedValue})`);
                        } else {
                            queries.push(`(productAttributeValues.PRODUCT_ATTRIBUTE_ID=${attributeId} AND productAttributeValues.VALUE_${valueType}=${parsedValue}) OR `);
                        }
                    }
                }
            }
        }
        if (queries.length > 0) {
            for (let i = 0; i < queries.length; i++) {
                if (i === queries.length - 1) {
                    conditionalQuery += queries[i]
                } else {
                    conditionalQuery += `${queries[i]} OR `;
                }
            }
        }
        let sortField: string;
        let sortOption: 'ASC' | 'DESC';
        sortField = 'product_information.CREATED_DATETIME';
        sortOption = 'DESC';
        if (query.sort) {
            const field = query.sort.split(' ')[0];
            const option = query.sort.split(' ')[1];
            switch (field) {
                case 'price':
                    sortField = 'productPrices.UNIT_PRICE';
                    break;
                case 'newest':
                    sortField = 'product_information.CREATED_DATETIME';
                    break;
                default:
                    sortField = 'productPrices.CREATED_DATETIME';
                    break;
            }
            switch (option) {
                case 'asc':
                    sortOption = 'ASC';
                    break;
                case 'desc':
                    sortOption = 'DESC';
                    break;
                default:
                    sortOption = 'DESC';
                    break;
            }
        }
        const firstWord = q.split(' ')[0];
        // const productsByLikeName = await this.productInformationRepository
        //     .createQueryBuilder('product_information')
        //     .select('product_information')
        //     .leftJoinAndSelect('product_information.productAttributeGroups', 'productAttributeGroups')
        //     .leftJoinAndSelect('productAttributeGroups.productAttributeValues', 'productAttributeValues')
        //     .leftJoinAndSelect('productAttributeValues.productAttribute', 'productAttribute')
        //     .leftJoinAndSelect('product_information.categoryConnections', 'categoryConnections')
        //     .leftJoinAndSelect('categoryConnections.category', 'category')
        //     .leftJoinAndSelect('product_information.productPrices', 'productPrices')
        //     .leftJoinAndSelect('product_information.productBrand', 'productBrand')
        //     .where(`MATCH(PRODUCT_NAME) AGAINST('+${firstWord}* ${q}' in boolean mode)`)
        //     .orWhere(`MATCH(PRODUCT_NAME) AGAINST('${q}')`)
        //     .orWhere(`MATCH(product_information.LONG_DESCRIPTION) AGAINST('+${firstWord}* ${q}' in boolean mode)`)
        //     .orWhere(`MATCH(product_information.LONG_DESCRIPTION) AGAINST('${q}')`)
        //     .orWhere(`MATCH(product_information.SHORT_DESCRIPTION) AGAINST('+${firstWord}* ${q}' in boolean mode)`)
        //     .orWhere(`MATCH(product_information.SHORT_DESCRIPTION) AGAINST('${q}')`)
        //     .take(take)
        //     .skip(skip)
        //     .getMany();
        let foundCategories: CategoryType[];
        let foundBrands: ProductBrandType[];
        let filteredQuery = this.productInformationRepository
            .createQueryBuilder('product_information')
            .select('product_information')
            .leftJoinAndSelect('product_information.productAttributeGroups', 'productAttributeGroups')
            .leftJoinAndSelect('productAttributeGroups.productAttributeValues', 'productAttributeValues')
            .leftJoinAndSelect('productAttributeValues.productAttribute', 'productAttribute')
            .leftJoinAndSelect('product_information.categoryConnections', 'categoryConnections')
            .leftJoinAndSelect('categoryConnections.category', 'category')
            .leftJoinAndSelect('product_information.products', 'products')
            .leftJoinAndSelect('product_information.productPrices', 'productPrices')
            .leftJoinAndSelect('product_information.productBrand', 'productBrand')
            .leftJoinAndSelect('products.images', 'images')
            .leftJoinAndSelect("products.discount_promotion", "discount_promotion")
            .leftJoinAndSelect("discount_promotion.promotion", "promotion")
            .leftJoinAndSelect("promotion.priority", "priority");

        if (q !== '*') {
            filteredQuery
                .where(`MATCH(PRODUCT_NAME) AGAINST('+${firstWord}* ${q}' in boolean mode)`)
                .orWhere(`MATCH(PRODUCT_NAME) AGAINST('${q}')`)
                .orWhere(`MATCH(product_information.LONG_DESCRIPTION) AGAINST('+${firstWord}* ${q}' in boolean mode)`)
                .orWhere(`MATCH(product_information.LONG_DESCRIPTION) AGAINST('${q}')`)
                .orWhere(`MATCH(product_information.SHORT_DESCRIPTION) AGAINST('+${firstWord}* ${q}' in boolean mode)`)
                .orWhere(`MATCH(product_information.SHORT_DESCRIPTION) AGAINST('${q}')`);
        }
        if (categoryQuery !== '') filteredQuery.having(categoryQuery);
        if (brandQuery !== '') filteredQuery.andHaving(brandQuery);
        if (groupAttributeQuery !== '') filteredQuery.andHaving(groupAttributeQuery);
        if (conditionalQuery !== '') filteredQuery.andHaving(conditionalQuery);
        filteredQuery.orderBy(sortField, sortOption);
        if (!(query.take && query.take === 'get-all')) {
            filteredQuery.take(take);
            filteredQuery.skip(skip);
        }

        let filteredProductsInformation = await filteredQuery.getMany();
        filteredProductsInformation = filteredProductsInformation.filter(productInfo => productInfo.productAttributeGroups.length > 0);
        foundCategories = [];
        foundBrands = [];
        filteredProductsInformation.map(product => {
            const productCategories = product.categoryConnections;
            productCategories.map(pc => {
                if (foundCategories.filter(fc => fc.SID === pc.SID_CATEGORY).length === 0) {
                    foundCategories.push(pc.category);
                }
            })
            const productBrand = product.productBrand;
            if (foundBrands.length === 0) foundBrands.push(productBrand);
            if (foundBrands.filter(brand => brand.SID === productBrand.SID).length === 0) foundBrands.push(productBrand);
        })
        let allProductsAttributes: Array<{ attributeInfo: ProductAttributeType, attributeValues: Array<Date | number | string>, attributeType: 'm' | 's' }>;
        allProductsAttributes = [];
        const getProductsAttributes = filteredProductsInformation.map(productInfo => {
            productInfo.productAttributeGroups.map(async groupAttribute => {
                const groupAttributeInfo = await this.productAttributeRepository.findOne({ where: { ID: groupAttribute.GROUP_ATTRIBUTE_ID } });
                let attributeValue: string | Date | number;
                if (groupAttribute.GROUP_VALUE_DATETIME) attributeValue = groupAttribute.GROUP_VALUE_DATETIME;
                if (groupAttribute.GROUP_VALUE_VARCHAR) attributeValue = groupAttribute.GROUP_VALUE_VARCHAR;
                if (groupAttribute.GROUP_VALUE_DECIMAL) attributeValue = groupAttribute.GROUP_VALUE_DECIMAL;
                if (groupAttribute.GROUP_VALUE_INT) attributeValue = groupAttribute.GROUP_VALUE_INT;
                if (allProductsAttributes.filter(attribute => attribute.attributeInfo.ID === groupAttributeInfo.ID).length === 0) {
                    allProductsAttributes.push({ attributeInfo: groupAttributeInfo, attributeValues: [attributeValue], attributeType: 'm' });
                } else {
                    if (!allProductsAttributes.filter(attribute => attribute.attributeInfo.ID === groupAttributeInfo.ID)[0].attributeValues.filter(value => value === attributeValue)[0]) {
                        allProductsAttributes.filter(attribute => attribute.attributeInfo.ID === groupAttributeInfo.ID)[0].attributeValues.push(attributeValue);
                    }
                }
                groupAttribute.productAttributeValues.map(attribute => {
                    let attributeValue: string | Date | number;
                    if (attribute.VALUE_DATETIME) attributeValue = attribute.VALUE_DATETIME;
                    if (attribute.VALUE_VARCHAR) attributeValue = attribute.VALUE_VARCHAR;
                    if (attribute.VALUE_DECIMAL) attributeValue = attribute.VALUE_DECIMAL;
                    if (attribute.VALUE_INT) attributeValue = attribute.VALUE_INT;
                    if (allProductsAttributes.filter(productA => productA.attributeInfo.ID === attribute.productAttribute.ID).length === 0) {
                        allProductsAttributes.push({ attributeInfo: attribute.productAttribute, attributeValues: [attributeValue], attributeType: 's' });
                    } else {
                        if (allProductsAttributes.filter(productA => productA.attributeInfo.ID === attribute.productAttribute.ID)[0].attributeValues.filter(value => value === attributeValue).length > 0) return;
                        allProductsAttributes.filter(productA => productA.attributeInfo.ID === attribute.productAttribute.ID)[0].attributeValues.push(attributeValue);
                    }
                })
            });
            return allProductsAttributes;
        });
        await Promise.all(getProductsAttributes);
        let max_price: number;
        max_price = 0;
        if (filteredProductsInformation && filteredProductsInformation.length > 0) {
            // const copiedProducts = [...filteredProductsInformation];
            // max_price = copiedProducts.sort((a, b) => b.productPrices[0].UNIT_PRICE - a.productPrices[0].UNIT_PRICE)[0].productPrices[0].UNIT_PRICE;
            let totalRecords: number;
            totalRecords = 0;
            if (!query.PRICE_FROM && !query.PRICE_TO) {
                let totalRecordsQuery = this.productInformationRepository
                    .createQueryBuilder('product_information')
                    .select('product_information.SID')
                    .leftJoinAndSelect('product_information.productAttributeGroups', 'productAttributeGroups')
                    .leftJoinAndSelect('productAttributeGroups.productAttributeValues', 'productAttributeValues')
                    .leftJoinAndSelect('productAttributeValues.productAttribute', 'productAttribute')
                    .leftJoinAndSelect('product_information.categoryConnections', 'categoryConnections')
                    .leftJoinAndSelect('categoryConnections.category', 'category')
                    .leftJoinAndSelect('product_information.products', 'products')
                    .leftJoinAndSelect('product_information.productPrices', 'productPrices')
                    .leftJoinAndSelect('product_information.productBrand', 'productBrand');

                if (q !== '*') {
                    totalRecordsQuery
                        .where(`MATCH(PRODUCT_NAME) AGAINST('+${firstWord}* ${q}' in boolean mode)`)
                        .orWhere(`MATCH(PRODUCT_NAME) AGAINST('${q}')`)
                        .orWhere(`MATCH(product_information.LONG_DESCRIPTION) AGAINST('+${firstWord}* ${q}' in boolean mode)`)
                        .orWhere(`MATCH(product_information.LONG_DESCRIPTION) AGAINST('${q}')`)
                        .orWhere(`MATCH(product_information.SHORT_DESCRIPTION) AGAINST('+${firstWord}* ${q}' in boolean mode)`)
                        .orWhere(`MATCH(product_information.SHORT_DESCRIPTION) AGAINST('${q}')`);
                }
                if (categoryQuery !== '') totalRecordsQuery.having(categoryQuery);
                if (brandQuery !== '') totalRecordsQuery.andHaving(brandQuery);
                if (groupAttributeQuery !== '') totalRecordsQuery.andHaving(groupAttributeQuery);
                if (conditionalQuery !== '') totalRecordsQuery.andHaving(conditionalQuery);
                let products = await totalRecordsQuery.getMany();
                totalRecords = products.length;
            } else {
                totalRecords = await this.productInformationRepository
                    .createQueryBuilder('product_information')
                    .select('product_information')
                    .where(`MATCH(PRODUCT_NAME) AGAINST('+${firstWord}* ${q}' in boolean mode)`)
                    .orWhere(`MATCH(product_information.LONG_DESCRIPTION) AGAINST('+${firstWord}* ${q}' in boolean mode)`)
                    .getCount();
            }

            let totalPages: number;
            totalPages = Math.ceil(totalRecords / take);

            const isSearched = q !== '*' && categoryQuery === '' && brandQuery === '' && groupAttributeQuery === '' && conditionalQuery === '' && !query.sort && role === 'customer';

            const existedSearchTerm = await this.searchTermRepository.findOne({ where: { SEARCH_TERM: q } });
            if (existedSearchTerm) {
                if (isSearched) {
                    existedSearchTerm.COUNT = existedSearchTerm.COUNT + 1;
                    await existedSearchTerm.save();
                }
            } else {
                if (isSearched) {
                    const newSearchTerm = this.searchTermRepository.create({ SEARCH_TERM: q });
                    await newSearchTerm.save();
                }
            }

            //Update for promotion
            let productsReturn = [];
            for (let i = 0; i < filteredProductsInformation.length; i++) {
                let promotionList: DiscountPromotionType[] = []
                for (let j = 0; j < filteredProductsInformation[i].products.length; j++) {
                    if (filteredProductsInformation[i].products[j].discount_promotion.length > 0) {
                        let promotion: DiscountPromotionType[] = [];
                        for (let k = 0; k < filteredProductsInformation[i].products[j].discount_promotion.length; k++) {
                            let item: DiscountPromotionType = filteredProductsInformation[i].products[j].discount_promotion[k];
                            let date = moment(new Date());
                            let today = date.format('yyyy-MM-DD');
                            let time = date.hour() * 3600 + date.minute() * 60 + date.second();
                            if (item.promotion.ACTIVE && item.promotion.APPLY_COUNT !== 0 && date.isAfter(moment(item.promotion.START_DATE)) && date.isBefore(moment(item.promotion.END_DATE))
                                && time >= item.promotion.START_TIME && time <= item.promotion.END_TIME
                            ) {
                                promotion.push(item)
                            }
                        }
                        if (promotion.length > 0) {
                            promotion.sort((a, b) => a.promotion.priority.LEVEL - b.promotion.priority.LEVEL);
                            promotionList.push(promotion[0])
                        }
                    }
                }
                promotionList.sort((a, b) => a.promotion.priority.LEVEL - b.promotion.priority.LEVEL);
                productsReturn.push({
                    ...filteredProductsInformation[i],
                    DISC_VALUE: (promotionList.length > 0) ? promotionList[0].DISC_VALUE : 0
                }
                )
            }


            return {
                products: productsReturn,
                categroies: foundCategories,
                brands: foundBrands,
                sizes: [],
                attributes: allProductsAttributes,
                max_price: max_price,
                total_pages: totalPages,
                total_records: totalRecords,
            }
        } else {
            return {
                products: [],
                categroies: [],
                brands: [],
                attributes: [],
                sizes: [],
                max_price: 0,
                total_pages: 0,
                total_records: 0,
            }
        }
    }

    async findProductsForCustomer(query: any, role: string) {
        const response = await this.findProducts(query, role);

        return {
            products: response.products,
            categroies: response.categroies,
            brands: response.brands,
            sizes: [],
            attributes: response.attributes,
            max_price: response.max_price,
            total_pages: response.total_pages,
            total_records: response.total_records,
        }
    }

    async addCategoriesForProduct(addCategoriesForProductDTO: AddCategoriesForProductDTO) {
        let successAddedCategoryIds: string[];
        successAddedCategoryIds = [];
        let failAddedCategoryIds: FailAddedCategoryIdType[];
        failAddedCategoryIds = [];
        const data = addCategoriesForProductDTO.CATEGORY_ID_ARRAY.map(async (CATEGORY_SID) => {
            const checkIfExisted = await this.productCategoryRepository.findOne({ where: { SID_CATEGORY: CATEGORY_SID, SID_PRODUCT: addCategoriesForProductDTO.SID_PRODUCT } });
            if (checkIfExisted) {
                failAddedCategoryIds.push({
                    CATEGORY_SID,
                    PRODUCT_SID: addCategoriesForProductDTO.SID_PRODUCT,
                    error: 'This product already set to this category'
                });
            } else {
                try {
                    const newProductCategory = this.productCategoryRepository.create({ SID_CATEGORY: CATEGORY_SID, SID_PRODUCT: addCategoriesForProductDTO.SID_PRODUCT });
                    await newProductCategory.save();
                    successAddedCategoryIds.push(newProductCategory.SID_CATEGORY);
                } catch (error) {
                    if (error.message + ''.includes('NO_REFERENCED_ROW_2')) {
                        failAddedCategoryIds.push({
                            CATEGORY_SID,
                            PRODUCT_SID: addCategoriesForProductDTO.SID_PRODUCT,
                            error: 'Incorrect product sid'
                        });
                    } else if (error.message + ''.includes('NO_REFERENCED_ROW_1')) {
                        failAddedCategoryIds.push({
                            CATEGORY_SID,
                            PRODUCT_SID: addCategoriesForProductDTO.SID_PRODUCT,
                            error: 'Incorrect category sid'
                        });
                    }
                }
            }
        })
        await Promise.all(data);
        return {
            success: successAddedCategoryIds,
            failed: failAddedCategoryIds
        }
    }

    async addProductImages(PRODUCT_SID: string, imageFiles: Express.Multer.File[] | {
        [fieldname: string]: Express.Multer.File[]
    }) {
        let successImgs: ProductImageType[];
        successImgs = [];
        for (let i = 0; i < imageFiles.length; i++) {
            const imgName = imageFiles[i].filename;
            const newImage = this.productImageRepository.create({ IMAGE_TYPE: i + 1, IMAGE_NAME: imgName, PRODUCT_SID });
            await newImage.save();
            successImgs.push(newImage);
        }
        return { success: successImgs };
    }

    async addPrismImages(PRODUCT_SID: string, addPrismImagesDTO: AddPrismImagesDTO) {
        let successImgs: ProductImageType[];
        const { IMAGE1_URL, IMAGE2_URL, IMAGE3_URL } = addPrismImagesDTO;
        console.log(PRODUCT_SID);
        console.log(IMAGE1_URL, IMAGE2_URL, IMAGE3_URL);
        successImgs = [];
        const newImage1 = this.productImageRepository.create({ IMAGE_TYPE: 1, PRISM_URL: IMAGE1_URL, PRODUCT_SID });
        await newImage1.save();
        successImgs.push(newImage1);
        const newImage2 = this.productImageRepository.create({ IMAGE_TYPE: 2, PRISM_URL: IMAGE2_URL, PRODUCT_SID });
        await newImage2.save();
        successImgs.push(newImage2);
        const newImage3 = this.productImageRepository.create({ IMAGE_TYPE: 3, PRISM_URL: IMAGE3_URL, PRODUCT_SID });
        await newImage3.save();
        successImgs.push(newImage3);
        return { success: successImgs };
    }

    async autoComplete(search_string: string) {
        const firstWord = search_string.split(' ')[0];
        const similarTerms = await this.searchTermRepository
            .createQueryBuilder('search_term')
            .select('search_term')
            .where(`MATCH(SEARCH_TERM) AGAINST('+${firstWord}* ${search_string}' in boolean mode)`)
            .orWhere(`MATCH(SEARCH_TERM) AGAINST('${search_string}')`)
            .orderBy('COUNT', 'DESC')
            .getMany()
        return { terms: similarTerms };
    }

    async getProductDetailWithCreateQueryBuilder(SID: string) {
        const result = await this.productInformationRepository.createQueryBuilder("product_information")
            .select()
            .leftJoinAndSelect("product_information.products", "products")
            .leftJoinAndSelect("product_information.categoryConnections", "categoryConnections")
            .leftJoinAndSelect("product_information.productBrand", "productBrand")
            .leftJoinAndSelect("product_information.productReviews", "productReviews")
            .leftJoinAndSelect("product_information.productPrices", "productPrices")
            .leftJoinAndSelect("product_information.productAttributeGroups", "productAttributeGroups")
            .leftJoinAndSelect("productAttributeGroups.productAttributeValues", "productAttributeValues")
            .leftJoinAndSelect("productAttributeGroups.productAttribute", "productAttribute")
            .leftJoinAndSelect("categoryConnections.category", "categoryConnections.category")
            .leftJoinAndSelect("products.images", "images")
            .leftJoinAndSelect("products.inventoryHistories", "inventoryHistories")
            .leftJoinAndSelect("products.discount_promotion", "discount_promotion")
            .leftJoinAndSelect("discount_promotion.promotion", "promotion")
            .leftJoinAndSelect("promotion.priority", "priority")
            .leftJoinAndSelect("promotion.validation_customer_loyalty", "validation_customer_loyalty")
            .where("product_information.SID = :SID", { SID })
            .getOne();
        return result;
    }

    async getProductDetail(SID: string) {
        const productInformation = await this.productInformationRepository.findOne({ where: { SID: SID } });
        if (productInformation) {
            let productByGroupedAttribute: Array<{
                GROUP_ID: number,
                GROUP_ATTRIBUTE_ID: number,
                GROUP_ATTRIBUTE_NAME: string,
                GROUP_ATTRIBUTE_VALUE: string | number | Date,
                GROUP_ATTRIBUTE_VALUE_TYPE: string,
                PRODUCT_INFORMATION: ProductInformationType,
                groupedProducts: Array<{
                    ID: number,
                    SID_PRODUCT: string,
                    PRODUCT_ATTRIBUTE_ID: number,
                    CREATED_DATETIME: Date,
                    MODIFIED_DATETIME: Date,
                    VALUE_VARCHAR: string,
                    VALUE_INT: number,
                    VALUE_DECIMAL: number,
                    VALUE_DATETIME: Date,
                    product: {
                        SID: string;
                        SID_PRODUCT_INFORMATION: string;
                        QTY: number;
                        CREATED_DATETIME: Date;
                        MODIFIED_DATETIME: Date;
                        images: ProductImageType[];
                        discount_promotion?: DiscountPromotionType[];
                        SELLABLE: boolean,
                    },
                    productAttribute: ProductAttributeType,
                }>
            }>;
            productByGroupedAttribute = [];
            const getProductAttributeGroups = productInformation.productAttributeGroups.map(async group => {
                let GROUP_ATTRIBUTE_VALUE: string | number | Date;
                const valueType = group.productAttribute.VALUE_TYPE;
                GROUP_ATTRIBUTE_VALUE = group[`GROUP_VALUE_${valueType}`];
                let groupedProducts: Array<{
                    ID: number,
                    SID_PRODUCT: string,
                    PRODUCT_ATTRIBUTE_ID: number,
                    CREATED_DATETIME: Date,
                    MODIFIED_DATETIME: Date,
                    VALUE_VARCHAR: string,
                    VALUE_INT: number,
                    VALUE_DECIMAL: number,
                    VALUE_DATETIME: Date,
                    product: {
                        SID: string;
                        SID_PRODUCT_INFORMATION: string;
                        QTY: number;
                        CREATED_DATETIME: Date;
                        MODIFIED_DATETIME: Date;
                        images: ProductImageType[];
                        discount_promotion?: DiscountPromotionType[];
                        SELLABLE: boolean,
                    },
                    productAttribute: ProductAttributeType,
                }> = [];
                const getGroupedProducts = group.productAttributeValues.map(async pav => {
                    const product = pav.product;
                    let sellableQty: number;
                    let reservationQty: number;
                    let availableStoresCount = 0;
                    sellableQty = 0;
                    reservationQty = 0;
                    if (!productInformation.CAN_PREORDER) {
                        const upc = product.UPC;
                        const threshold = productInformation.THRESHOLD;
                        const response = await axios({
                            url: `http://localhost:5035/prism/stores-qty/${upc}`,
                            method: "GET",
                            withCredentials: true,
                        })
                        let storesQty: Array<{
                            minqty: number,
                            qty: number,
                            storecode: string,
                        }> = response.data;
                        const getAvailableStoresCount = storesQty.map(store => {
                            if (store.qty > threshold) {
                                availableStoresCount = availableStoresCount + 1;
                            }
                            return availableStoresCount;
                        });
                        await Promise.all(getAvailableStoresCount);
                        // const orderToCalculateReserveQty = await this.orderRepository.find(
                        //     {
                        //         where: { STATUS: Not(In([5, 7, 8])) }
                        //     }
                        // );
                        // if (orderToCalculateReserveQty.length > 0) {
                        //     orderToCalculateReserveQty.map(order => {
                        //         const orderItems = order.orderItems;
                        //         const orderItem = orderItems.filter(order => order.SID_PRODUCT === pav.SID_PRODUCT)[0];
                        //         if (orderItem) {
                        //             reservationQty += orderItem.QUANTITY;
                        //         }
                        //     })
                        // }
                        // sellableQty = currentQty - threshold - reservationQty;
                    }
                    let isSellable = true;
                    // if (!productInformation.CAN_PREORDER && sellableQty <= 0) {
                    //     isSellable = false;
                    // }
                    if (!productInformation.CAN_PREORDER && availableStoresCount === 0) {
                        isSellable = false;
                    }
                    const productToPush = {
                        ...pav.product,
                        SELLABLE: isSellable,
                    };
                    groupedProducts.push({
                        ...pav,
                        product: productToPush
                    });
                    return groupedProducts;
                })
                await Promise.all(getGroupedProducts);
                productByGroupedAttribute.push({
                    GROUP_ID: group.ID,
                    GROUP_ATTRIBUTE_ID: group.GROUP_ATTRIBUTE_ID,
                    GROUP_ATTRIBUTE_NAME: group.productAttribute.ATTRIBUTE_NAME,
                    GROUP_ATTRIBUTE_VALUE: GROUP_ATTRIBUTE_VALUE,
                    PRODUCT_INFORMATION: group.productInformation,
                    GROUP_ATTRIBUTE_VALUE_TYPE: valueType,
                    groupedProducts: groupedProducts
                })
                return productByGroupedAttribute;
            });
            await Promise.all(getProductAttributeGroups);
            // Choose the promotion
            for (let i = 0; i < productByGroupedAttribute.length; i++) {
                for (let j = 0; j < productByGroupedAttribute[i].groupedProducts.length; j++) {
                    if (productByGroupedAttribute[i].groupedProducts[j].product.discount_promotion.length > 0) {
                        let promotion: DiscountPromotionType[] = [];
                        for (let k = 0; k < productByGroupedAttribute[i].groupedProducts[j].product.discount_promotion.length; k++) {
                            let item: DiscountPromotionType = productByGroupedAttribute[i].groupedProducts[j].product.discount_promotion[k];
                            let date = moment(new Date());
                            let time = date.hour() * 3600 + date.minute() * 60 + date.second();
                            if (item.promotion.ACTIVE && item.promotion.APPLY_COUNT !== 0 && date.isAfter(moment(item.promotion.START_DATE)) && date.isBefore(moment(item.promotion.END_DATE))
                                && time >= item.promotion.START_TIME && time <= item.promotion.END_TIME
                            ) {
                                promotion.push(item)
                            }
                        }
                        promotion.sort((a, b) => a.promotion.priority.LEVEL - b.promotion.priority.LEVEL);
                        promotion = promotion.slice(0, 1);
                        productByGroupedAttribute[i].groupedProducts[j].product.discount_promotion = promotion;
                    }
                }
            }
            return {
                productInformation: productInformation,
                productByGroupedAttribute: productByGroupedAttribute,
            }
        } else {
            return { error: 'Cannot find any product with that SID' };
        }
    }
    async getRecomendationActive() {
        const manager = getManager();
        const query = `select TYPE_SID from RECOMMEND_ACTIVE
        WHERE ACTIVE = 1 `
        const active = await manager.query(query);
        return active;

    }

    async getProductRecommend(CATEGORY_SID: String, PRODUCT_SID: String, CUST_SID: String, BRAND_SID: String) {

        let productList: Array<{
            SID: string,
            PRODUCT_NAME: string,
            UNIT_PRICE: number,
            IMAGE_NAME: string,
            PRISM_URL: string,
            CATEGORY_NAME: string,
            RATING: string,
            DISC_VALUE: number,


        }> = [];

        let terms = [];
        const manager = getManager();
        const ACTIVE = await this.getRecomendationActive();
        const TYPE_ACTIVE = JSON.parse(JSON.stringify(ACTIVE))
        let query = "";
        console.log(TYPE_ACTIVE[0].TYPE_SID);

        if (TYPE_ACTIVE[0].TYPE_SID == 'RC1') //recomend with same category
        {
            console.log(1);
            query = `
            SELECT PI.SID,PI.PRODUCT_NAME,PP.UNIT_PRICE,PIC.IMAGE_NAME,PIC.PRISM_URL,PC.CATEGORY_NAME,PR.RATING,PRM.DISC_VALUE FROM PRODUCT_INFORMATION PI
            JOIN PRODUCT P ON PI.SID=P.SID_PRODUCT_INFORMATION
            JOIN promotion_reward_discount_item PRM ON PRM.SID_PRODUCT = P.SID
            LEFT join product_review PR on PI.SID = PR.SID_PRODUCT_INFORMATION
            JOIN PRODUCT_IMAGE PIC ON PIC.PRODUCT_SID =P.SID
            JOIN PRODUCT_PRICE PP ON PP.SID_PRODUCT_INFORMATION =PI.SID
            JOIN (SELECT C1.CATEGORY_NAME,PC1.SID_PRODUCT,PC1.SID_CATEGORY FROM CATEGORY C1
                    JOIN PRODUCT_CATEGORY PC1  ON C1.SID=PC1.SID_CATEGORY ) PC ON PC.SID_PRODUCT=PI.SID
            WHERE PC.SID_CATEGORY ='${CATEGORY_SID}' AND PI.SID NOT IN ('${PRODUCT_SID}')
            GROUP BY PI.SID
            LIMIT 5
                `;
        }
        else if (CUST_SID != "0" && TYPE_ACTIVE[0].TYPE_SID == "RC2") // recomend with history order
        {
            console.log(2);
            query = `
            SELECT PI.SID,PI.PRODUCT_NAME,PP.UNIT_PRICE,PIC.IMAGE_NAME,PIC.PRISM_URL,PC.CATEGORY_NAME,PR.RATING,PRM.DISC_VALUE FROM PRODUCT_INFORMATION PI
            JOIN PRODUCT P ON PI.SID=P.SID_PRODUCT_INFORMATION
            JOIN PRODUCT_IMAGE PIC ON PIC.PRODUCT_SID =P.SID
            JOIN promotion_reward_discount_item PRM ON PRM.SID_PRODUCT = P.SID
            LEFT join product_review PR on PI.SID = PR.SID_PRODUCT_INFORMATION
            JOIN PRODUCT_PRICE PP ON PP.SID_PRODUCT_INFORMATION =PI.SID
            JOIN (SELECT C1.CATEGORY_NAME,PC1.SID_PRODUCT,PC1.SID_CATEGORY FROM CATEGORY C1
                    JOIN PRODUCT_CATEGORY PC1  ON C1.SID=PC1.SID_CATEGORY ) PC ON PC.SID_PRODUCT=PI.SID
            WHERE PC.SID_CATEGORY in (
            SELECT PC2.SID_CATEGORY FROM product_category PC2
            join product_information PI2 on PI2.SID =PC2.SID_PRODUCT
            JOIN product P2 ON P2.SID_PRODUCT_INFORMATION = PI2.SID
            JOIN order_item OI2 ON OI2.SID_PRODUCT=P2.SID
            WHERE OI2.ORDER_ID IN ( 
            SELECT ORD.ID FROM mydb.order ord
            where ord.SID_CUSTOMER = '${CUST_SID}')) and PI.SID NOT IN ('${PRODUCT_SID}')
            GROUP BY PI.SID
            LIMIT 5
            `;
        }
        else if (TYPE_ACTIVE[0].TYPE_SID == "RC3") // recommend seasonal products with the highest ratings
        {
            console.log(3);
            query = `
         SELECT PI.SID,PI.PRODUCT_NAME,PP.UNIT_PRICE,PIC.IMAGE_NAME,PIC.PRISM_URL,PC.CATEGORY_NAME,PR.RATING,PRM.DISC_VALUE FROM PRODUCT_INFORMATION PI
         JOIN PRODUCT P ON PI.SID=P.SID_PRODUCT_INFORMATION
         JOIN promotion_reward_discount_item PRM ON PRM.SID_PRODUCT = P.SID
         JOIN PRODUCT_IMAGE PIC ON PIC.PRODUCT_SID =P.SID
         JOIN PRODUCT_PRICE PP ON PP.SID_PRODUCT_INFORMATION =PI.SID
         LEFT join product_review PR on PI.SID = PR.SID_PRODUCT_INFORMATION
         JOIN (SELECT C1.CATEGORY_NAME,PC1.SID_PRODUCT,PC1.SID_CATEGORY FROM CATEGORY C1
                 JOIN PRODUCT_CATEGORY PC1  ON C1.SID=PC1.SID_CATEGORY ) PC ON PC.SID_PRODUCT=PI.SID
         WHERE  PI.SID NOT IN ('${PRODUCT_SID}')
         GROUP BY PI.SID
         ORDER BY PR.RATING DESC
         LIMIT 5
            `;
        }

        else if (TYPE_ACTIVE[0].TYPE_SID == "RC4") // recommend category products with the highest ratings
        {
            console.log(4);
            query = `
         SELECT PI.SID,PI.PRODUCT_NAME,PP.UNIT_PRICE,PIC.IMAGE_NAME,PIC.PRISM_URL,PC.CATEGORY_NAME,PR.RATING,PRM.DISC_VALUE FROM PRODUCT_INFORMATION PI
         JOIN PRODUCT P ON PI.SID=P.SID_PRODUCT_INFORMATION
         JOIN promotion_reward_discount_item PRM ON PRM.SID_PRODUCT = P.SID
         JOIN PRODUCT_IMAGE PIC ON PIC.PRODUCT_SID =P.SID
         JOIN PRODUCT_PRICE PP ON PP.SID_PRODUCT_INFORMATION =PI.SID
         LEFT join product_review PR on PI.SID = PR.SID_PRODUCT_INFORMATION
         JOIN (SELECT C1.CATEGORY_NAME,PC1.SID_PRODUCT,PC1.SID_CATEGORY FROM CATEGORY C1
                 JOIN PRODUCT_CATEGORY PC1  ON C1.SID=PC1.SID_CATEGORY ) PC ON PC.SID_PRODUCT=PI.SID
         WHERE PC.SID_CATEGORY ='${CATEGORY_SID}' AND PI.SID NOT IN ('${PRODUCT_SID}')
         GROUP BY PI.SID
         ORDER BY PR.RATING DESC
         LIMIT 5
            `;
        }

        else if (TYPE_ACTIVE[0].TYPE_SID == "RC5") // recommend best selling of Brand
        {
            console.log(5);
            query = `
         SELECT PI.SID,PI.PRODUCT_NAME,PP.UNIT_PRICE,PIC.IMAGE_NAME,PIC.PRISM_URL,PC.CATEGORY_NAME,PR.RATING,sum(O.QUANTITY) AS "QTY",PRM.DISC_VALUE FROM PRODUCT_INFORMATION PI
         JOIN PRODUCT P ON PI.SID=P.SID_PRODUCT_INFORMATION
         JOIN promotion_reward_discount_item PRM ON PRM.SID_PRODUCT = P.SID
         JOIN PRODUCT_IMAGE PIC ON PIC.PRODUCT_SID =P.SID
         JOIN PRODUCT_PRICE PP ON PP.SID_PRODUCT_INFORMATION =PI.SID
         join order_item O ON O.SID_PRODUCT = P.SID
         join product_brand BR ON BR.SID = PI.SID_BRAND
         LEFT join product_review PR on PI.SID = PR.SID_PRODUCT_INFORMATION
         JOIN (SELECT C1.CATEGORY_NAME,PC1.SID_PRODUCT,PC1.SID_CATEGORY FROM CATEGORY C1
              JOIN PRODUCT_CATEGORY PC1  ON C1.SID=PC1.SID_CATEGORY ) PC ON PC.SID_PRODUCT=PI.SID
        
         WHERE PI.SID NOT IN ('${PRODUCT_SID}') AND PI.SID_BRAND = '${BRAND_SID}'
         GROUP BY PI.SID
         ORDER BY O.QUANTITY DESC
         LIMIT 5
            `;
        }
        else if (CUST_SID != "0" && TYPE_ACTIVE[0].TYPE_SID == "RC6") // recommend with history view of customer (Login) 
        {
            console.log(6);
            query = `
            SELECT PI.SID,PI.PRODUCT_NAME,PP.UNIT_PRICE,PIC.IMAGE_NAME,PIC.PRISM_URL,PC.CATEGORY_NAME,PR.RATING,PRM.DISC_VALUE FROM PRODUCT_INFORMATION PI
            JOIN PRODUCT P ON PI.SID=P.SID_PRODUCT_INFORMATION
            JOIN promotion_reward_discount_item PRM ON PRM.SID_PRODUCT = P.SID
            JOIN PRODUCT_IMAGE PIC ON PIC.PRODUCT_SID =P.SID
            JOIN PRODUCT_PRICE PP ON PP.SID_PRODUCT_INFORMATION =PI.SID
            LEFT join product_review PR on PI.SID = PR.SID_PRODUCT_INFORMATION
            join view_hist H on H.SID_PRODUCT_INFORMATION = PI.SID 
            JOIN (SELECT C1.CATEGORY_NAME,PC1.SID_PRODUCT,PC1.SID_CATEGORY FROM CATEGORY C1
                    JOIN PRODUCT_CATEGORY PC1  ON C1.SID=PC1.SID_CATEGORY ) PC ON PC.SID_PRODUCT=PI.SID
            WHERE H.SID_CUST =('${CUST_SID}') AND PI.SID NOT IN ('${PRODUCT_SID}')
            GROUP BY PI.SID
            LIMIT 5
            `;
        }
        else {
            console.log("khong login");
            query = `
            SELECT PI.SID,PI.PRODUCT_NAME,PP.UNIT_PRICE,PIC.IMAGE_NAME,PIC.PRISM_URL,PC.CATEGORY_NAME,PRM.DISC_VALUE FROM PRODUCT_INFORMATION PI
            JOIN PRODUCT P ON PI.SID=P.SID_PRODUCT_INFORMATION
            JOIN promotion_reward_discount_item PRM ON PRM.SID_PRODUCT = P.SID
            JOIN PRODUCT_IMAGE PIC ON PIC.PRODUCT_SID =P.SID
            JOIN PRODUCT_PRICE PP ON PP.SID_PRODUCT_INFORMATION =PI.SID
            JOIN (SELECT C1.CATEGORY_NAME,PC1.SID_PRODUCT,PC1.SID_CATEGORY FROM CATEGORY C1
                    JOIN PRODUCT_CATEGORY PC1  ON C1.SID=PC1.SID_CATEGORY ) PC ON PC.SID_PRODUCT=PI.SID
            WHERE PC.SID_CATEGORY ='${CATEGORY_SID}' AND PI.SID NOT IN ('${PRODUCT_SID}')
            GROUP BY PI.SID
            LIMIT 5
                `;
        }


        const listProduct = await manager.query(query);
        listProduct.map(product => {
            const SID = product.SID;
            const PRODUCT_NAME = product.PRODUCT_NAME;
            const UNIT_PRICE = product.UNIT_PRICE;
            const IMAGE_NAME = product.IMAGE_NAME;
            const PRISM_URL = product.PRISM_URL;
            const CATEGORY_NAME = product.CATEGORY_NAME;
            const RATING = product.RATING;
            const DISC_VALUE = product.DISC_VALUE;
            productList.push({ SID, PRODUCT_NAME, UNIT_PRICE, IMAGE_NAME, PRISM_URL, CATEGORY_NAME, RATING, DISC_VALUE });

        })
        return { product: listProduct };
    }
    async getProductIndex() {
        let productList: Array<{
            SID: string,
            PRODUCT_NAME: string,
            UNIT_PRICE: number,
            IMAGE_NAME: string,
            PRISM_URL: string,
            CATEGORY_NAME: string,
            RATING: string,
            DISC_VALUE: number,


        }> = [];
        const manager = getManager();
        var today = new Date();
        var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        const query = `SELECT PI.SID,PI.PRODUCT_NAME,PP.UNIT_PRICE,PIC.IMAGE_NAME,PIC.PRISM_URL,PC.CATEGORY_NAME,PR.RATING,PRM.DISC_VALUE
        FROM PRODUCT_INFORMATION PI
        JOIN PRODUCT P ON PI.SID=P.SID_PRODUCT_INFORMATION
        JOIN promotion_reward_discount_item PRM ON PRM.SID_PRODUCT = P.SID
        JOIN PROMOTION PROMO ON PROMO.SID=PRM.SID_PROMOTION
        LEFT join product_review PR on PI.SID = PR.SID_PRODUCT_INFORMATION
        LEFT JOIN PRODUCT_IMAGE PIC ON PIC.PRODUCT_SID =P.SID
        LEFT JOIN PRODUCT_PRICE PP ON PP.SID_PRODUCT_INFORMATION =PI.SID
        LEFT JOIN (SELECT C1.CATEGORY_NAME,PC1.SID_PRODUCT,PC1.SID_CATEGORY FROM CATEGORY C1
                JOIN PRODUCT_CATEGORY PC1  ON C1.SID=PC1.SID_CATEGORY ) PC ON PC.SID_PRODUCT=PI.SID
        
        GROUP BY PI.SID
        order by P.CREATED_DATETIME ASC
        LIMIT 5`
        const listProduct = await manager.query(query);
        listProduct.map(product => {
            const SID = product.SID;
            const PRODUCT_NAME = product.PRODUCT_NAME;
            const UNIT_PRICE = product.UNIT_PRICE;
            const IMAGE_NAME = product.IMAGE_NAME;
            const PRISM_URL = product.PRISM_URL;
            const CATEGORY_NAME = product.CATEGORY_NAME;
            const RATING = product.RATING;
            const DISC_VALUE = product.DISC_VALUE;
            productList.push({ SID, PRODUCT_NAME, UNIT_PRICE, IMAGE_NAME, PRISM_URL, CATEGORY_NAME, RATING, DISC_VALUE });

        })
        
        const queryPromo = `
        SELECT PI.SID,PI.PRODUCT_NAME,PP.UNIT_PRICE,PIC.IMAGE_NAME,PIC.PRISM_URL,PC.CATEGORY_NAME,PR.RATING,PRM.DISC_VALUE
                FROM PRODUCT_INFORMATION PI
                JOIN PRODUCT P ON PI.SID=P.SID_PRODUCT_INFORMATION
                JOIN promotion_reward_discount_item PRM ON PRM.SID_PRODUCT = P.SID
                JOIN PROMOTION PROMO ON PROMO.SID=PRM.SID_PROMOTION
                LEFT join product_review PR on PI.SID = PR.SID_PRODUCT_INFORMATION
                LEFT JOIN PRODUCT_IMAGE PIC ON PIC.PRODUCT_SID =P.SID
                LEFT JOIN PRODUCT_PRICE PP ON PP.SID_PRODUCT_INFORMATION =PI.SID
                LEFT JOIN (SELECT C1.CATEGORY_NAME,PC1.SID_PRODUCT,PC1.SID_CATEGORY FROM CATEGORY C1
                        JOIN PRODUCT_CATEGORY PC1  ON C1.SID=PC1.SID_CATEGORY ) PC ON PC.SID_PRODUCT=PI.SID
				
                GROUP BY PI.SID
                order by PRM.DISC_VALUE DESC
                LIMIT 5`
        const listProductPromo = await manager.query(queryPromo);
        listProductPromo.map(productPromo => {
            const SID = productPromo.SID;
            const PRODUCT_NAME = productPromo.PRODUCT_NAME;
            const UNIT_PRICE = productPromo.UNIT_PRICE;
            const IMAGE_NAME = productPromo.IMAGE_NAME;
            const PRISM_URL = productPromo.PRISM_URL;
            const CATEGORY_NAME = productPromo.CATEGORY_NAME;
            const RATING = productPromo.RATING;
            const DISC_VALUE = productPromo.DISC_VALUE;
            productList.push({ SID, PRODUCT_NAME, UNIT_PRICE, IMAGE_NAME, PRISM_URL, CATEGORY_NAME, RATING, DISC_VALUE });

        })

        const queryBestseller = `
        SELECT PI.SID,PI.PRODUCT_NAME,PP.UNIT_PRICE,PIC.IMAGE_NAME,PIC.PRISM_URL,PC.CATEGORY_NAME,PR.RATING,PRM.DISC_VALUE
                FROM PRODUCT_INFORMATION PI
                JOIN PRODUCT P ON PI.SID=P.SID_PRODUCT_INFORMATION
                JOIN order_item ORD ON P.SID=ORD.SID_PRODUCT
                JOIN promotion_reward_discount_item PRM ON PRM.SID_PRODUCT = P.SID
                JOIN PROMOTION PROMO ON PROMO.SID=PRM.SID_PROMOTION
                LEFT join product_review PR on PI.SID = PR.SID_PRODUCT_INFORMATION
                LEFT JOIN PRODUCT_IMAGE PIC ON PIC.PRODUCT_SID =P.SID
                LEFT JOIN PRODUCT_PRICE PP ON PP.SID_PRODUCT_INFORMATION =PI.SID
                LEFT JOIN (SELECT C1.CATEGORY_NAME,PC1.SID_PRODUCT,PC1.SID_CATEGORY FROM CATEGORY C1
                        JOIN PRODUCT_CATEGORY PC1  ON C1.SID=PC1.SID_CATEGORY ) PC ON PC.SID_PRODUCT=PI.SID
                        
                GROUP BY PI.SID
                order by ORD.QUANTITY DESC
                LIMIT 5`
        const listBestseller = await manager.query(queryBestseller);

        listBestseller.map(productBestseller => {
            const SID = productBestseller.SID;
            const PRODUCT_NAME = productBestseller.PRODUCT_NAME;
            const UNIT_PRICE = productBestseller.UNIT_PRICE;
            const IMAGE_NAME = productBestseller.IMAGE_NAME;
            const PRISM_URL = productBestseller.PRISM_URL;
            const CATEGORY_NAME = productBestseller.CATEGORY_NAME;
            const RATING = productBestseller.RATING;
            const DISC_VALUE = productBestseller.DISC_VALUE;
            productList.push({ SID, PRODUCT_NAME, UNIT_PRICE, IMAGE_NAME, PRISM_URL, CATEGORY_NAME, RATING, DISC_VALUE });

        })

        console.log(listProductPromo);
        return { product: listProduct, productPromo: listProductPromo, productBestseller: listBestseller };

    }
    async getProductBrands() {
        const brands = await this.productBrandRepository.find();
        return { brands };
    }

    async getAllAttributes() {
        const attributes = await this.productAttributeRepository.find();
        return { attributes };
    }

    async createProductAttributeSet(createAttributeSetDTO: CreateAttributeSetDTO) {
        try {
            const newProductAttributeSet = this.productAttributeSetRepository.create(createAttributeSetDTO);
            await newProductAttributeSet.save();
            return { newSet: newProductAttributeSet };
        } catch (error) {
            return { error };
        }
    }

    async getAllAttributeSet() {
        const attributeSets = await this.productAttributeSetRepository.find();
        return { attributeSets };
    }

    async getAllAttributeValuesById(groupAttributeId: number, attributeId: number) {
        const groupAttributeInfo = await this.productAttributeRepository.findOne({ where: { ID: groupAttributeId } });
        const groupValueType = groupAttributeInfo.VALUE_TYPE;
        const groupSelectedValueField = 'GROUP_VALUE_' + groupValueType;
        const groupAttributeValues = await this.productAttributeGroupRepository
            .createQueryBuilder('product_attribute_group')
            .select(`product_attribute_group.${groupSelectedValueField}`)
            .where('product_attribute_group.GROUP_ATTRIBUTE_ID=:ID', { ID: groupAttributeId })
            .getMany();
        let groupAttributeValuesArray: Array<any>;
        groupAttributeValuesArray = [];
        groupAttributeValues.map(attribute => {
            if (!groupAttributeValuesArray.filter(value => value === attribute[groupSelectedValueField])[0]) {
                groupAttributeValuesArray.push(attribute[groupSelectedValueField]);
            }
        })

        const attributeInfo = await this.productAttributeRepository.findOne({ where: { ID: attributeId } });
        const valueType = attributeInfo.VALUE_TYPE;
        const selectedValueField = 'VALUE_' + valueType;
        const attributeValues = await this.productAttributeValueRepository
            .createQueryBuilder('product_attribute_value')
            .select(`product_attribute_value.${selectedValueField}`)
            .where('product_attribute_value.PRODUCT_ATTRIBUTE_ID=:ID', { ID: attributeId })
            .getMany();
        let valuesArray: Array<any>;
        valuesArray = [];
        attributeValues.map(attribute => {
            if (valuesArray.filter(value => value === attribute[selectedValueField]).length === 0) {
                valuesArray.push(attribute[selectedValueField]);
            }
        });
        return { groupAttributeValues: groupAttributeValuesArray, attributeValues: valuesArray };
    }

    async createAttributeGroup(createAttributeGroupDTO: CreateAttributeGroupDTO) {
        try {
            const { GROUP_ATTRIBUTE_ID, PRODUCT_INFORMATION_SID } = createAttributeGroupDTO;
            const productAttribute = await this.productAttributeRepository.findOne({ where: { ID: GROUP_ATTRIBUTE_ID } });
            const valueType = productAttribute.VALUE_TYPE;
            let attributeValue = createAttributeGroupDTO[`GROUP_VALUE_${valueType}`];
            const groupSelectedValueField = 'GROUP_VALUE_' + valueType;
            const existed = await this.productAttributeGroupRepository
                .createQueryBuilder('product_attribute_group')
                .select(`product_attribute_group`)
                .leftJoinAndSelect('product_attribute_group.productAttributeValues', 'productAttributeValues')
                .leftJoinAndSelect('product_attribute_group.productAttribute', 'productAttribute')
                .where(`product_attribute_group.PRODUCT_INFORMATION_SID='${PRODUCT_INFORMATION_SID}'`)
                .andWhere(`product_attribute_group.${groupSelectedValueField}='${attributeValue}'`)
                .getOne();
            if (existed) {
                return {
                    newAttributeGroup: existed
                }
            } else {
                const newAttributeGroup = this.productAttributeGroupRepository.create(createAttributeGroupDTO);
                await newAttributeGroup.save();
                return {
                    newAttributeGroup
                }
            }
        } catch (error) {
            return { error };
        }
    }

    async createAtrributeValue(createAttributeValueDTO: CreateAttributeValueDTO) {
        try {
            const newAttributeValue = this.productAttributeValueRepository.create(createAttributeValueDTO);
            await newAttributeValue.save();
            return { newAttributeValue };
        } catch (error) {
            return { error };
        }
    }

    async deleteProductInformation(SID: string) {
        const productInformation = await this.productInformationRepository.findOne({ where: { SID } });
        const products = productInformation.products;
        if (products) {
            const deleteImagesFiles = products.map(product => {
                const images = product.images;
                if (images.length > 0) {
                    images.map(async image => {
                        if (image.IMAGE_NAME) {
                            const imageName = image.IMAGE_NAME;
                            const filePath = path.join(__dirname, `../../../resource/uploads/images/${imageName}`);
                            await promises.unlink(filePath);
                        }
                    })
                }
            })
            await Promise.all(deleteImagesFiles);
        }
        const response = await this.productInformationRepository.delete({ SID });
        return response;
    }

    async deleteAllProductInformation() {
        const deleteResults: Array<DeleteResult> = [];
        const allProductInformation = await this.productInformationRepository.find();
        const deleteProductInfo = allProductInformation.map(async productInformation => {
            const { products } = productInformation;
            if (products) {
                const deleteImagesFiles = products.map(product => {
                    const images = product.images;
                    if (images.length > 0) {
                        images.map(async image => {
                            if (image.IMAGE_NAME) {
                                try {
                                    const imageName = image.IMAGE_NAME;
                                    const filePath = path.join(__dirname, `../../../resource/uploads/images/${imageName}`);
                                    await promises.unlink(filePath);
                                } catch (error) {

                                }
                            }
                        })
                    }
                })
                await Promise.all(deleteImagesFiles);
            }
            const response = await this.productInformationRepository.delete({ SID: productInformation.SID });
            deleteResults.push(response);
            return deleteResults;
        });
        await Promise.all(deleteProductInfo);
        return { response: deleteResults };
    }

    async createProductAttribute(createAttributeDTO: CreateAttributeDTO) {
        try {
            const newAttribute = this.productAttributeRepository.create(createAttributeDTO);
            await newAttribute.save();
            return { newAttribute };
        } catch (err) {
            return { error: err };
        }
    }

    async updateProductInformation(SID: string, updateProductInformationDTO: UpdateProductInformationDTO) {
        try {
            const updateProductInformation = await getConnection()
                .createQueryBuilder()
                .update(ProductInformation)
                .set({
                    PRODUCT_NAME: updateProductInformationDTO.PRODUCT_NAME,
                    SID_BRAND: updateProductInformationDTO.BRAND_SID,
                    THRESHOLD: updateProductInformationDTO.THRESHOLD
                })
                .where("SID = :SID", { SID })
                .execute();
            const productInformation = await this.productInformationRepository.findOne({ where: { SID } });
            if (updateProductInformationDTO.UNIT_PRICE || updateProductInformationDTO.TAX) {
                const productPrice = productInformation.productPrices.sort((a, b) => new Date(b.CREATED_DATETIME.toString()).getTime() - new Date(a.CREATED_DATETIME.toString()).getTime())[0];
                let newUnitPrice = 0;
                if (updateProductInformationDTO.UNIT_PRICE) {
                    newUnitPrice = updateProductInformationDTO.UNIT_PRICE;
                } else {
                    newUnitPrice = productPrice.UNIT_PRICE;
                }
                let tax = 0;
                if (updateProductInformationDTO.TAX) {
                    tax = updateProductInformationDTO.TAX;
                } else {
                    tax = productPrice.TAX;
                }
                const discount = productPrice.DISCOUNT;
                try {
                    const newProductPrice = this.productPriceRepository.create({
                        UNIT_PRICE: updateProductInformationDTO.UNIT_PRICE,
                        DISCOUNT: discount,
                        TAX: tax,
                        SID_PRODUCT_INFORMATION: productInformation.SID,
                    });
                    await newProductPrice.save();
                } catch (error) {
                    console.log(error);
                    return { error };
                }
            }
            return { productInformation };
        } catch (error) {
            console.log(error);
            return { error };
        }
    }

    async updateProduct(SID: string, updateProductDTO: UpdateProductDTO) {
        try {
            const productToUpdate = await this.productRepository.findOne({ where: { SID } });
            const currentQTY = productToUpdate.QTY;
            if (currentQTY !== updateProductDTO.QTY) {
                productToUpdate.QTY = updateProductDTO.QTY;
            }
            const attributeValueId = updateProductDTO.ATTRIBUTE_VALUE_ID;
            const newAttributeValue = updateProductDTO.NEW_ATTRIBUTE_VALUE;
            const attributeValueToUpdate = await this.productAttributeValueRepository.findOne({ where: { ID: attributeValueId } });
            const valueType = attributeValueToUpdate.productAttribute.VALUE_TYPE;
            attributeValueToUpdate[`VALUE_${valueType}`] = newAttributeValue;
            await attributeValueToUpdate.save();
            await productToUpdate.save();
            if (currentQTY !== updateProductDTO.QTY) {
                const newInventoryHistory = this.inventoryHistoryRepository.create({
                    QTY: updateProductDTO.QTY,
                    ORIGINAL_QTY: currentQTY,
                    PRODUCT_SID: SID
                });
                await newInventoryHistory.save();
            }
            return { productToUpdate };
        } catch (error) {
            console.log(error);
            return { error };
        }
    }

    async updatePrismQTY(updatePrismQtyDTO: UpdatePrismQtyDTO) {
        const { products } = updatePrismQtyDTO;
        let successProducts: Array<Product> = [];
        let failedProducts: Array<Product> = [];
        const updateProducts = products.map(async product => {
            const UPC = product.UPC;
            const QTY = product.QTY;
            const TYPE = product.TYPE;
            const productToUpdate = await this.productRepository.findOne({ where: { UPC } });
            if (productToUpdate) {
                const SID = productToUpdate.SID;
                const currentQty = productToUpdate.QTY;
                if (TYPE === 0) {
                    productToUpdate.QTY = currentQty - QTY;
                    await productToUpdate.save();
                    const newInventoryHistory = this.inventoryHistoryRepository.create({
                        QTY: currentQty - QTY,
                        ORIGINAL_QTY: currentQty,
                        PRODUCT_SID: SID
                    });
                    await newInventoryHistory.save();
                } else if (TYPE === 1) {
                    productToUpdate.QTY = currentQty + QTY;
                    await productToUpdate.save();
                    const newInventoryHistory = this.inventoryHistoryRepository.create({
                        QTY: currentQty + QTY,
                        ORIGINAL_QTY: currentQty,
                        PRODUCT_SID: SID
                    });
                    await newInventoryHistory.save();
                }
                successProducts.push(productToUpdate);
            } else {
                failedProducts.push(productToUpdate);
            }
        })
        await Promise.all(updateProducts);
        return {
            successProducts,
            failedProducts
        }
    }

    async getProductListAll() {
        const response = await this.productRepository.createQueryBuilder("product")
                                        .select()
                                        .leftJoinAndSelect("product.productInformation", "productInformation")
                                        .leftJoinAndSelect("product.productAttributeValues","productAttributeValues")
                                        .leftJoinAndSelect("productAttributeValues.productAttributeGroup","productAttributeGroup")
                                        .getMany();
        // const response = await this.productRepository.query(`select a.*, b.VALUE_VARCHAR, b.VALUE_DECIMAL, c.PRODUCT_NAME from product as a
        //                 inner join product_attribute_value as b on a.SID = b.SID_PRODUCT
        //                 inner join product_information as c on a.SID_PRODUCT_INFORMATION = c.SID`);
        return response;
    }


    async getBrandSID(NAME: string) {
        const brand = await this.productBrandRepository.findOne({ NAME });
        return { BRAND_SID: brand.SID };
    }

    async checkIfSKUValid(SKU: string) {
        let isValid = true;
        const productInfo = await this.productInformationRepository.findOne({ where: { SKU } });
        if (productInfo) {
            isValid = false;
        }
        return isValid;
    }

    async checkIfCategoryValid(CATEGORY_NAME: string) {
        let isValid = true;
        const category = await this.categoryRepository.findOne({ where: { CATEGORY_NAME } });
        if (category) {
            isValid = false;
        }
        return isValid;
    }

    async checkIfBrandValid(BRAND_NAME: string) {
        let isValid = true;
        const brand = await this.productBrandRepository.findOne({ where: { NAME: BRAND_NAME } });
        if (brand) {
            isValid = false;
        }
        return isValid;
    }
}