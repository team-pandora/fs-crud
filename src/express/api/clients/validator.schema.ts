import * as Joi from 'joi';
import config from '../../../config';
import { JoiObjectId } from '../../../utils/joi';
import * as apiValidator from '../validator.schema';

const apiClientFsActionParamsRequestSchema = Joi.object({
    fsObjectId: JoiObjectId.required(),
});

export const {
    createFileRequestSchema,
    createFolderRequestSchema,
    aggregateStatesFsObjectsRequestSchema,
    aggregateFsObjectsStatesRequestSchema,
} = apiValidator;

export const shareFsObjectRequestSchema = apiValidator.shareFsObjectRequestSchema.keys({
    params: apiClientFsActionParamsRequestSchema,
    body: {
        sharedUserId: Joi.string().regex(config.users.idRegex).required(),
        sharedPermission: Joi.string()
            .valid(...config.constants.permissions)
            .required(),
    },
});

export const editFsObjectPermissionRequestSchema = apiValidator.shareFsObjectRequestSchema.keys({
    params: apiClientFsActionParamsRequestSchema,
    body: {
        sharedUserId: Joi.string().regex(config.users.idRegex).required(),
        updatePermission: Joi.string()
            .valid(...config.constants.permissions)
            .invalid('owner')
            .required(),
    },
});

export const addToFavoriteRequestSchema = apiValidator.addToFavoriteRequestSchema.keys({
    params: apiClientFsActionParamsRequestSchema,
});

export const getFsObjectHierarchyRequestSchema = apiValidator.getFsObjectHierarchyRequestSchema.keys({
    params: apiClientFsActionParamsRequestSchema,
});

export const updateFileRequestSchema = apiValidator.updateFileRequestSchema.keys({
    params: apiClientFsActionParamsRequestSchema,
});

export const updateFolderRequestSchema = apiValidator.updateFolderRequestSchema.keys({
    params: apiClientFsActionParamsRequestSchema,
});

export const unshareFsObjectRequestSchema = apiValidator.unshareFsObjectRequestSchema.keys({
    params: apiClientFsActionParamsRequestSchema,
});

export const deleteFileRequestSchema = apiValidator.deleteFileRequestSchema.keys({
    params: apiClientFsActionParamsRequestSchema,
});

export const deleteFolderRequestSchema = apiValidator.deleteFolderRequestSchema.keys({
    params: apiClientFsActionParamsRequestSchema,
});
