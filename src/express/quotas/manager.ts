import { StatusCodes } from 'http-status-codes';
import { ClientSession } from 'mongoose';
import { defaultNewQuota } from '../../config/defaults';
import { subtractObjectFields } from '../../utils/object';
import { ServerError } from '../error';
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
 * @param {ClientSession | undefined} session - Optional mongoose session.
 * @returns {Promise<IQuota>} - Promise object containing the Quota.
 */
const getQuotaByUserId = (userId: string, session?: ClientSession): Promise<IQuota> => {
    return QuotaModel.findOneAndUpdate(
        { userId },
        { $setOnInsert: defaultNewQuota },
        { upsert: true, new: true, session },
    ).exec();
};

/**
 * Update the quota limit, create new with default values and provided limit if does not exist.
 * @param {string} userId - The userId to update the quota.
 * @param {number} limit  - The new limit.
 * @param {ClientSession | undefined} session - Optional mongoose session.
 * @returns {Promise<IQuota>} - Promise object containing the Quota.
 */
const updateQuotaLimit = async (userId: string, limit: number, session?: ClientSession): Promise<IQuota> => {
    const { used } = await getQuotaByUserId(userId, session);
    if (limit < used) {
        throw new ServerError(StatusCodes.BAD_REQUEST, 'New quota limit is lower than current used');
    }

    return QuotaModel.findOneAndUpdate(
        { userId },
        { $set: { limit }, $setOnInsert: subtractObjectFields(defaultNewQuota, { limit }) },
        { upsert: true, new: true, session },
    ).exec();
};

/**
 * Raise the used field of the quota by the amount provided.
 * @param {string} userId - The userId to raise the quota.
 * @param {number} difference - The amount to raise the quota.
 * @param {ClientSession | undefined} session - Optional mongoose session.
 * @returns {Promise<IQuota>} - Promise object containing the Quota.
 */
const changeQuotaUsed = async (userId: string, difference: number, session?: ClientSession): Promise<IQuota> => {
    const { used, limit } = await getQuotaByUserId(userId, session);
    if (used + difference > limit) {
        throw new ServerError(StatusCodes.BAD_REQUEST, 'Quota limit exceeded');
    }

    return QuotaModel.findOneAndUpdate(
        { userId },
        {
            $inc: { used: difference },
            $setOnInsert: subtractObjectFields(defaultNewQuota, { used: difference }),
        },
        { upsert: true, new: true, session },
    ).exec();
};

export { getQuotaByUserId, createQuota, updateQuotaLimit, changeQuotaUsed };