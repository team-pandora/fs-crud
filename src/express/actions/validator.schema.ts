/**
 * POST /api/file
 * {name: 'abc', parent: '5d7e4d4e4f7c8e8d4f7c8e8d', key: 'abc', bucket: 'abc', size: 123, public: true, source: 'dropbox'}
 */
// export const createFileRequestSchema = Joi.object({
//     query: {},
//     params: {},
//     body: {
//         name: Joi.string().regex(nameRegex).required(),
//         parent: JoiObjectId.allow(null).optional(),
//         key: Joi.string().regex(fileKeyRegex).required(),
//         bucket: Joi.string().regex(fileBucketRegex).required(),
//         size: Joi.number().min(minFileSizeInBytes).max(maxFileSizeInBytes).required(),
//         public: Joi.boolean().optional(),
//         source: Joi.string()
//             .valid(...sources)
//             .optional(),
//     },
// });

export default {};
