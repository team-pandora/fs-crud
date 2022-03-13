import { substractObjectFields } from '../../utils/object';
import { defaultNewQuota, INewQuota } from './interface';
import QuotaModel from './model';

// Creating a new Quota with a defaultNewQuota and if the user want a  different limit the quoata object will  run over the defaultNewQuota
const createQuota = async (quota: INewQuota) => {
    const newQuota: INewQuota = { ...defaultNewQuota, ...quota };
    return QuotaModel.create(newQuota);
};

// Get the quota by userId and if not exist create a new one with the defaultNewQuota
const getQuotaByUserId = async (userId: string) => {
    return QuotaModel.findOneAndUpdate(
        { userId },
        { $setOnInsert: defaultNewQuota },
        { upsert: true, new: true },
    ).exec();
};

// Update the quota limit and if not exist use the upsert true and setOnInsert the quota by using the substractObjectFields function to handle the problem of conflicing between the defaultNewQuota and the new limit
const updateQuotaLimit = async (userId: string, limit: number) => {
    return QuotaModel.findOneAndUpdate(
        { userId },
        { $set: { limit }, $setOnInsert: substractObjectFields(defaultNewQuota, { limit }) },
        { upsert: true, new: true },
    ).exec();
};

// Update the used field by adding the raiseBy value and if not exist do the same as in updateLimit
const raiseQuoataUsed = async (userId: string, raiseBy: number) => {
    return QuotaModel.findOneAndUpdate(
        { userId },
        {
            $inc: { used: raiseBy },
            $setOnInsert: substractObjectFields(defaultNewQuota, { used: raiseBy }),
        },
        { upsert: true, new: true },
    ).exec();
};

export { getQuotaByUserId, createQuota, updateQuotaLimit, raiseQuoataUsed };
