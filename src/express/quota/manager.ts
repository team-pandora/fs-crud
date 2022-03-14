import { defaultNewQuota } from '../../config/defaults';
import { substractObjectFields } from '../../utils/object';
import { INewQuota, IQuota } from './interface';
import QuotaModel from './model';

/**
 * Create a new Quota with default values if not provided.
 * @param {INewQuota} quota - The new quota object.
 * @returns {Promise<IQuota>} - Promise object containing the created Quota.
 */
const createQuota = (quota: INewQuota): Promise<IQuota> => {
    const newQuota: INewQuota = { ...defaultNewQuota, ...quota };
    return QuotaModel.create(newQuota);
};

/**
 * Get the quota by userId, create new with default values if does not exist.
 * @param {string} userId - The userId to get the quota.
 * @returns {Promise<IQuota>} - Promise object containing the Quota.
 */
const getQuotaByUserId = (userId: string): Promise<IQuota> => {
    return QuotaModel.findOneAndUpdate(
        { userId },
        { $setOnInsert: defaultNewQuota },
        { upsert: true, new: true },
    ).exec();
};

/**
 * Update the quota limit, create new with default values and provided limit if does not exist.
 * @param {string} userId - The userId to update the quota.
 * @param {number} limit  - The new limit.
 * @returns {Promise<IQuota>} - Promise object containing the Quota.
 */
const updateQuotaLimit = (userId: string, limit: number): Promise<IQuota> => {
    return QuotaModel.findOneAndUpdate(
        { userId },
        { $set: { limit }, $setOnInsert: substractObjectFields(defaultNewQuota, { limit }) },
        { upsert: true, new: true },
    ).exec();
};

/**
 * Raise the used field of the quota by the amount provided.
 * @param {string} userId - The userId to raise the quota.
 * @param {number} raiseBy - The amount to raise the quota.
 * @returns {Promise<IQuota>} - Promise object containing the Quota.
 */
const raiseQuoataUsed = (userId: string, raiseBy: number): Promise<IQuota> => {
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
