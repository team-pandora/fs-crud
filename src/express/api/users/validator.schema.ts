import * as Joi from 'joi';
import config from '../../../config';
import { JoiObjectId } from '../../../utils/joi';
import * as apiValidator from '../validator.schema';

const apiUserActionParamsRequestSchema = Joi.object({
    userId: Joi.string().regex(config.users.idRegex).required(),
});

const apiUserFsActionParamsRequestSchema = apiUserActionParamsRequestSchema.keys({
    fsObjectId: JoiObjectId.required(),
});

const apiUserStateActionParamsRequestSchema = apiUserActionParamsRequestSchema.keys({
    stateId: JoiObjectId.required(),
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
