import { substractObjectFields } from '../../utils/object';
import { defaultNewQuota, INewQuota } from './interface';
import QuotaModel from './model';

const createQuota = async (quota: INewQuota) => {
    const newQuota: INewQuota = { ...defaultNewQuota, ...quota };
    return QuotaModel.create(newQuota);
};

const getQuotaByUserId = async (userId: string) => {
    return QuotaModel.findOneAndUpdate(
        { userId },
        { $setOnInsert: defaultNewQuota },
        { upsert: true, new: true },
    ).exec();
};

const updateQuotaLimit = async (userId: string, limit: number) => {
    return QuotaModel.findOneAndUpdate(
        { userId },
        { $set: { limit }, $setOnInsert: substractObjectFields(defaultNewQuota, { limit }) },
        { upsert: true, new: true },
    ).exec();
};
const updadeQuotaUsed = async (userId: string, raiseBy: number) => {
    return QuotaModel.findOneAndUpdate({ userId }, { $set: { used: raiseBy } }, { upsert: true, new: true }).exec();
};

export { getQuotaByUserId, createQuota, updateQuotaLimit };
