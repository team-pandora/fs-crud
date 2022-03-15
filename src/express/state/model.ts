import * as mongoose from 'mongoose';
import config from '../../config';
import { mongoDuplicateKeyError } from './errors';
import { IState } from './interface';

export const StateSchema = new mongoose.Schema(
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

function errorHandler(error: any, _res: any, next: any) {
    if (error.code === 11000) {
        next(mongoDuplicateKeyError(error));
    } else {
        next();
    }
}

StateSchema.post(/save|update|findOneAndUpdate|insertMany/, errorHandler);

const StateModel = mongoose.model<IState & mongoose.Document>(config.mongo.stateCollectionName, StateSchema);

export default StateModel;
