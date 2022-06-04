import config from '../../config';
import { ObjectId } from '../../utils/mongoose';

export type fsObjectType = typeof config.constants.fsObjectTypes[number];

export type client = typeof config.constants.clients[number];

export interface IFsObject {
    _id: ObjectId;
    name: string;
    parent: ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
    type: fsObjectType;
}

export interface IFile extends IFsObject {
    key: string;
    bucket: string;
    size: number;
    public: boolean;
    client: client;
}

export interface IFolder extends IFsObject {}

export interface IShortcut extends IFsObject {
    ref: ObjectId;
}

export interface IFsObjectFilters {
    _id?: ObjectId | { $in: ObjectId[] } | { $nin: ObjectId[] };
    name?: string;
    parent?: ObjectId | null;
}

export interface IFileFilters extends IFsObjectFilters {
    key?: string;
    bucket?: string;
    size?: number;
    public?: boolean;
    client?: client;
}

export interface IFolderFilters extends IFsObjectFilters {}

export interface IShortcutFilters extends IFsObjectFilters {
    ref?: ObjectId;
}

export interface INewFile {
    name: string;
    parent: ObjectId | null;
    key: string;
    bucket: string;
    size: number;
    client: client;

    public?: boolean;
}

export interface INewFolder {
    name: string;
    parent: ObjectId | null;
}

export interface INewShortcut {
    name: string;
    parent: ObjectId | null;
    ref: ObjectId;
}

export interface IUpdateFile {
    name?: string;
    parent?: ObjectId | null;
    key?: string;
    bucket?: string;
    size?: number;
    public?: boolean;
}

export interface IUpdateFolder {
    name?: string;
    parent?: ObjectId | null;
}

export interface IUpdateShortcut {
    name?: string;
    parent?: ObjectId | null;
}
