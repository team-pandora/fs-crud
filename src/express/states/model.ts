import * as mongoose from 'mongoose';
import config from '../../config';
import { errorHandler } from '../../utils/mongo';
import { IState } from './interface';

export const StateSchema = new mongoose.Schema<IState & mongoose.Document>(
    {
        userId: {
            type: String,
            required: true,
        },
        fsObjectId: {
            type: 'ObjectId',
            required: true,
            ref: config.mongo.fsObjectsCollectionName,
        },
        favorite: {
            type: Boolean,
            required: true,
        },
        trash: {
            type: Boolean,
            required: true,
        },
        root: {
            type: Boolean,
        },
        permission: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

StateSchema.index({ fsObjectId: 1, userId: 1 }, { unique: true });
StateSchema.index({ userId: 1, favorite: 1 });
StateSchema.index({ userId: 1, trash: 1 });
StateSchema.index({ userId: 1, permission: 1, root: 1 });

StateSchema.post(/save|update|findOneAndUpdate|insertMany/, errorHandler);

const StateModel = mongoose.model<IState & mongoose.Document>(config.mongo.statesCollectionName, StateSchema);

export default StateModel;
