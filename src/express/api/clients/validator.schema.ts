import * as Joi from 'joi';
import config from '../../../config';
import { JoiObjectId } from '../../../utils/joi';
import * as apiValidator from '../validator.schema';

const { nameRegex, fileKeyRegex, fileBucketRegex, minFileSizeInBytes, maxFileSizeInBytes } = config.fs;
const { clients, permissions } = config.constants;
const { idRegex } = config.user;

const apiClientActionParamsRequestSchema = Joi.object({
    clientId: Joi.string()
        .valid(...clients)
        .required(),
});

const apiClientFsActionParamsRequestSchema = apiClientActionParamsRequestSchema.keys({
    fsObjectId: JoiObjectId.required(),
});

export const createFileRequestSchema = Joi.object({
    query: {},
    params: apiClientActionParamsRequestSchema,
    body: {
        name: Joi.string().regex(nameRegex).required(),
        key: Joi.string().regex(fileKeyRegex).required(),
        bucket: Joi.string().regex(fileBucketRegex).required(),
        size: Joi.number().min(minFileSizeInBytes).max(maxFileSizeInBytes).required(),

        public: Joi.boolean().optional(),
    },
});

export const aggregateStatesFsObjectsRequestSchema = apiValidator.aggregateStatesFsObjectsRequestSchema.keys({
    params: apiClientActionParamsRequestSchema,
});

export const aggregateFsObjectsStatesRequestSchema = apiValidator.aggregateFsObjectsStatesRequestSchema.keys({
    params: apiClientActionParamsRequestSchema,
});

export const shareFileRequestSchema = Joi.object({
    query: {},
    params: apiClientFsActionParamsRequestSchema,
    body: {
        sharedUserId: Joi.string().regex(idRegex).required(),
        sharedPermission: Joi.string()
            .valid(...permissions)
            .required(),
    },
});

export const updateFilePermissionRequestSchema = Joi.object({
    query: {},
    params: apiClientFsActionParamsRequestSchema,
    body: {
        sharedUserId: Joi.string().regex(idRegex).required(),
        updatePermission: Joi.string()
            .valid(...permissions)
            .required(),
    },
});

export const updateFileRequestSchema = Joi.object({
    query: {},
    params: apiClientFsActionParamsRequestSchema,
    body: Joi.object({
        name: Joi.string().regex(nameRegex).optional(),
        key: Joi.string().regex(fileKeyRegex).optional(),
        bucket: Joi.string().regex(fileBucketRegex).optional(),
        size: Joi.number().min(minFileSizeInBytes).max(maxFileSizeInBytes).optional(),
        public: Joi.boolean().optional(),
    }).min(1),
});

export const unshareFileRequestSchema = Joi.object({
    query: {},
    params: apiClientFsActionParamsRequestSchema,
    body: {
        sharedUserId: Joi.string().regex(config.user.idRegex).required(),
    },
});

export const deleteFileRequestSchema = Joi.object({
    query: {},
    params: apiClientFsActionParamsRequestSchema,
    body: {},
});
