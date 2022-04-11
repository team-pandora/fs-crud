import * as mongoose from 'mongoose';
import { source } from '../fs/interface';

export interface IUpload {
    _id: mongoose.Types.ObjectId;
    name: string;
    parent?: mongoose.Types.ObjectId | null;
    fsObjectId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    uploadedBytes: number;
    key: string;
    bucket: string;
    size: number;
    source: source;
}

export interface INewUpload {
    name: string;
    parent?: mongoose.Types.ObjectId | null;
    uploadedBytes: number;
    key: string;
    bucket: string;
    size: number;
    source?: source;
}

export interface IUpdatedUpload {
    uploadedBytes?: number;
    name?: string;
}

export type IUploadFilters = Partial<INewUpload>;
