import * as Joi from 'joi';
import config from '../../config';
import { GB } from '../../utils/fs';

/**
 * POST /api/quota
 * { userId: '507f1f77bcf86cd799439011', limit: 10 }
 */
export const createQuotaRequestSchema = Joi.object({
    body: {
        userId: Joi.string().hex().length(24).required(),
        limit: Joi.number()
            .min(config.quota.minLimitAllowed * GB)
            .max(config.quota.maxLimitAllowed * GB)
            .optional(),
    },
    query: {},
    params: {},
});

/**
 * GET /api/quota/5d7e4d4e4f7c8e8d4f7c8e8d
 */
export const getQuotaByUserIdRequestSchema = Joi.object({
    params: {
        userId: Joi.string().hex().length(24).required(),
    },
    query: {},
    body: {},
});

/**
 * PUT /api/quota/5d7e4d4e4f7c8e8d4f7c8e8d/limit
 * { limit: 10 }
 */
export const updateQuotaLimitRequestSchema = Joi.object({
    params: {
        userId: Joi.string().hex().length(24).required(),
    },
    body: {
        limit: Joi.number()
            .min(config.quota.minLimitAllowed * GB)
            .max(config.quota.maxLimitAllowed * GB)
            .required(),
    },
    query: {},
});

/**
 * PUT /api/quota/5d7e4d4e4f7c8e8d4f7c8e8d/used
 * { raiseBy: 10 }
 */
export const raiseQuotaUsedRequestSchema = Joi.object({
    params: {
        userId: Joi.string().hex().length(24).required(),
    },
    body: {
        raiseBy: Joi.number().required(),
    },
    query: {},
});
