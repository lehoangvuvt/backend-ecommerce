
export interface CategoryType {
    SID: string;
    CREATED_BY: string;
    CREATED_DATETIME: Date;
    MODIFIED_DATETIME: Date;
    MODIFIED_BY: string;
    CATEGORY_NAME: string;
    SHORT_DESCRIPTION: string;
    LONG_DESCRIPTION: string;
}

export interface ProductInformationType {
    SID: string;
    SID_BRAND: string;
    CREATED_DATETIME: Date;
    MODIFIED_DATETIME: Date;
    PRODUCT_NAME: string;
    SKU: string;
    LONG_DESCRIPTION: string;
    SHORT_DESCRIPTION: string;
    THRESHOLD: number;
    CAN_PREORDER: boolean;
    PRODUCT_GENDER: 'Men' | 'Women' | 'Both';
    products: ProductType[];
    categoryConnections: ProductCategoryType[];
    productBrand: ProductBrandType;
    productReviews: ProductReviewType[];
    productPrices: ProductPriceType[];
    productAttributeGroups: ProductAttributeGroupType[];
    SELLABLE_QTY?: number;
}

export interface ProductAttributeGroupType {
    ID: number;
    PRODUCT_INFORMATION_SID: string;
    GROUP_ATTRIBUTE_ID: number;
    GROUP_VALUE_VARCHAR: string;
    GROUP_VALUE_INT: number;
    GROUP_VALUE_DECIMAL: number;
    GROUP_VALUE_DATETIME: Date;
    CREATED_DATETIME: Date;
    MODIFIED_DATETIME: Date;
    productAttributeValues: ProductAttributeValueType[];
    productAttribute: ProductAttributeType;
}

export interface ProductPriceType {
    ID: number;
    SID_PRODUCT_INFORMATION: string;
    CREATED_DATETIME: Date;
    UNIT_PRICE: number;
    TAX: number;
    DISCOUNT: number;
}

export interface ProductReviewType {
    ID: number;
    SID_PRODUCT_INFORMATION: string;
    CREATED_BY: string;
    CREATED_DATETIME: Date;
    MODIFIED_DATETIME: Date;
    CONTENT: string;
    RATING: number;
    productInformation: ProductInformationType;
}

export interface ProductBrandType {
    SID: string;
    CREATED_DATETIME: Date;
    MODIFIED_DATETIME: Date;
    NAME: string;
}

export interface ProductType {
    SID: string;
    SID_PRODUCT_INFORMATION: string;
    QTY: number;
    CREATED_DATETIME: Date;
    MODIFIED_DATETIME: Date;
    images: ProductImageType[];
    discount_promotion?: DiscountPromotionType[];
}

export interface DiscountPromotionType {
    SID: string;
    SID_PRODUCT: string;
    SID_PROMOTION: string;
    DISC_VALUE: number;
    promotion: PromotionType;
}

export interface PromotionType {
    SID: string;
    ACTIVE: boolean;
    DESCRIPTION: string;
    CREATED_BY: string;
    PROMO_NAME: string;
    DISCOUNT_REASON: string;
    PROMO_GROUP: string;
    PROMO_TYPE: number;
    START_DATE: Date;
    END_DATE: Date;
    START_TIME: number;
    END_TIME: number;
    USE_STORES: boolean;
    USE_PRICE_LEVEL: boolean;
    CAN_BE_COMBINED: boolean;
    APPLY_COUNT: number;
    VALIDATION_USE_ITEMS: boolean;
    VALIDATION_USE_SUBTOTAL: boolean;
    VALIDATION_SUBTOTAL: number;
    VALIDATION_USE_COUPON: boolean;
    VALIDATION_USE_CUSTOMERS: boolean;
    VALIDATION_CUSTOMER_FILTER: number;
    REWARD_VALIDATION_ITEMS: boolean;
    REWARD_VALIDATION_MODE: number;
    REWARD_VALIDATION_DISC_TYPE: number;
    REWARD_VALIDATION_DISC_VALUE: number;
    REWARD_TRANSACTION: boolean;
    REWARD_TRANSACTION_MODE: number;
    REWARD_TRANSACTION_DISC_TYPE: number;
    REWARD_TRANSACTION_DISC_VALUE: number;
    item_rule: PromotionValidationItemRuleType[];
    priority: PromotionPriorityType;
}

export interface PromotionPriorityType {
    PROMOTION_SID: string;
    LEVEL: number;
}

export interface PromotionValidationItemRuleType {
    CREATED_BY: string;
    SUBTOTAL: number;
    filter_element: PromotionValidationFilterElementType[];
}

