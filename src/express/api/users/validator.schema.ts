import * as Joi from 'joi';
import config from '../../../config';
import { JoiObjectId } from '../../../utils/joi';
import * as apiValidator from '../validator.schema';

const { nameRegex, fileBucketRegex, minFileSizeInBytes, maxFileSizeInBytes } = config.fs;

const apiUserActionParamsRequestSchema = Joi.object({
    userId: Joi.string().regex(config.user.idRegex).required(),
});

const apiUserFsActionParamsRequestSchema = apiUserActionParamsRequestSchema.keys({
    fsObjectId: JoiObjectId.required(),
});

export const createFileRequestSchema = Joi.object({
    query: {},
    params: apiUserActionParamsRequestSchema,
    body: {
        name: Joi.string().regex(nameRegex).required(),
        parent: JoiObjectId.allow(null).required(),
        bucket: Joi.string().regex(fileBucketRegex).required(),
        size: Joi.number().min(minFileSizeInBytes).max(maxFileSizeInBytes).required(),
        client: Joi.string().required(),
        public: Joi.boolean().optional(),
    },
});

export const moveFileToTrashRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: {},
});

export const moveFolderToTrashRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: {},
});

export const moveShortcutToTrashRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: {},
});

export const createFolderRequestSchema = Joi.object({
    query: {},
    params: apiUserActionParamsRequestSchema,
    body: {
        name: Joi.string().regex(nameRegex).required(),
        parent: JoiObjectId.allow(null).required(),
    },
});

export const createShortcutRequestSchema = Joi.object({
    query: {},
    params: apiUserActionParamsRequestSchema,
    body: {
        name: Joi.string().regex(nameRegex).required(),
        parent: JoiObjectId.allow(null).required(),
        ref: JoiObjectId.required(),
    },
});

export const restoreFileFromTrashRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: {},
});

export const restoreFolderFromTrashRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: {},
});

export const restoreShortcutFromTrashRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: {},
});

export const shareFsObjectRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: {
        sharedUserId: Joi.string().regex(config.user.idRegex).required(),
        sharedPermission: Joi.string()
            .valid(...config.constants.permissions)
            .invalid('owner')
            .required(),
    },
});

export const addToFavoriteRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: {},
});

export const aggregateStatesFsObjectsRequestSchema = apiValidator.aggregateStatesFsObjectsRequestSchema.keys({
    params: apiUserActionParamsRequestSchema,
});

export const aggregateFsObjectsStatesRequestSchema = apiValidator.aggregateFsObjectsStatesRequestSchema.keys({
    params: apiUserActionParamsRequestSchema,
});

export const searchFsObjectsStatesRequestSchema = Joi.object({
    query: {
        query: Joi.string().required(),
    },
    params: apiUserActionParamsRequestSchema,
    body: {},
});

export const getQuotaByUserIdRequestSchema = Joi.object({
    query: {},
    params: apiUserActionParamsRequestSchema,
    body: {},
});

export const getFsObjectHierarchyRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: {},
});

export const getFolderChildrenRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: {},
});

export const getSharedUsersRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: {},
});

export const updateFileRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: Joi.object({
        name: Joi.string().regex(nameRegex).optional(),
        parent: JoiObjectId.allow(null).optional(),
        bucket: Joi.string().regex(fileBucketRegex).optional(),
        size: Joi.number().min(minFileSizeInBytes).max(maxFileSizeInBytes).optional(),
        public: Joi.boolean().optional(),
    }).min(1),
});

export const updateFolderRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: Joi.object({
        name: Joi.string().regex(nameRegex).optional(),
        parent: JoiObjectId.allow(null).optional(),
    }).min(1),
});

export const updateShortcutRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: Joi.object({
        name: Joi.string().regex(nameRegex).optional(),
        parent: JoiObjectId.allow(null).optional(),
    }).min(1),
});

export const updatePermissionRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: {
        sharedUserId: Joi.string().regex(config.user.idRegex).required(),
        updatePermission: Joi.string()
            .valid(...config.constants.permissions)
            .invalid('owner')
            .required(),
    },
});

export const unshareFsObjectRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: {
        sharedUserId: Joi.string().regex(config.user.idRegex).required(),
    },
});

export const unfavoriteFsObjectRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: {},
});

export const deleteFileFromTrashRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: {},
});

export const deleteFolderFromTrashRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: {},
});

export const deleteShortcutFromTrashRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: {},
});

export const deleteFileRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: {},
});

export const deleteFolderRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: {},
});

export const deleteShortcutRequestSchema = Joi.object({
    query: {},
    params: apiUserFsActionParamsRequestSchema,
    body: {},
});
