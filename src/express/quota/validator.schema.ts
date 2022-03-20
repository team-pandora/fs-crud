import * as Joi from 'joi';
import config from '../../config';
import { JoiObjectId } from '../../utils/joi';

const { minLimitAllowedInGb, maxLimitAllowedInGb } = config.quota;

/**
 * POST /api/quota
 * { userId: '507f1f77bcf86cd799439011', limit: 10 }
 */
export const createQuotaRequestSchema = Joi.object({
    body: {
        userId: JoiObjectId.required(),
        limit: Joi.number().min(minLimitAllowedInGb).max(maxLimitAllowedInGb).optional(),
    },
    query: {},
    params: {},
});

/**
 * GET /api/quota/5d7e4d4e4f7c8e8d4f7c8e8d
 */
export const getQuotaByUserIdRequestSchema = Joi.object({
    params: {
        userId: JoiObjectId.required(),
    },
    query: {},
    body: {},
});

/**
 * PATCH /api/quota/5d7e4d4e4f7c8e8d4f7c8e8d/limit
 * { limit: 10 }
 */
export const updateQuotaLimitRequestSchema = Joi.object({
    params: {
        userId: JoiObjectId.required(),
    },
    body: {
        limit: Joi.number().min(minLimitAllowedInGb).max(maxLimitAllowedInGb).required(),
    },
    query: {},
});

/**
 * PATCH /api/quota/5d7e4d4e4f7c8e8d4f7c8e8d/used
 * { difference: 10 }
 */
export const changeQuotaUsedRequestSchema = Joi.object({
    params: {
        userId: JoiObjectId.required(),
    },
    body: {
        difference: Joi.number().required(),
    },
    query: {},
});
