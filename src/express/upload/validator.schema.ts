import * as Joi from 'joi';
import config from '../../config';
import { JoiObjectId } from '../../utils/joi';
import { sources } from '../fs/interface';

const { nameRegex, fileKeyRegex, fileBucketRegex, minFileSizeInBytes, maxFileSizeInBytes } = config.fs;

/**
 * POST /api/uploads
 * { name: 'abc', parent: '5d7e4d4e4f7c8e8d4f7c8e8d', uploadedBytes: 123, key: 'abc', bucket: 'abc', size: 123, source: 'drive' }
 */
export const createUploadRequestSchema = Joi.object({
    query: {},
    params: {},
    body: {
        name: Joi.string().regex(nameRegex).required(),
        parent: JoiObjectId.optional(),
        uploadedBytes: Joi.number().required(),
        key: Joi.string().regex(fileKeyRegex).required(),
        bucket: Joi.string().regex(fileBucketRegex).required(),
        size: Joi.number().min(minFileSizeInBytes).max(maxFileSizeInBytes).required(),
        source: Joi.string()
            .valid(...sources)
            .optional(),
    },
});

/**
 * GET /api/uploads
 * { name: 'abc', parent: '5d7e4d4e4f7c8e8d4f7c8e8d', uploadedBytes: 123, key: 'abc', bucket: 'abc', size: 123, source: 'myDrive' }
 */
export const getUploadsRequestSchema = Joi.object({
    query: {
        id: JoiObjectId.optional(),
        name: Joi.string().regex(nameRegex).optional(),
        parent: JoiObjectId.optional(),
        uploadedBytes: Joi.number().optional(),
        key: Joi.string().regex(fileKeyRegex).optional(),
        bucket: Joi.string().regex(fileBucketRegex).optional(),
        size: Joi.number().min(minFileSizeInBytes).max(maxFileSizeInBytes).optional(),
        source: Joi.string()
            .valid(...sources)
            .optional(),
    },
    params: {},
    body: {},
});

/**
 * PATCH /api/uploads/:uploadId
 * { uploadId: 5d7e4d4e4f7c8e854f7c8e8t  }
 */
export const updateUploadRequestSchema = Joi.object({
    query: {},
    params: { id: JoiObjectId.required() },
    body: {
        name: Joi.string().regex(nameRegex).optional(),
        parent: JoiObjectId.optional(),
        key: Joi.string().regex(fileKeyRegex).optional(),
        bucket: Joi.string().regex(fileBucketRegex).optional(),
        size: Joi.number().min(minFileSizeInBytes).max(maxFileSizeInBytes).optional(),
        source: Joi.string()
            .valid(...sources)
            .optional(),
    },
});

/**
 * delete /api/uploads/:uploadId
 * { uploadId: 5d7e4d4e4f7c8e854f7c8e8t  }
 */
export const deleteUploadRequestSchema = Joi.object({
    query: {},
    params: { id: JoiObjectId.required() },
    body: {},
});

export default {
    createUploadRequestSchema,
    getUploadsRequestSchema,
    updateUploadRequestSchema,
    deleteUploadRequestSchema,
};
