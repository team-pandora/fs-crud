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

export const createFileRequestSchema = apiValidator.createFileRequestSchema.keys({
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

export const shareFileRequestSchema = apiValidator.shareFsObjectRequestSchema.keys({
    params: apiClientFsActionParamsRequestSchema,
    body: {
        sharedUserId: Joi.string().regex(idRegex).required(),
        sharedPermission: Joi.string()
            .valid(...permissions)
            .required(),
    },
});

export const updateFilePermissionRequestSchema = apiValidator.shareFsObjectRequestSchema.keys({
    params: apiClientFsActionParamsRequestSchema,
    body: {
        sharedUserId: Joi.string().regex(idRegex).required(),
        updatePermission: Joi.string()
            .valid(...permissions)
            .required(),
    },
});

export const updateFileRequestSchema = apiValidator.updateFileRequestSchema.keys({
    params: apiClientFsActionParamsRequestSchema,
    body: Joi.object({
        name: Joi.string().regex(nameRegex).optional(),
        key: Joi.string().regex(fileKeyRegex).optional(),
        bucket: Joi.string().regex(fileBucketRegex).optional(),
        size: Joi.number().min(minFileSizeInBytes).max(maxFileSizeInBytes).optional(),
        public: Joi.boolean().optional(),
    }).min(1),
});

export const unshareFileRequestSchema = apiValidator.unshareFsObjectRequestSchema.keys({
    params: apiClientFsActionParamsRequestSchema,
});

export const deleteFileRequestSchema = apiValidator.deleteFileRequestSchema.keys({
    params: apiClientFsActionParamsRequestSchema,
});
