import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import PromotionDTO from "./dto/promotion.dto";
import Promotion from "./promotion.entity";
import PromotionPriceLevel from "./promotion_price_level.entity";
import PromotionValidationFilterElement from "./promotion_validation_filter_element.entity";
import PromotionValidationItemRule from "./promotion_validation_item_rule.entity";
import * as moment from 'moment';
import PromotionImages from "./promotion_images.entity";
import Product from "../product/product.entity";
import PromotionValidationCustomerLoyalty from "./promotion_validation_customer_loyalty.entity";
import PromotionRewardDiscountItem from "./promotion_reward_discount_item.entity";

@Injectable() 
class PromotionService {
    constructor(
        @InjectRepository(Promotion) private promotionRepository: Repository<Promotion>,
        @InjectRepository(PromotionPriceLevel) private promotionPriceLevelRepository: Repository<PromotionPriceLevel>,
        @InjectRepository(PromotionValidationItemRule) private promotionValidationItemRuleRepository: Repository<PromotionValidationItemRule>,
        @InjectRepository(PromotionValidationFilterElement) private promotionValidataionFilterElementRepository: Repository<PromotionValidationFilterElement>,
        @InjectRepository(PromotionImages) private promotionImageRepository: Repository<PromotionImages>,
        @InjectRepository(Product) private productRepository: Repository<Product>,
        @InjectRepository(PromotionValidationCustomerLoyalty) private promotionValidCustomerLoyaltyRepository: Repository<PromotionValidationCustomerLoyalty>,
        @InjectRepository(PromotionRewardDiscountItem) private promotionRewardDiscountItemRepository: Repository<PromotionRewardDiscountItem>,
        private jwtService: JwtService
    ) {}

    async createNewPromotion(body: PromotionDTO) {
          const newPromotion = this.promotionRepository.create(body);
          await newPromotion.save();
          return newPromotion;
    }

    async getListPromotionByTime(tid: string) {
        let response;
        let date = moment(new Date());
        let today = date.format('yyyy-MM-DD');
        let time = date.hour() * 3600 + date.minute() * 60 + date.second();
        if (tid === "0") {
            response = await this.promotionRepository.query(`
                select * from promotion 
                where ('${today}' > START_DATE and '${today}' < END_DATE) or ('${today}' = START_DATE and '${time}' > START_TIME) or ('${today}' = END_DATE and '${time}' < END_TIME)
            `)
            return response;
        }
        else if (tid === '1') {
            response = await this.promotionRepository.query(`
            select * from promotion 
            where ('${today}' > END_DATE) or ('${today}' = END_DATE and '${time}' > END_TIME)
         `)
        return response;
        }
        else if (tid === '2') {
            response = await this.promotionRepository.query(`
                select * from promotion
            `)
            return response;
        }
        return "";
    }

    async updateActivePromotion(sid: string, value: string) {
        const promotion = await this.promotionRepository.createQueryBuilder("promotion").update().set({ACTIVE: value === '1' ? true: false}).where("SID = :sid", {sid});
        await promotion.execute();
        return promotion;
    }

    async postImageFiles(PROMOTION_SID: string, imageFiles: Express.Multer.File[] | {
        [fieldname: string]: Express.Multer.File[] }) {
            let successImgs = [];
            successImgs = [];
            for (let i = 0; i < imageFiles.length; i++) {
                const imgName = imageFiles[i].filename;
                const newImage = this.promotionImageRepository.create({ IMAGE_TYPE: 1, IMAGE_NAME: imgName, PROMOTION_SID });
                await newImage.save();
                successImgs.push(newImage);
            }
            return { success: successImgs };
        }
    async deletePromotionWithSID(sid: string) {
        const promotion = await this.promotionRepository.find({where: {SID: sid}});
        await this.promotionRepository.remove(promotion);
        return 1;
    }

    async getPromotionImage() {
        const promotionImages = await this.promotionImageRepository.createQueryBuilder("promotion_images").select(["promotion_images.IMAGE_NAME"]).getMany();
        return promotionImages;
    }

