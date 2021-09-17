import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import CreateShippingMethodDTO from "../dto/create_shipping_method.dto";
import ShippingMethod from "../entity/shipping_method.entity";

@Injectable()
export default class ShippingService {
    constructor(
        @InjectRepository(ShippingMethod) private shippingMethodRepositoty: Repository<ShippingMethod>,
    ) { }

    async getAllShippingMethods() {
        const shippingMethods = await this.shippingMethodRepositoty.find();
        return { shippingMethods };
    }

    async getShippingDetails(ID: number) {
        const shippingMethod = await this.shippingMethodRepositoty.findOne({ where: { ID } });
        return { shippingMethod };
    }

    async createShippingMethod(createShippingMethodDTO: CreateShippingMethodDTO) {
        const { DESCRIPTION, FLAT_PRICE, SHIPPING_METHOD_NAME } = createShippingMethodDTO;
        try {
            const newShippingMethod = this.shippingMethodRepositoty.create({
                SHIPPING_METHOD_NAME,
                DESCRIPTION,
                FLAT_PRICE
            });
            await newShippingMethod.save();
            return { newShippingMethod };
        } catch (error) {
            return { error };
        }
    }

    async updateShippingMethod(updateShippingMethodDTO: CreateShippingMethodDTO, ID: number) {
        const { DESCRIPTION, FLAT_PRICE, SHIPPING_METHOD_NAME } = updateShippingMethodDTO;
        try {
            const shippingMethodToBeUpdated = await this.shippingMethodRepositoty.findOne({ where: { ID } });
            if (shippingMethodToBeUpdated) {
                shippingMethodToBeUpdated.SHIPPING_METHOD_NAME = SHIPPING_METHOD_NAME;
                shippingMethodToBeUpdated.DESCRIPTION = DESCRIPTION;
                shippingMethodToBeUpdated.FLAT_PRICE = FLAT_PRICE;
                await shippingMethodToBeUpdated.save();
                return {
                    updateShippingMethodDTO: shippingMethodToBeUpdated,
                }
            } else {
                return {
                    error: "Cannot find any shipping method with that ID"
                };
            }
        } catch (error) {
            return { error };
        }
    }
}