import * as Joi from 'joi';
import config from '../../config';
import { JoiObjectId } from '../../utils/joi';

const { clients } = config.constants;
const { nameRegex, fileKeyRegex, fileBucketRegex, minFileSizeInBytes, maxFileSizeInBytes } = config.fs;
const { permissions, fsObjectTypes, fsObjectsSortFields, statesSortFields, sortOrders } = config.constants;

export const createFileRequestSchema = Joi.object({
    query: {},
    params: {},
    body: {
        name: Joi.string().regex(nameRegex).required(),
        parent: Joi.alternatives().try(JoiObjectId, Joi.any().valid(null)).required(),
        key: Joi.string().regex(fileKeyRegex).required(),
        bucket: Joi.string().regex(fileBucketRegex).required(),
        size: Joi.number().min(minFileSizeInBytes).max(maxFileSizeInBytes).required(),
        source: Joi.string()
            .valid(...clients)
            .required(),

        public: Joi.boolean().optional(),
    },
});

export const createFolderRequestSchema = Joi.object({
    query: {},
    params: {},
    body: {
        name: Joi.string().regex(nameRegex).required(),
        parent: Joi.alternatives().try(JoiObjectId, Joi.any().valid(null)).required(),
    },
});

export const createShortcutRequestSchema = Joi.object({
    query: {},
    params: {},
    body: {
        name: Joi.string().regex(nameRegex).required(),
        parent: Joi.alternatives().try(JoiObjectId, Joi.any().valid(null)).required(),
        ref: JoiObjectId.required(),
    },
});

export const shareFsObjectRequestSchema = Joi.object({
    query: {},
    params: {},
    body: {
        sharedUserId: Joi.string().regex(config.users.idRegex).required(),
        sharedPermission: Joi.string()
            .valid(...permissions)
            .required(),
    },
});

export const addToFavoriteRequestSchema = Joi.object({
    query: {},
    params: {},
    body: {},
});

export const aggregateStatesFsObjectsRequestSchema = Joi.object({
    query: Joi.object({
        // State filters
        stateId: JoiObjectId.optional(),
        userId: Joi.string().regex(config.users.idRegex).optional(),
        fsObjectId: JoiObjectId.optional(),
        favorite: Joi.boolean().optional(),
        trash: Joi.boolean().optional(),
        trashRoot: Joi.boolean().optional(),
        root: Joi.boolean().optional(),
        permission: Joi.alternatives()
            .try(Joi.string().valid(...permissions), Joi.array().items(Joi.string().valid(...permissions)))
            .custom((value) => (Array.isArray(value) ? { $in: value } : value))
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
            .valid(...fsObjectsSortFields, ...statesSortFields)
            .optional(),
        sortOrder: Joi.string()
            .valid(...sortOrders)
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

export const aggregateFsObjectsStatesRequestSchema = aggregateStatesFsObjectsRequestSchema;

export const getFsObjectHierarchyRequestSchema = Joi.object({
    query: {},
    params: {},
    body: {},
});

export const updateFileRequestSchema = Joi.object({
    query: {},
    params: {},
    body: Joi.object({
        name: Joi.string().regex(nameRegex).optional(),
        parent: Joi.alternatives().try(JoiObjectId, Joi.any().valid(null)).optional(),
        key: Joi.string().regex(fileKeyRegex).optional(),
        bucket: Joi.string().regex(fileBucketRegex).optional(),
        size: Joi.number().min(minFileSizeInBytes).max(maxFileSizeInBytes).optional(),
        public: Joi.boolean().optional(),
    }).min(1),
});

export const updateFolderRequestSchema = Joi.object({
    query: {},
    params: {},
    body: Joi.object({
        name: Joi.string().regex(nameRegex).optional(),
        parent: JoiObjectId.optional(),
    }).min(1),
});

export const updateShortcutRequestSchema = Joi.object({
    query: {},
    params: {},
    body: Joi.object({
        name: Joi.string().regex(nameRegex).optional(),
        parent: JoiObjectId.optional(),
    }).min(1),
});

export const updatePermissionRequestSchema = Joi.object({
    query: {},
    params: {},
    body: {
        sharedUserId: Joi.string().regex(config.users.idRegex).required(),
        updatePermission: Joi.string()
            .valid(...permissions)
            .required(),
    },
});

export const unshareFsObjectRequestSchema = Joi.object({
    query: {},
    params: {},
    body: {
        userId: Joi.string().regex(config.users.idRegex).required(),
    },
});

export const deleteFileRequestSchema = Joi.object({
    query: {},
    params: {},
    body: {},
});

export const deleteFolderRequestSchema = Joi.object({
    query: {},
    params: {},
    body: {},
});

export const deleteShortcutRequestSchema = Joi.object({
    query: {},
    params: {},
    body: {},
});
