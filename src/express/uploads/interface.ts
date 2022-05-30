import { ObjectId } from '../../utils/mongoose';
import { client } from '../fs/interface';

export interface IUpload {
    _id: ObjectId;
    userId: string;
    name: string;
    parent: ObjectId | null;
    key: string;
    bucket: string;
    size: number;
    uploadedBytes: number;
    client: client;
    createdAt: Date;
    updatedAt: Date;
}

export interface INewUpload {
    userId: string;
    name: string;
    parent: ObjectId | null;
    key: string;
    bucket: string;
    size: number;
    uploadedBytes: number;
    client: client;
}

export interface IUpdateUpload {
    uploadedBytes: number;
}

export type IUploadFilters = {
    _id?: ObjectId;
    userId?: string;
    name?: string;
    client?: client;
};
