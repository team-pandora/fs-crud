import * as mongoose from 'mongoose';
import config from '../../config';
import { setDefaultSettings, setErrorHandler } from '../../utils/mongoose';
import { IUpload } from './interface';

const UploadSchema = new mongoose.Schema<IUpload & mongoose.Document>(
    {
        userId: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        parent: {
            type: 'ObjectId',
            default: null,
            ref: config.mongo.uploadsCollectionName,
        },
        key: {
            type: String,
            required: true,
        },
        bucket: {
            type: String,
            required: true,
        },
        size: {
            type: Number,
            required: true,
        },
        uploadedBytes: {
            type: Number,
            required: true,
        },
        source: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

setDefaultSettings(UploadSchema);

setErrorHandler(UploadSchema);

const UploadModel = mongoose.model<IUpload & mongoose.Document>(config.mongo.uploadsCollectionName, UploadSchema);

export default UploadModel;
