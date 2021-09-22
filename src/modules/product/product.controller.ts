import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { Response, Request } from 'express';
import { RoleGuard } from "../../auth/role.guard";
import { TokenGuard } from "../../auth/token.guard";
import AddCategoriesForProductDTO from "./dto/add-categories-for-product.dto";
import CreateAttributeGroupDTO from "./dto/create-attribute-group.dto";
import CreateAttributeSetDTO from "./dto/create-attribute-set.dto";
import CreateAttributeValueDTO from "./dto/create-attribute-value.dto";
import CreateProductBrandDTO from "./dto/create-product-brand.dto";
import CreateProductInformationDTO from "./dto/create-product-information.dto";
import CreateProductDTO from "./dto/create-product.dto";
import ProductService from "./product.service";
import * as path from 'path';
import CreateAttributeDTO from "./dto/create-attribute.dto";
import UpdateProductInformationDTO from "./dto/update-product-info.dto";
import UpdateProductDTO from "./dto/update-product.dto";
import AddPrismImagesDTO from "./dto/add-prism-images.dto";
import UpdatePrismQtyDTO from "./dto/update-prism-qty.dto";
import { JwtService } from "@nestjs/jwt";
import { tokenConfig } from "../../config/token.config";

@Controller("products")
export default class ProductController {
    constructor(
        private readonly service: ProductService,
        private jwtService: JwtService,
    ) { }

    @Post('/product-information/create')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async createProductInformation(
        @Body() createProductInformationDTO: CreateProductInformationDTO,
        @Res() res: Response
    ) {
        const response = await this.service.createNewProductInformation(createProductInformationDTO);
        if (response.error) return res.json({ error: response.error });
        return res.json({ productInformation: response.productInformation });
    }

    @Post('/product/create')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async createProduct(
        @Body() createProductDTO: CreateProductDTO,
        @Res() res: Response,
    ) {
        const response = await this.service.createNewProduct(createProductDTO);
        if (response.error) return res.json({ error: response.error });
        return res.json({
            product: response.product
        });
    }

    @Post('/brand/create')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async createBrand(
        @Body() createProductBrandDTO: CreateProductBrandDTO,
        @Res() res: Response,
    ) {
        const response = await this.service.createProductBrand(createProductBrandDTO);
        if (response.error) return res.json({ error: response.error });
        return res.json({
            productBrand: response.productBrand,
        });
    }

    @Get()
    async searchProductsForCustomerPage(
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const query = req.query;
        const role = 'customer';
        const response = await this.service.findProducts(query, role);
        return res.json({
            products: response.products,
            categories: response.categroies,
            brands: response.brands,
            sizes: response.sizes,
            max_price: response.max_price,
            total_pages: response.total_pages,
            attributes: response.attributes,
            total_records: response.total_records,
        })
    }

    @Get('/admin-search')
    async searchProductsForAdminPage(
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const query = req.query;
        const role = 'admin';
        const response = await this.service.findProducts(query, role);
        return res.json({
            products: response.products,
            categories: response.categroies,
            brands: response.brands,
            sizes: response.sizes,
            max_price: response.max_price,
            total_pages: response.total_pages,
            attributes: response.attributes,
            total_records: response.total_records,
        })
    }

    @Post('/add-categories')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async addCategoriesForProduct(
        @Body() addCategoriesForProductDTO: AddCategoriesForProductDTO,
        @Res() res: Response,
    ) {
        const response = await this.service.addCategoriesForProduct(addCategoriesForProductDTO);
        return res.json({
            success: response.success,
            failed: response.failed
        });
    }

    @Post('/add-images')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async addImagesToProduct(
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const PRODUCT_SID = req.body.PRODUCT_SID;
        const imageFiles = req.files;
        const response = await this.service.addProductImages(PRODUCT_SID, imageFiles);
        return res.json({
            success: response.success,
        })
    }

    @Post('/add-prism-images/:SID')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async addPrismImages(
        @Body() addAddPrismImagesDTO: AddPrismImagesDTO,
        @Param('SID') SID: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const response = await this.service.addPrismImages(SID, addAddPrismImagesDTO);
        return res.json({
            success: response.success,
        })
    }

