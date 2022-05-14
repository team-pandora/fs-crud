import * as mongoose from 'mongoose';
import config from '../../config';

export type fsObjectType = typeof config.constants.fsObjectTypes[number];

export type source = typeof config.constants.clients[number];

export interface IRequestParams {
    fsObjectId: mongoose.Types.ObjectId;
}

export interface IFsObject {
    _id: mongoose.Types.ObjectId;
    name: string;
    parent: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
    type: fsObjectType;
}

export interface IFile extends IFsObject {
    key: string;
    bucket: string;
    size: number;
    public: boolean;
    source: source;
}

export interface IFolder extends IFsObject {}

export interface IShortcut extends IFsObject {
    ref: mongoose.Types.ObjectId;
}

export interface IFsObjectFilters {
    _id?: mongoose.Types.ObjectId | { $in: mongoose.Types.ObjectId[] } | { $nin: mongoose.Types.ObjectId[] };
    name?: string;
    parent?: mongoose.Types.ObjectId | null;
}

export interface IFileFilters {
    _id?: mongoose.Types.ObjectId;
    name?: string;
    parent?: mongoose.Types.ObjectId | null;
    key?: string;
    bucket?: string;
    size?: number;
    public?: boolean;
    source?: source;
}

export interface IFolderFilters {
    _id?: mongoose.Types.ObjectId;
    name?: string;
    parent?: mongoose.Types.ObjectId | null;
}

export interface IShortcutFilters {
    _id?: mongoose.Types.ObjectId;
    name?: string;
    parent?: mongoose.Types.ObjectId | null;
    ref?: mongoose.Types.ObjectId;
}

export interface INewFile {
    name: string;
    parent: mongoose.Types.ObjectId | null;
    key: string;
    bucket: string;
    size: number;
    source: source;

    public?: boolean;
}

export interface INewFolder {
    name: string;
    parent: mongoose.Types.ObjectId | null;
}

export interface INewShortcut {
    name: string;
    parent: mongoose.Types.ObjectId | null;
    ref: mongoose.Types.ObjectId;
}

export interface IUpdateFile {
    name?: string;
    parent?: mongoose.Types.ObjectId | null;
    key?: string;
    bucket?: string;
    size?: number;
    public?: boolean;
}

export interface IUpdateFolder {
    name?: string;
    parent?: mongoose.Types.ObjectId | null;
}

export interface IUpdateShortcut {
    name?: string;
    parent?: mongoose.Types.ObjectId | null;
}
