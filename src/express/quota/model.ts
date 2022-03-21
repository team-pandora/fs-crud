import * as mongoose from 'mongoose';
import config from '../../config';
import { errorHandler } from '../../utils/mongo';
import { IQuota } from './interface';

const QuotaSchema = new mongoose.Schema<IQuota & mongoose.Document>(
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
            required: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

QuotaSchema.index({ userId: 1 });

QuotaSchema.post(/save|update|findOneAndUpdate|insertMany/, errorHandler);

const QuotaModel = mongoose.model<IQuota & mongoose.Document>(config.mongo.quotaCollectionName, QuotaSchema);

export default QuotaModel;
