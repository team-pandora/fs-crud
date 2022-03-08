import { IQuota } from './interface';
import QuotaModel from './model';

const getQuotaByUserId = (query: Partial<IQuota>) => {
    return QuotaModel.find(query).exec();
};

export { getQuotaByUserId };
export default { getQuotaByUserId }; // TODO: remove when you have more than one function