export interface PromotionValidationFilterElementType {
    CREATED_BY: string;
    FIELD: string;
    OPERATOR: number;
    OPERAND: string;
    JOIN_OPERATOR: number;
}

export interface CartItemType {
    SID: string;
    SID_PRODUCT_INFORMATION: string;
    QTY: number;
    CREATED_DATETIME: Date;
    MODIFIED_DATETIME: Date;
    images: ProductImageType[];
    price: number;
}

export interface ProductAttributeType {
    ID: number;
    ATTRIBUTE_NAME: string;
    LABEL_TEXT: string;
    CREATED_DATETIME: Date;
    MODIFIED_DATETIME: Date;
}

export interface ProductAttributeValueType {
    ID: number;
    SID_PRODUCT: string;
    PRODUCT_ATTRIBUTE_ID: number;
    CREATED_DATETIME: Date;
    MODIFIED_DATETIME: Date;
    VALUE_VARCHAR: string;
    VALUE_INT: number;
    VALUE_DECIMAL: number;
    VALUE_DATETIME: Date;
    product: ProductType;
    productAttribute: ProductAttributeType;
}

export interface ProductCategoryType {
    SID_PRODUCT: string;
    SID_CATEGORY: string;
    category: CategoryType;
}

export interface ProductImageType {
    SID: string;
    PRODUCT_SID: string;
    CREATED_BY: string;
    CREATED_DATETIME: Date;
    MODIFIED_DATETIME: Date;
    MODIFIED_BY: string;
    PRISM_URL: string;
    IMAGE_TYPE: number;
    IMAGE_NAME: string;
}

export interface UserTokenRequestInfoType {
    customer: {
        SID: string;
        ROLE: String;
    }
}

export interface SizesType {
    PRODUCT_SIZE: string;
    QUANTITY: number;
}

export interface FailAddedCategoryIdType {
    CATEGORY_SID: string;
    PRODUCT_SID: string;
    error: string;
}

export interface OutOfStockItemType {
    SID_PRODUCT: string;
    exceedQty: number;
}

export interface OrderType {
    ID: number;
    CREATED_DATETIME: Date;
    MODIFIED_DATETIME: Date;
    MODIFIED_BY: string;
    STATUS: number;
    SID_CUSTOMER: string;
    SESSION_ID: string;
    IP_ADDRESS: string;
    EMAIL: string;
    S_FIRST_NAME: string;
    S_LAST_NAME: string;
    S_COMPANY: string;
    S_STREET_ADDRESS: string;
    S_COUNTRY: string;
    S_CITY: string;
    S_DISTRICT: string;
    S_ZIP_CODE: string;
    S_PHONE: string;
    S_TYPE: number;
    P_TYPE: number;
    SHIPPING_AMT: number;
    DISC_PERC: number;
    DISC_AMT: number;
    TRANSACTION_SUBTOTAL: number;
    TRANSACTION_TOTAL_TAX_AMT: number;
    TRANSACTION_TOTAL_AMT: number;
    TRANSACTION_TOTAL_WITH_TAX: number;
    TOTAL_LINE_ITEM: number;
    TOTAL_ITEM_COUNT: number;
    ERROR_LOG: string;
    NOTE: string,
    orderItems: Array<OrderItemType>;
}

export interface OrderInformationType {
    id: number;
    ID: number;
    CREATED_DATETIME: Date;
    MODIFIED_DATETIME: Date;
    MODIFIED_BY: string;
    STATUS: number;
    SID_CUSTOMER: string;
    SESSION_ID: string;
    IP_ADDRESS: string;
    EMAIL: string;
    S_FIRST_NAME: string;
    S_LAST_NAME: string;
    S_COMPANY: string;
    S_STREET_ADDRESS: string;
    S_COUNTRY: string;
    S_CITY: string;
    S_DISTRICT: string;
    S_ZIP_CODE: string;
    S_PHONE: string;
    S_TYPE: number;
    P_TYPE: number;
    SHIPPING_AMT: number;
    DISC_PERC: number;
    DISC_AMT: number;
    TRANSACTION_SUBTOTAL: number;
    TRANSACTION_TOTAL_TAX_AMT: number;
    TRANSACTION_TOTAL_AMT: number;
    TRANSACTION_TOTAL_WITH_TAX: number;
    TOTAL_LINE_ITEM: number;
    TOTAL_ITEM_COUNT: number;
    NOTE: string,
    ERROR_LOG: string;
    orderItems: Array<OrderItemType>;
}

