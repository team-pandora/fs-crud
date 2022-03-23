import * as Joi from 'joi';
import { JoiObjectId } from '../../utils/joi';
import { fsObjectTypes } from '../fs/interface';
import { permissions } from '../state/interface';

/**
 * GET /api/actions/fs/5d7e4d4e4f7c8e8d4f7c8e8d?folderId=5d7e4d4e4f7c8e8d4f7c8e8d&favorite=true
 */
export const aggregateStatesFsObjectsRequestSchema = Joi.object({
    query: {
        // State filters
        stateId: JoiObjectId.optional(),
        userId: JoiObjectId.optional(),
        fsObjectId: JoiObjectId.optional(),
        favorite: Joi.boolean().optional(),
        trash: Joi.boolean().optional(),
        root: Joi.boolean().optional(),
        permission: Joi.string().valid(...permissions),

        // FsObject filters
        key: Joi.string().optional(),
        bucket: Joi.string().optional(),
        source: Joi.string().optional(),
        size: Joi.number().optional(),
        public: Joi.boolean().optional(),
        name: Joi.string().optional(),
        parent: JoiObjectId.optional(),
        type: Joi.string()
            .valid(...fsObjectTypes)
            .optional(),
        ref: JoiObjectId.optional(),
    },
    params: {},
    body: {},
});

export default { aggregateStatesFsObjectsRequestSchema };
