import * as Joi from 'joi';
import config from '../../config';

const { minLimitAllowedInBytes, maxLimitAllowedInBytes } = config.quota;

/**
 * POST /api/quota
 * { userId: '507f1f77bcf86cd799439011', limit: 10 }
 */
export const createQuotaRequestSchema = Joi.object({
    query: {},
    params: {},
    body: {
        userId: Joi.string().regex(config.users.idRegex).required(),
        limit: Joi.number().min(minLimitAllowedInBytes).max(maxLimitAllowedInBytes).optional(),
        used: Joi.number().min(minLimitAllowedInBytes).max(maxLimitAllowedInBytes).optional(),
    },
});

/**
 * GET /api/quota/5d7e4d4e4f7c8e8d4f7c8e8d
 */
export const getQuotaByUserIdRequestSchema = Joi.object({
    query: {},
    params: {
        userId: Joi.string().required(),
    },
    body: {},
});

/**
 * PATCH /api/quota/5d7e4d4e4f7c8e8d4f7c8e8d/limit
 * { limit: 10 }
 */
export const updateQuotaLimitRequestSchema = Joi.object({
    query: {},
    params: {
        userId: Joi.string().regex(config.users.idRegex).required(),
    },
    body: {
        limit: Joi.number().min(minLimitAllowedInBytes).max(maxLimitAllowedInBytes).required(),
    },
});

/**
 * PATCH /api/quota/5d7e4d4e4f7c8e8d4f7c8e8d/used
 * { difference: 10 }
 */
export const changeQuotaUsedRequestSchema = Joi.object({
    query: {},
    params: {
        userId: Joi.string().required(),
    },
    body: {
        difference: Joi.number().required(),
    },
});
