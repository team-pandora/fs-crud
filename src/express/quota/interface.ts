import * as mongoose from 'mongoose';

export interface IQuota {
    _id: mongoose.Types.ObjectId;
    // TODO
}

export type INewQuota = Omit<IQuota, '_id' | 'createdAt' | 'updatedAt' | '__v'>;
