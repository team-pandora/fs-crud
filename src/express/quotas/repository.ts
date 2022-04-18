import { StatusCodes } from 'http-status-codes';
import { ClientSession } from 'mongoose';
import { defaultNewQuota } from '../../config/defaults';
import { ServerError } from '../error';
import { IQuota } from './interface';
import QuotaModel from './model';

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

    const result = await QuotaModel.findOneAndUpdate({ userId }, { $set: { limit } }, { new: true, session }).exec();
    if (!result) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update quota limit');

    return result;
};

/**
 * Raise or lower the used field of the quota by the amount provided.
 * @param {string} userId - The userId od the quota.
 * @param {number} difference - The amount to raise or lower the quota by.
 * @param {ClientSession | undefined} session - Optional mongoose session.
 * @returns {Promise<IQuota>} - Promise object containing the Quota.
 */
const changeQuotaUsed = async (userId: string, difference: number, session?: ClientSession): Promise<IQuota> => {
    const { used, limit } = await getQuotaByUserId(userId, session);
    if (used + difference > limit) {
        throw new ServerError(StatusCodes.BAD_REQUEST, 'Quota limit exceeded');
    }

    const result = await QuotaModel.findOneAndUpdate(
        { userId },
        { $inc: { used: difference } },
        { new: true, session },
    ).exec();
    if (!result) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update quota used');

    return result;
};

export { getQuotaByUserId, updateQuotaLimit, changeQuotaUsed };