    async getPromotionBySID(sid: string) {
        const promotion = await this.promotionRepository.createQueryBuilder("promotion")
                                    .select()
                                    .leftJoinAndSelect("promotion.priority","priority")
                                    .leftJoinAndSelect("promotion.validation_customer_loyalty","validation_customer_loyalty")
                                    .leftJoinAndSelect("promotion.images","images")
                                    .leftJoinAndSelect("promotion.reward_discount_item", "reward_discount_item")
                                    .where("promotion.SID = :sid", {sid}).getOne();
        const rewardSID = await this.productRepository.createQueryBuilder("product")
                                .select()
                                .leftJoinAndSelect("product.productInformation", "productInformation")
                                .leftJoinAndSelect("product.productAttributeValues","productAttributeValues")
                                .leftJoinAndSelect("productAttributeValues.productAttributeGroup","productAttributeGroup")
                                .where("product.SID = :SID", {SID: promotion.REWARD_ITEMS_SID})
                                .getOne();
        let reward_discount_item = []
        let iteration = promotion.reward_discount_item.map(async (item) => {
            const it = await this.productRepository.createQueryBuilder("product")
                                .select()
                                .leftJoinAndSelect("product.productInformation", "productInformation")
                                .leftJoinAndSelect("product.productAttributeValues","productAttributeValues")
                                .leftJoinAndSelect("productAttributeValues.productAttributeGroup","productAttributeGroup")
                                .where("product.SID = :SID", {SID: item.SID_PRODUCT})
                                .getOne();
            reward_discount_item.push({...it, DISC_VALUE: item.DISC_VALUE});
        })
        await Promise.all(iteration);
        delete promotion.reward_discount_item;
        return {...promotion, rewardSID, reward_discount_item };
    }

    async getPromotionWithActive() {
        const promotion = await this.promotionRepository.createQueryBuilder("promotion")
                                    .select()
                                    .where("promotion.ACTIVE = :active", {active: true})
                                    .getMany();
        return promotion;
    }

    async updatePromotion(sid: string, body: PromotionDTO) {
        const promotion = await this.promotionRepository.findOne({where: {SID: sid}})
        const exclude = ["item_rule", "validation_customer_loyalty", "reward_discount_item", "priority"];
        for(const column in body) {
            if (exclude.includes(column)) continue;
            promotion[column] = body[column];
        }
        promotion.MODIFIED_DATETIME = new Date();
        await promotion.save();
        //Process promotion validation customer loyalty
        let setLoyalty: Set<{LOYALTY_SID: string; name: string}> = new Set();
        for(let index = 0; index < body.validation_customer_loyalty.length; index++) {
            setLoyalty.add(body.validation_customer_loyalty[index]);
        }
        const promoValidCustLoyal = await this.promotionValidCustomerLoyaltyRepository.find({where: {PROMO_SID: promotion.SID}});
        for (let index = 0; index < promoValidCustLoyal.length; index++) {
            const key: {LOYALTY_SID: string; name: string} = {name: promoValidCustLoyal[index].name, LOYALTY_SID: promoValidCustLoyal[index].LOYALTY_SID}
            const check: boolean = setLoyalty.has(key);
            if (check === false) {
                await promoValidCustLoyal[index].remove();
            }
            setLoyalty.delete(key);
        }
        console.log('1');
        for (let key of setLoyalty) {
            const newLoyalty = await this.promotionValidCustomerLoyaltyRepository.create({
                ...key,
                PROMO_SID: promotion.SID
            })
            await newLoyalty.save();
        }
        //Process reward discount item
        console.log('1');
        await this.promotionRewardDiscountItemRepository.delete({SID_PROMOTION: promotion.SID});
        await this.promotionRewardDiscountItemRepository.createQueryBuilder("promotion_reward_discount_item")
                    .insert()
                    .values(body.reward_discount_item.map(item => {
                        return {
                            SID: 'abcdef',
                            SID_PRODUCT: item.SID_PRODUCT,
                            DISC_VALUE: item.DISC_VALUE,
                            SID_PROMOTION: promotion.SID
                        }
                    }))
                    .execute();
        return "success";
    }
}

export default PromotionService;