import * as Joi from 'joi';
import config from '../../config';
import { JoiObjectId } from '../../utils/joi';
import { sources } from './interface';

const { nameRegex, fileKeyRegex, fileBucketRegex, minFileSizeInBytes, maxFileSizeInBytes } = config.fs;

export const getFsObjectRequestSchema = Joi.object({
    query: {},
    params: {
        fsObjectId: JoiObjectId.required(),
    },
    body: {},
});

/**
 * POST /api/file
 * {name: 'abc', parent: '5d7e4d4e4f7c8e8d4f7c8e8d', key: 'abc', bucket: 'abc', size: 123, public: true, source: 'dropbox'}
 */
export const createFileRequestSchema = Joi.object({
    query: {},
    params: {},
    body: {
        name: Joi.string().regex(nameRegex).required(),
        parent: Joi.alternatives().try(JoiObjectId, Joi.any().valid(null)).required(),
        key: Joi.string().regex(fileKeyRegex).required(),
        bucket: Joi.string().regex(fileBucketRegex).required(),
        size: Joi.number().min(minFileSizeInBytes).max(maxFileSizeInBytes).required(),
        public: Joi.boolean().optional(),
        source: Joi.string()
            .valid(...sources)
            .required(),
    },
});

/**
 * POST /api/folder
 * {name: 'abc', parent: '5d7e4d4e4f7c8e8d4f7c8e8d'}
 */
export const createFolderRequestSchema = Joi.object({
    query: {},
    params: {},
    body: {
        name: Joi.string().regex(nameRegex).required(),
        parent: Joi.alternatives().try(JoiObjectId, Joi.any().valid(null)).required(),
    },
});

/**
 * POST /api/shortcut
 * {name: 'abc', parent: '5d7e4d4e4f7c8e8d4f7c8e8d', ref: '5d7e4d4e4f7c8e8d4f7c8e8d'}
 */
export const createShortcutRequestSchema = Joi.object({
    query: {},
    params: {},
    body: {
        name: Joi.string().regex(nameRegex).required(),
        parent: Joi.alternatives().try(JoiObjectId, Joi.any().valid(null)).required(),
        ref: JoiObjectId.required(),
    },
});

export const updateFileRequestSchema = Joi.object({
    query: {},
    params: {
        fsObjectId: JoiObjectId.required(),
    },
    body: {
        name: Joi.string().regex(nameRegex).optional(),
        parent: JoiObjectId.optional(),
        key: Joi.string().regex(fileKeyRegex).optional(),
        bucket: Joi.string().regex(fileBucketRegex).optional(),
        size: Joi.number().min(minFileSizeInBytes).max(maxFileSizeInBytes).optional(),
        public: Joi.boolean().optional(),
    },
});

export const updateFolderRequestSchema = Joi.object({
    query: {},
    params: {
        fsObjectId: JoiObjectId.required(),
    },
    body: {
        name: Joi.string().regex(nameRegex).required(),
        parent: JoiObjectId.optional(),
    },
});

export const updateShortcutRequestSchema = updateFolderRequestSchema;