    @Get('/auto-complete/:searchString')
    async autoComplete(
        @Param('searchString') search_string: string,
        @Res() res: Response
    ) {
        const response = await this.service.autoComplete(search_string.trim());
        return res.json({
            terms: response.terms,
        });
    }

    @Get('/product-information/:sid')
    async getProduct(
        @Param('sid') SID: string,
        @Res() res: Response,
    ) {
        const response = await this.service.getProductDetail(SID);
        if (response.error) return res.json({ error: response.error });
        return res.json({
            productInformation: response.productInformation,
            productByGroupedAttribute: response.productByGroupedAttribute,
        })
    }

    @Get('/getProductRecommend')
    async getProductRecommend(
        @Query('CATEGORY') CATEGORY_SID: string,
        @Query('TSID') PRODUCT_SID: string,
        @Query('CUST_SID') CUST_SID: String,
        @Query('BRAND_SID') BRAND_SID: String,
        @Res() res: Response,
    ) {

        const response = await this.service.getProductRecommend(CATEGORY_SID, PRODUCT_SID, CUST_SID, BRAND_SID);
        return res.json({
            details: response
        })
    }
    @Get('/getProductIndex')
    async getProductIndex(
        @Res() res: Response,
    ) {

        const response = await this.service.getProductIndex();
        return res.json({
            details: response
        })
    }
    @Get('/brands')
    async getAllBrands(
        @Res() res: Response
    ) {
        const response = await this.service.getProductBrands();
        return res.json({ brands: response.brands })
    }

    @Get('/attributes')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async getAllAttributes(
        @Res() res: Response,
    ) {
        const response = await this.service.getAllAttributes();
        return res.json({ attributes: response.attributes });
    }

    @Post('/attribute-set/create')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async createAttributeSet(
        @Body() createAttributeSetDTO: CreateAttributeSetDTO,
        @Res() res: Response
    ) {
        const response = await this.service.createProductAttributeSet(createAttributeSetDTO);
        if (response.error) return res.json({ error: response.error });
        return res.json({ attributeSet: response.newSet });
    }

    @Get('/attribute-set')
    async getAllAttributeSet(
        @Res() res: Response
    ) {
        const response = await this.service.getAllAttributeSet();
        return res.json({
            attributeSets: response.attributeSets
        })
    }

    @Post('/attribute/values')
    async getAllAttributeValuesById(
        @Body('groupAttributeId') groupAttributeId: number,
        @Body('attributeId') attributeId: number,
        @Res() res: Response
    ) {
        const response = await this.service.getAllAttributeValuesById(groupAttributeId, attributeId);
        return res.json({
            groupAttributeValues: response.groupAttributeValues,
            attributeValues: response.attributeValues,
        })
    }

    @Post('/attribute-group/create')
    async createAttributeGroup(
        @Body() createAttributeGroupDTO: CreateAttributeGroupDTO,
        @Res() res: Response,
    ) {
        const response = await this.service.createAttributeGroup(createAttributeGroupDTO);
        if (response.error) return res.json({ error: response.error });
        return res.json({ newAttributeGroup: response.newAttributeGroup });
    }

    @Post('/attribute-value/create')
    async createAttributeValue(
        @Body() createAttributeValueDTO: CreateAttributeValueDTO,
        @Res() res: Response,
    ) {
        const response = await this.service.createAtrributeValue(createAttributeValueDTO);
        if (response.error) return res.json({ error: response.error });
        return res.json({ newAttributeValue: response.newAttributeValue });
    }

    @Delete('/product-information/:sid')
    async deleteProductInformation(
        @Param('sid') sid: string,
        @Res() res: Response,
    ) {
        if (sid !== 'all') {
            const response = await this.service.deleteProductInformation(sid);
            return res.json({ response: response });
        } else {
            const response = await this.service.deleteAllProductInformation();
            return res.json({ response: response });
        }

    }

    @Get('/brand/:name')
    async getBrandSID(
        @Param('name') NAME: string,
        @Res() res: Response,
    ) {
        const response = await this.service.getBrandSID(NAME);
        return res.json({
            BRAND_SID: response.BRAND_SID,
        })
    }

