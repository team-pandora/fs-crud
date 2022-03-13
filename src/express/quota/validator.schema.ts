import * as Joi from 'joi';
import config from '../../config';
import { GB } from '../../utils/fs';

// Validate the createQuota request
export const createQuotaRequestSchema = Joi.object({
    body: {
        userId: Joi.string().hex().length(24).required(),
        limit: Joi.number().max(config.quota.maxLimitAllowed * GB),
    },
    query: {},
    params: {},
});

// Validate the getQuotaByUserId request
export const getQuotaByUserIdRequestSchema = Joi.object({
    params: {
        userId: Joi.string().hex().length(24).required(),
    },
    query: {},
    body: {},
});

// Validate the updateQuota request
export const updateQuotaLimitRequestSchema = Joi.object({
    params: {
        userId: Joi.string().hex().length(24).required(),
    },
    body: {
        limit: Joi.number()
            .optional()
            .max(config.quota.maxLimitAllowed * GB),
    },
    query: {},
});

export const raiseQuotaUsedRequestSchema = Joi.object({
    params: {
        userId: Joi.string().hex().length(24).required(),
    },
    body: {
        raiseBy: Joi.number().required(),
    },
    query: {},
});
