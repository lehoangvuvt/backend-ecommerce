import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CategoryType } from "../../types/types";
import { ILike, Repository } from "typeorm";
import ProductCategory from "../product/product_category.entity";
import Category from "./category.entity";
import CreateCategoryDTO from "./dto/create-category.dto";

@Injectable()
export default class CategoryService {
    constructor(
        @InjectRepository(Category) private categoryRepository: Repository<Category>,
        @InjectRepository(ProductCategory) private productCategoryRepository: Repository<ProductCategory>,
    ) { }

    async createCategory(createCategoryDTO: CreateCategoryDTO) {
        try {
            const { CATEGORY_NAME, LONG_DESCRIPTION, SHORT_DESCRIPTION } = createCategoryDTO;
            let CATEGORY_CODE = "";
            if (createCategoryDTO.CATEGORY_CODE) {
                CATEGORY_CODE = createCategoryDTO.CATEGORY_CODE;
            } else {
                CATEGORY_CODE = CATEGORY_NAME.replace(" ", "").toUpperCase();
            }
            const newCategory = this.categoryRepository.create({
                CATEGORY_CODE,
                CATEGORY_NAME,
                LONG_DESCRIPTION,
                SHORT_DESCRIPTION
            });
            await newCategory.save();
            return { category: newCategory };
        } catch (error) {
            return { error: error };
        }
    }

    async getAllCategories() {
        const categories = await this.categoryRepository.find();
        return {
            categories
        };
    }

    async getCategorySID(CATEGORY_NAME: string) {
        const brand = await this.categoryRepository.findOne({ CATEGORY_NAME });
        return { CATEGORY_SID: brand.SID };
    }

    async getCategoryDetails(SID: string) {
        const category = await this.categoryRepository.findOne({ where: { SID } });
        return { category };
    }

    async getCategoriesBySegment(name: string) {
        const categories = await this.categoryRepository
            .createQueryBuilder('category')
            .select('category')
            .where(`CATEGORY_CODE Like '%${name.toUpperCase()}%'`)
            .getMany();
        let notEmptyCategories: Array<CategoryType> = [];
        // const getNotEmptyCategories = categories.map(async category => {
        //     const productInformation = await this.productCategoryRepository.findOne({ where: { SID_CATEGORY: category.SID } });
        //     if (productInformation) {
        //         notEmptyCategories.push(category);
        //     }
        //     return notEmptyCategories;
        // })
        // await Promise.all(getNotEmptyCategories);
        return { categories: categories };
    }
}