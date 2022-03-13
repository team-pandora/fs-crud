import * as mongoose from 'mongoose';
import config from '../../config';
import { mongoDuplicateKeyError } from './errors';
import { IQuota } from './interface';

export const QuotaSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
        },
        limit: {
            type: Number,
            required: true,
        },
        used: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: false,
        versionKey: false,
    },
);

function errorHandler(error: any, _res: any, next: any) {
    if (error.code === 11000) {
        next(mongoDuplicateKeyError(error));
    } else {
        next();
    }
}

QuotaSchema.post(/save|update|findOneAndUpdate|insertMany/, errorHandler);

const QuotaModel = mongoose.model<IQuota & mongoose.Document>(config.mongo.quotaCollectionName, QuotaSchema);

export default QuotaModel;