    @Get('/image/:name')
    async getImage(
        @Param('name') name: string,
        @Res() res: Response,
    ) {
        const filePath = path.join(__dirname, `../../../resource/uploads/images/${name}`);
        res.sendFile(filePath, (err) => {
            if (err) {
                res.json({ error: err.message });
            }
        });
    }

    @Post('/attributes')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async createNewAttribute(
        @Body() createAttributeDTO: CreateAttributeDTO,
        @Res() res: Response
    ) {
        const response = await this.service.createProductAttribute(createAttributeDTO);
        if (response.error) return res.json({ error: response.error });
        return res.json({ newAttribute: response.newAttribute });
    }

    @Put('/product-information/update/:SID')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async updateProductInformation(
        @Param('SID') SID: string,
        @Body() updateProductInformationDTO: UpdateProductInformationDTO,
        @Res() res: Response,
    ) {
        const response = await this.service.updateProductInformation(SID, updateProductInformationDTO);
        if (response.error) return res.json({ error: response.error });
        return res.json({ productInformation: response.productInformation });
    }

    @Put('/product/update/:SID')
    // @UseGuards(TokenGuard, RoleGuard('admin'))
    async updateProduct(
        @Param('SID') SID: string,
        @Body() updateProductDTO: UpdateProductDTO,
        @Res() res: Response,
    ) {
        const response = await this.service.updateProduct(SID, updateProductDTO);
        if (response.error) return res.json({ error: response.error });
        return res.json({ product: response.productToUpdate });
    }

    @Put('/update-prism-qty')
    async updatePrismQty(
        @Body() updatePrismQtyDTO: UpdatePrismQtyDTO,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (req.headers.authorization) {
            const token = req.headers.authorization.toString();
            try {
                const decoded = await this.jwtService.verifyAsync(token, { secret: tokenConfig.prism_token_secret_key });
                if (decoded) {
                    const response = await this.service.updatePrismQTY(updatePrismQtyDTO);
                    return res.json({
                        successProducts: response.successProducts,
                        failedProducts: response.failedProducts
                    })
                } else {
                    throw new UnauthorizedException;
                }
            } catch (error) {
                throw new UnauthorizedException;
            }
        } else {
            throw new UnauthorizedException;
        }
    }

    @Get('/product/all')
    async getListProduct(
        @Req() req: any,
        @Res() res: Response
    ) {
        const response = await this.service.getProductListAll();
        return res.status(200).json(response);
    }

    @Get('/import-check/sku/:sku')
    async checkIfSKUValid(
        @Param('sku') SKU: string,
        @Res() res: Response
    ) {
        const isValid = await this.service.checkIfSKUValid(SKU);
        return res.json({
            isValid: isValid
        })
    }

    @Get('/import-check/category/:name')
    async checkIfCategoryValid(
        @Param('name') CATEGORY_NAME: string,
        @Res() res: Response
    ) {
        const isValid = await this.service.checkIfCategoryValid(CATEGORY_NAME);
        return res.json({
            isValid: isValid
        })
    }

    @Get('/import-check/brand/:name')
    async checkIfBrandValid(
        @Param('name') BRAND_NAME: string,
        @Res() res: Response
    ) {
        const isValid = await this.service.checkIfBrandValid(BRAND_NAME);
        return res.json({
            isValid: isValid
        })
    }

    @Get('/get-all')
    async getAllProducts(
        @Res() res: Response,
    ) {
        const response = await this.service.getAllProducts();
        return res.json({ allProducts: response.allProducts });
    }

    // @Put('/updateProductByUPC/:UPC')
    // async updateProductByUPC(
    //     @Param('UPC') UPC: string,
    //     @Body() updateProductByUPCDTO: UpdateProductByUPCDTO,
    //     @Req() req: any,
    //     @Res() res: Response
    // ) {
    //     const response = await this.service.updateProductByUPC(UPC, updateProductByUPCDTO);
    //     return res.status(200).json({ productToUpdate: response.productToUpdate });
    // }
}