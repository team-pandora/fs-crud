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
            type: String,
            required: true,
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
            required: true,
        },
        permission: {
            type: String,
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

const StateModel = mongoose.model<IState & mongoose.Document>(config.mongo.stateCollectionName, StateSchema);

export default StateModel;