export interface OrderItemType {
    ID: number;
    ORDER_ID: number;
    SID_PRODUCT: string;
    CREATED_DATETIME: Date;
    QUANTITY: number;
    product: ProductType;
}

export interface OrderHistoryType {
    ID: number;
    ORDER_ID: number;
    ORDER_STATUS: number;
    NOTE: string;
    CREATED_DATETIME: Date;
}

export interface MailSettingType {
    ID: number;
    CREATED_DATETIME: Date;
    MODIFIED_DATETIME: Date;
    MAIL_FOR: string;
    DESCRIPTION: string;
    mailTemplates: MailTemplateType[];
}

export interface MailTemplateType {
    ID: number;
    MAIL_SETTING_ID: number;
    CREATED_DATETIME: Date;
    MODIFIED_DATETIME: Date;
    TEMPLATE_NAME: string;
    REF_TABLE: string;
    MAIL_SUBJECT: string;
    MAIL_CONTENTS: string;
}

export interface PrismInventoryType {
    sid: string;
    createddatetime: Date;
    modifiedby: null;
    modifieddatetime: Date;
    postdate: Date;
    tenantsid: string;
    inventory_item_uid: string;
    sbssid: string;
    alu: string;
    stylesid: string;
    dcssid: string;
    vendsid: string;
    description1: string;
    description2: string;
    description3: string;
    description4: string;
    longdescription: string;
    attribute: string;
    cost: number;
    spif: null;
    taxcodesid: string;
    item_size: string;
    fccost: number;
    fstprice: number;
    firstrcvddate: Date;
    lastrcvddate: Date;
    lastrcvdcost: number;
    useqtydecimals: number;
    description: null;
    regional: boolean;
    active: boolean;
    qtypercase: null;
    upc: string;
    maxdiscperc1: number;
    maxdiscperc2: number;
    itemno: null;
    serialtype: number;
    lottype: number;
    kittype: number;
    scalesid: string;
    promoqtydiscweight: number;
    promoenexclude: boolean;
    noninventory: boolean;
    noncommitted: boolean;
    itemstate: number;
    publishstatus: number;
    ltypriceinpoints: null;
    ltypointsearned: null;
    minordqty: null;
    tradediscpercent: null;
    forceorigtax: boolean;
    taxcode: string;
    activestoresid: string;
    activepricelevelsid: string;
    activeseasonsid: string;
    actstrdbprice: number;
    dcs_code: string;
    sbsno: number;
    sbsname: string;
    scaleno: number;
    scalename: string;
    vendorcode: string;
    vendor_name: string;
    vendorid: number;
    taxname: string;
    currencyalphacode: null;
    image_path: string;
    cname: string;
    dname: string;
    sname: string;
    docitemsid: string;
    specialorder: boolean;
    docqty: 0;
    doccaseqty: 0;
    docprice: 0;
    doccost: 0;
    active_price: number;
    sbsinventoryqtys: Array<{
        quantity: number,
        minimum_quantity: number,
    }>;
}

export interface PrismCategoryType {
    sid: string;
    createddatetime: Date;
    modifieddatetime: Date;
    tenantsid: string;
    dcscode: string;
    sbssid: string;
    useqtydecimals: number;
    taxcodesid: string;
    margintype: number;
    active: boolean;
    marginvalue: number;
    patternsid: string;
    dname: string;
    cname: string;
    sname: string;
    regional: boolean;
    image: string;
    publishstatus: number;
    d: string;
    c: string;
    s: string;
    marginpctg: number;
    markuppctg: number;
    coefficient: number;
    taxcode: string;
    sbsno: number;
    patternname: string;
    taxname: string;
}

export interface PrismStoreType {
    link: string;
    sid: string;
    created_datetime: Date;
    modified_datetime: Date;
    controller_sid: string;
    post_date: Date;
    tenant_sid: Date;
    subsidiary_sid: string;
    store_number: string;
    store_name: string;
    active: boolean;
    activation_date: Date;
    store_code: string;
    address1: string;
    address2: string;
    address3: string;
    address4: string;
    address5: string;
    phone1: string;
    phone2: string;
    tax_area_name: string;
    tax_area2_name: string;
}

export interface DiscountTransactionType {
    PROMO_NAME: string;
    disc_Value: number;
    disc_type: number;
}

export interface PaymentMethodType {
    ID: number;
    CREATED_DATETIME: Date;
    MODIFIED_DATETIME: Date;
    PAYMENT_DESCRIPTION: string;
    ICON_URL: string;
}