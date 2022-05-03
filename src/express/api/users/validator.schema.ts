import * as Joi from 'joi';
import config from '../../../config';
import { JoiObjectId } from '../../../utils/joi';
import * as apiValidator from '../validator.schema';

const { nameRegex, fileKeyRegex, fileBucketRegex, minFileSizeInBytes, maxFileSizeInBytes } = config.fs;
const { apps } = config.constants;

const apiUserActionParamsRequestSchema = Joi.object({
    userId: Joi.string().regex(config.users.idRegex).required(),
});

const apiUserFsActionParamsRequestSchema = apiUserActionParamsRequestSchema.keys({
    fsObjectId: JoiObjectId.required(),
});

const apiUserStateActionParamsRequestSchema = apiUserActionParamsRequestSchema.keys({
    stateId: JoiObjectId.required(),
});

const apiUserUploadActionParamsRequestSchema = apiUserActionParamsRequestSchema.keys({
    uploadId: Joi.string().hex().length(24).required(),
});

export const createFileRequestSchema = apiValidator.createFileRequestSchema.keys({
    params: apiUserActionParamsRequestSchema,
});

export const createFolderRequestSchema = apiValidator.createFolderRequestSchema.keys({
    params: apiUserActionParamsRequestSchema,
});

export const createShortcutRequestSchema = apiValidator.createShortcutRequestSchema.keys({
    params: apiUserActionParamsRequestSchema,
});

export const createUploadRequestSchema = Joi.object({
    query: {},
    params: apiUserActionParamsRequestSchema,
    body: {
        userId: Joi.string().regex(config.users.idRegex).required(),
        name: Joi.string().regex(nameRegex).required(),
        parent: Joi.alternatives().try(JoiObjectId, Joi.any().valid(null)).required(),
        uploadedBytes: Joi.number().required(),
        key: Joi.string().regex(fileKeyRegex).required(),
        bucket: Joi.string().regex(fileBucketRegex).required(),
        size: Joi.number().min(minFileSizeInBytes).max(maxFileSizeInBytes).required(),
        source: Joi.string()
            .valid(...apps)
            .optional(),
    },
});

export const restoreFileFromTrashRequestSchema = Joi.object({
    params: apiUserFsActionParamsRequestSchema,
    query: {},
    body: {},
});

export const restoreFolderFromTrashRequestSchema = Joi.object({
    params: apiUserFsActionParamsRequestSchema,
    query: {},
    body: {},
});

export const restoreShortcutFromTrashRequestSchema = Joi.object({
    params: apiUserFsActionParamsRequestSchema,
    query: {},
    body: {},
});

export const shareFsObjectRequestSchema = apiValidator.shareFsObjectRequestSchema.keys({
    params: apiUserFsActionParamsRequestSchema,
    body: {
        sharedUserId: Joi.string().regex(config.users.idRegex).required(),
        sharedPermission: Joi.string()
            .valid(...config.constants.permissions)
            .invalid('owner')
            .required(),
    },
});

export const aggregateStatesFsObjectsRequestSchema = apiValidator.aggregateStatesFsObjectsRequestSchema.keys({
    params: apiUserActionParamsRequestSchema,
});

export const aggregateFsObjectsStatesRequestSchema = apiValidator.aggregateFsObjectsStatesRequestSchema.keys({
    params: apiUserFsActionParamsRequestSchema,
});

export const getQuotaByUserIdRequestSchema = Joi.object({
    params: apiUserActionParamsRequestSchema,
    query: {},
    body: {},
});

export const getFsObjectHierarchyRequestSchema = apiValidator.getFsObjectHierarchyRequestSchema.keys({
    params: apiUserFsActionParamsRequestSchema,
});

export const getUploadRequestSchema = Joi.object({
    query: {},
    params: apiUserUploadActionParamsRequestSchema,
    body: {},
});

export const getUploadsRequestSchema = Joi.object({
    query: {
        userId: Joi.string().regex(config.users.idRegex).optional(),
        name: Joi.string().regex(nameRegex).optional(),
        source: Joi.string()
            .valid(...apps)
            .optional(),
    },
    params: apiUserUploadActionParamsRequestSchema,
    body: {},
});

export const updateStateRequestSchema = apiValidator.updateStateRequestSchema.keys({
    params: apiUserStateActionParamsRequestSchema,
});

export const updateFileRequestSchema = apiValidator.updateFileRequestSchema.keys({
    params: apiUserFsActionParamsRequestSchema,
});

export const updateFolderRequestSchema = apiValidator.updateFolderRequestSchema.keys({
    params: apiUserFsActionParamsRequestSchema,
});

export const updateShortcutRequestSchema = apiValidator.updateShortcutRequestSchema.keys({
    params: apiUserFsActionParamsRequestSchema,
});

export const updateUploadRequestSchema = Joi.object({
    query: {},
    params: apiUserUploadActionParamsRequestSchema,
    body: {
        uploadedBytes: Joi.number().required(),
    },
});

export const unshareFsObjectRequestSchema = apiValidator.unshareFsObjectRequestSchema.keys({
    params: apiUserFsActionParamsRequestSchema,
});

export const deleteFileRequestSchema = apiValidator.deleteFileRequestSchema.keys({
    params: apiUserFsActionParamsRequestSchema,
});

export const deleteFolderRequestSchema = apiValidator.deleteFolderRequestSchema.keys({
    params: apiUserFsActionParamsRequestSchema,
});

export const deleteShortcutRequestSchema = apiValidator.deleteShortcutRequestSchema.keys({
    params: apiUserFsActionParamsRequestSchema,
});

export const deleteUploadRequestSchema = Joi.object({
    query: {},
    params: apiUserUploadActionParamsRequestSchema,
    body: {},
});
