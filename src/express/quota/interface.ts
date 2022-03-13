// import { number } from 'joi';
import * as mongoose from 'mongoose';
import config from '../../config';
import { GB } from '../../utils/fs';

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
}

export const defaultNewQuota = {
    limit: config.quota.defaultLimit * GB,
    used: 0,
};
