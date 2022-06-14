import { StatusCodes } from 'http-status-codes';
import { ClientSession } from 'mongoose';
import { defaultNewQuota } from '../../config/defaults';
import { ServerError } from '../error';
import { IQuota } from './interface';
import QuotaModel from './model';

/**
 * Get Quota by userId. Create a new one if not found.
 * @param userId - The userId to get the Quota.
 * @param session - Optional mongoose session.
 * @returns {Promise<IQuota>} Promise object containing the Quota.
 */
export const getQuotaByUserId = (userId: string, session?: ClientSession): Promise<IQuota> => {
    return QuotaModel.findOneAndUpdate(
        { userId },
        { $setOnInsert: defaultNewQuota },
        { upsert: true, new: true, session },
    ).exec();
};

/**
 * Update Quota used field.
 * @param userId - The userId to update the Quota.
 * @param difference - The difference to add to the used field.
 * @param session - Optional mongoose session.
 * @returns {Promise<IQuota>} Promise object containing the updated Quota.
 * @throws {ServerError} If new used value is greater than limit.
 */
export const changeQuotaUsed = async (userId: string, difference: number, session?: ClientSession): Promise<IQuota> => {
    const quota = await getQuotaByUserId(userId, session);
    if (!difference) return quota;

    const { used, limit } = quota;
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
