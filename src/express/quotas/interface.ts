import * as mongoose from 'mongoose';

export interface IQuota {
    _id: mongoose.Types.ObjectId;
    userId: string;
    used: number;
    limit: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface INewQuota {
    userId: string;
    limit?: number;
    used?: number;
}
