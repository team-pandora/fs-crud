import * as Joi from 'joi';
import { JoiObjectId } from '../../utils/joi';
import { permissions } from './interface';

/**
 * GET /api/states/5d7e4d4e4f7c8e8d4f7c8e8d
 */
export const getStateByIdRequestSchema = Joi.object({
    query: {},
    params: { stateId: JoiObjectId.required() },
    body: {},
});

/**
 * GET /api/state?userId=5d7e4d4e4f7c8e8d4f7c8e8d&permission=read
 */
export const getStatesRequestSchema = Joi.object({
    query: {
        userId: Joi.string().optional(),
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

/**
 * POST /api/state
 * { userId: '507f1f77bcf86cd799439011', fsObjectId: '5d7e4d4e4f7c8e8d4f7c8e8d',
 *  favorite: true, trash: true, root: true, permission: 'read' }
 */
export const createStateRequestSchema = Joi.object({
    query: {},
    params: {},
    body: {
        userId: Joi.string().required(),
        fsObjectId: JoiObjectId.required(),
        favorite: Joi.boolean().optional(),
        trash: Joi.boolean().optional(),
        permission: Joi.string()
            .valid(...permissions)
            .required(),
    },
});

export const updateStateRequestSchema = Joi.object({
    query: {},
    params: {
        stateId: JoiObjectId.required(),
    },
    body: {
        favorite: Joi.boolean().optional(),
        trash: Joi.boolean().optional(),
        permission: Joi.string()
            .valid(...permissions)
            .optional(),
    },
});
