import * as mongoose from 'mongoose';

export const sources = ['dropbox', 'drive', 'falcon'] as const;
export type source = typeof sources[number];

export const fsObjectTypes = ['file', 'folder', 'shortcut'] as const;
export type fsObjectType = typeof fsObjectTypes[number];

export interface IReqParams {
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

export interface INewFile {
    name: string;
    parent?: mongoose.Types.ObjectId | null;
    key: string;
    bucket: string;
    size: number;
    public?: boolean;
    source: source;
}

export interface INewFolder {
    name: string;
    parent?: mongoose.Types.ObjectId | null;
}

export interface INewShortcut {
    name: string;
    parent?: mongoose.Types.ObjectId | null;
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

export type IUpdateShortcut = IUpdateFolder;
