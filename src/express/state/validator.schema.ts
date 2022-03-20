import Joi = require('joi');
import { JoiObjectId } from '../../utils/joi';
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
        userId: JoiObjectId.required(),
        fsObjectId: JoiObjectId.required(),
        favorite: Joi.boolean().optional(),
        trash: Joi.boolean().optional(),
        root: Joi.boolean().required(),
        permission: Joi.string()
            .valid(...permissions)
            .required(),
    },
});

/**
 * GET /api/state?userId=5d7e4d4e4f7c8e8d4f7c8e8d&permission=read
 */
export const getStatesRequestSchema = Joi.object({
    query: {
        userId: JoiObjectId.optional(),
        fsObjectId: JoiObjectId.optional(),
        favorite: Joi.boolean().optional(),
        trash: Joi.boolean().optional(),
        root: Joi.boolean().optional(),
        permission: Joi.string()
            .valid(...permissions)
            .optional(),
    },
    params: {},
    body: {},
});
