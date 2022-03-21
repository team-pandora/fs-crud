// import exp = require('constants');
import * as Joi from 'joi';
import config from '../../config';
import { JoiObjectId } from '../../utils/joi';

/**
 * POST /api/file
 * {name: 'abc', parent: '5d7e4d4e4f7c8e8d4f7c8e8d', key: 'abc', bucket: 'abc', size: 123, public: true, source: 'dropbox'}
 */
export const createFileRequestSchema = Joi.object({
    query: {},
    params: {},
    body: {
        name: Joi.string().regex(config.fs.fsObjectNameRegex).required(),
        parent: Joi.alternatives(JoiObjectId, Joi.allow(null)),
        key: Joi.string().regex(config.fs.fsObjectKeyRegex).required(),
        bucket: Joi.string().regex(config.fs.fsObjectKeyRegex).required(),
        size: Joi.number().min(config.fs.minFileSizeInBytes).max(config.fs.maxFileSizeInBytes).required(),
        public: Joi.boolean(),
        source: Joi.string().valid(config.fs.fsObjectSourceRegex),
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
        name: Joi.string().regex(config.fs.fsObjectNameRegex).required(),
        parent: Joi.alternatives(JoiObjectId, Joi.allow(null)),
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
        name: Joi.string().regex(config.fs.fsObjectNameRegex).required(),
        parent: Joi.alternatives(JoiObjectId, Joi.allow(null)),
        ref: Joi.string().regex(config.fs.fsObjectKeyRegex).required(),
    },
});

export default { createFileRequestSchema, createFolderRequestSchema, createShortcutRequestSchema };
