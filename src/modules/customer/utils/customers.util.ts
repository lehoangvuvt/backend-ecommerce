import Customer from "../customer.entity";

export const getCustomerSegments = (customer: Customer, fromDate?: Date, toDate?: Date) => {
    let segments: Array<string> = [];
    if (checkIfHighSpender(customer, fromDate, toDate)) {
        segments = [...segments, 'High Spenders'];
    }
    if (checkIfOneTimer(customer, fromDate, toDate)) {
        segments = [...segments, 'One Timers'];
    }
    if (checkIfIdle(customer)) {
        segments = [...segments, 'Idle Customers'];
    }
    return segments;
}

export const checkIfHighSpender = (customer: Customer, fromDate?: Date, toDate?: Date) => {
    let isHighSpender = false;
    let { orders } = customer;
    if (fromDate && toDate) {
        orders = orders.filter(order => order.CREATED_DATETIME.getTime() >= new Date(fromDate).getTime()
            && order.CREATED_DATETIME.getTime() <= new Date(toDate).getTime());
    }
    const totalSpent = orders.reduce((total: number, order) => total + parseFloat(order.TRANSACTION_TOTAL_WITH_TAX.toString()), 0);
    if (totalSpent >= 10000000) {
        isHighSpender = true;
    };
    return isHighSpender;
}

export const checkIfOneTimer = (customer: Customer, fromDate?: Date, toDate?: Date) => {
    let isOneTimer = false;
    let { orders } = customer;
    if (fromDate && toDate) {
        orders = orders.filter(order => order.CREATED_DATETIME.getTime() >= new Date(fromDate).getTime()
            && order.CREATED_DATETIME.getTime() <= new Date(toDate).getTime());
    }
    if (orders.length === 1) {
        isOneTimer = true;
    }
    return isOneTimer;
}

export const checkIfIdle = (customer: Customer) => {
    let isIdle = false;
    if (customer.ACTIVE === 0) {
        isIdle = true;
    }
    return isIdle;
}