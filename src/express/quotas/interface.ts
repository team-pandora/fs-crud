import { ObjectId } from '../../utils/mongoose';

export interface IQuota {
    _id: ObjectId;
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
