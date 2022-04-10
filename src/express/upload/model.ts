import * as mongoose from 'mongoose';
import config from '../../config';
import { errorHandler } from '../../utils/mongo';
import { IUpload } from './interface';

const UploadSchema = new mongoose.Schema<IUpload & mongoose.Document>(
    {
        name: {
            type: String,
            required: true,
        },
        parent: {
            type: 'ObjectId',
            default: null,
            ref: config.mongo.uploadsCollectionName,
        },
        uploadedBytes: {
            type: Number,
            required: true,
        },
        key: {
            type: String,
            required: true,
        },
        bucket: {
            type: String,
            required: true,
        },
        source: {
            type: String,
            required: true,
        },
        size: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

UploadSchema.post(/save|update|findOneAndUpdate|insertMany/, errorHandler);

const UploadModel = mongoose.model<IUpload & mongoose.Document>(config.mongo.uploadsCollectionName, UploadSchema);

export default UploadModel;
