import { StatusCodes } from 'http-status-codes';
import { ClientSession } from 'mongoose';
import { defaultNewQuota } from '../../config/defaults';
import { ServerError } from '../error';
import { IQuota } from './interface';
import QuotaModel from './model';

/**
 * Get a Quota document by userId.
 * @param userId - The userId to get the Quota.
 * @returns {Promise<IQuota>} Promise object containing the Quota.
 */
const getQuotaByUserId = (userId: string, session?: ClientSession): Promise<IQuota> => {
    return QuotaModel.findOneAndUpdate(
        { userId },
        { $setOnInsert: defaultNewQuota },
        { upsert: true, new: true, session },
    ).exec();
};

/**
 * Update a Quota used.
 *  1) validations for the used and limit fields.
 *  2) update used quota (raise or lower it accordingly).
 * @param userId - The userId to update the Quota.
 * @param difference - The amount to update the Quota used.
 * @returns {Promise<IQuota>} Promise object containing the updated Quota.
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

export { getQuotaByUserId, changeQuotaUsed };
