import * as mongoose from 'mongoose';
import config from '../../config';
import { setDefaultSettings, setErrorHandler } from '../../utils/mongoose';
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
        trashRoot: {
            type: Boolean,
            required: true,
        },
        root: {
            type: Boolean,
            required: true,
        },
        permission: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

StateSchema.index({ fsObjectId: 1, userId: 1 }, { unique: true });
StateSchema.index({ userId: 1, favorite: 1 });
StateSchema.index({ userId: 1, trash: 1, trashRoot: 1 });
StateSchema.index({ userId: 1, permission: 1, root: 1 });

setDefaultSettings(StateSchema);

setErrorHandler(StateSchema);

const StateModel = mongoose.model<IState & mongoose.Document>(config.mongo.statesCollectionName, StateSchema);

export default StateModel;
