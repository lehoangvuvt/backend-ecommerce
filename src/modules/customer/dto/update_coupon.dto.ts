import {IsBoolean} from 'class-validator'

class UpdateCoupon {
    @IsBoolean()
    ACTIVE: boolean;
}

export default UpdateCoupon