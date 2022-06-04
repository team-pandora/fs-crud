import * as mongoose from 'mongoose';
import config from '../../config';
import { setDefaultSettings, setErrorHandler } from '../../utils/mongoose';
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
            min: 0,
        },
        used: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        timestamps: true,
    },
);

QuotaSchema.index({ userId: 1 });

setDefaultSettings(QuotaSchema);

setErrorHandler(QuotaSchema);

const QuotaModel = mongoose.model<IQuota & mongoose.Document>(config.mongo.quotasCollectionName, QuotaSchema);

export default QuotaModel;
