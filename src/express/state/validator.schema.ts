import Joi = require('joi');
import { permissions } from './interface';

/**
 * POST /api/state
 * { userId: '507f1f77bcf86cd799439011', fsObjectId: '5d7e4d4e4f7c8e8d4f7c8e8d',
 *  favorite: true, trash: true, root: true, permission: 'read' }
 */
export const createStateRequestSchema = Joi.object({
    query: {},
    params: {},
    body: {
        userId: Joi.string().hex().length(24).required(),
        fsObjectId: Joi.string().hex().length(24).required(),
        favorite: Joi.boolean().optional(),
        trash: Joi.boolean().optional(),
        root: Joi.boolean().required(),
        permission: Joi.string()
            .allow(...permissions)
            .required(),
    },
});

/**
 * GET /api/state
 */
export const getStatesRequestSchema = Joi.object({
    query: {
        userId: Joi.string().hex().length(24).optional(),
        fsObjectId: Joi.string().hex().length(24).optional(),
        favorite: Joi.boolean().optional(),
        trash: Joi.boolean().optional(),
        root: Joi.boolean().optional(),
        permission: Joi.string()
            .allow(...permissions)
            .optional(),
    },
    params: {},
    body: {},
});
