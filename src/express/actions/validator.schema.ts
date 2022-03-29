import * as Joi from 'joi';
import { JoiObjectId } from '../../utils/joi';
import { fsObjectTypes } from '../fs/interface';
import { permissions } from '../state/interface';
import { AggregateStatesFsObjectsSortByFields, AggregateStatesFsObjectsSortOrders } from './interface';

/**
 * GET /api/actions/states/fsObjects?stateId=:stateId&userId=:userId&fsObjectId=:fsObjectId&favorite=:favorite&trash=:trash&root=:root&permission=:permission&key=:key&bucket=:bucket&source=:source&size=:size&public=:public&name=:name&parent=:parent&type=:type&ref=:ref
 */
export const aggregateStatesFsObjectsRequestSchema = Joi.object({
    query: Joi.object({
        // State filters
        stateId: JoiObjectId.optional(),
        userId: JoiObjectId.optional(),
        fsObjectId: JoiObjectId.optional(),
        favorite: Joi.boolean().optional(),
        trash: Joi.boolean().optional(),
        root: Joi.boolean().optional(),
        permission: Joi.array()
            .items(Joi.string().valid(...permissions))
            .optional(),

        // FsObject filters
        key: Joi.string().optional(),
        bucket: Joi.string().optional(),
        source: Joi.string().optional(),
        size: Joi.number().optional(),
        public: Joi.boolean().optional(),
        name: Joi.string().optional(),
        parent: Joi.alternatives().try(JoiObjectId, Joi.string().valid('null').empty('null').default(null)).optional(),
        type: Joi.string()
            .valid(...fsObjectTypes)
            .optional(),
        ref: JoiObjectId.optional(),

        // Sort
        sortBy: Joi.string()
            .valid(...AggregateStatesFsObjectsSortByFields)
            .optional(),
        sortOrder: Joi.string()
            .valid(...AggregateStatesFsObjectsSortOrders)
            .optional(),

        // Pagination
        page: Joi.number().integer().min(1).optional(),
        pageSize: Joi.number().integer().min(1).optional(),
    })
        .with('sortBy', 'sortOrder')
        .with('sortOrder', 'sortBy')
        .with('page', ['pageSize', 'sortBy', 'sortOrder'])
        .with('pageSize', ['page', 'sortBy', 'sortOrder']),

    params: {},
    body: {},
});

export const deleteObjectTransactionsRequestSchema = Joi.object({
    query: {},
    params: {
        fsObjectId: JoiObjectId.required(),
    },
    body: {},
});

export default { aggregateStatesFsObjectsRequestSchema };
