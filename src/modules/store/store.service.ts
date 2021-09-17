import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import CreateStoreDTO from "./dto/create-store.dto";
import Store from "./store.entity";
import StoreEcom from "./store_ecom.entity";

@Injectable()
class StoreService {
    constructor(
        @InjectRepository(Store) private storeRepository: Repository<Store>,
        @InjectRepository(StoreEcom) private storeEcomRepository: Repository<StoreEcom>
    ) { }

    async createStore(createStoreDTO: CreateStoreDTO) {
        try {
            const store = this.storeRepository.create(createStoreDTO);
            await store.save();
            return { store };
        } catch (error) {
            return { error }
        }
    }

    async getAllStores() {
        try {
            const stores = await this.storeRepository.find();
            return { stores }
        } catch (error) {
            return { error };
        }
    }

    async postStoreDefaultEcom(store_code: string) {
        const storeEcom = await this.storeEcomRepository.count();
        if (storeEcom === 1) {
            const storeCode = await this.storeEcomRepository.createQueryBuilder("store_ecom").update().set({STORE_CODE: store_code}).execute();
            return storeCode;
        }
        else if (storeEcom === 0) {
            const newStoreCode = await this.storeEcomRepository.create({STORE_CODE: store_code});
            await newStoreCode.save();
            return newStoreCode;
        }
        return "";
    }

    async getStoreDefaultEcom() {
        const storeDefaultEcom = await this.storeEcomRepository.findOne();
        if (storeDefaultEcom === undefined) return {store_default: {STORE_CODE: ""}}
        return {
            store_default: storeDefaultEcom
        }
    }
}

export default StoreService;