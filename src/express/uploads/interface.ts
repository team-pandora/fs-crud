import * as mongoose from 'mongoose';
import { source } from '../fs/interface';

export interface IUpload {
    _id: mongoose.Types.ObjectId;
    userId: string;
    name: string;
    parent: mongoose.Types.ObjectId | null;
    key: string;
    bucket: string;
    size: number;
    uploadedBytes: number;
    source: source;
    createdAt: Date;
    updatedAt: Date;
}

export interface INewUpload {
    userId: string;
    name: string;
    parent: mongoose.Types.ObjectId | null;
    key: string;
    bucket: string;
    size: number;
    uploadedBytes: number;
    source: source;
}

export interface IUpdateUpload {
    uploadedBytes: number;
}

export type IUploadFilters = {
    _id?: mongoose.Types.ObjectId;
    userId?: string;
    name?: string;
    source?: source;
};
