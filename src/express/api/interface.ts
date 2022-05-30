import * as mongoose from 'mongoose';
import config from '../../config';
import { client, fsObjectType, IFile, IFolder, IShortcut } from '../fs/interface';
import { IState, permission } from '../states/interface';

export type AggregateStatesAndFsObjectsSortField =
    | typeof config.constants.fsObjectsSortFields[number]
    | typeof config.constants.statesSortFields[number];

export type AggregateStatesFsObjectsSortOrder = typeof config.constants.sortOrders[number];

export interface IFsActionParams {
    fsObjectId: mongoose.Types.ObjectId;
}

export interface IStateActionParams {
    stateId: mongoose.Types.ObjectId;
}

export interface IUploadActionParams {
    uploadId: mongoose.Types.ObjectId;
}

export interface IAggregateStatesAndFsObjectsQuery {
    // State filters
    stateId?: mongoose.Types.ObjectId;
    userId?: string;
    fsObjectId?: mongoose.Types.ObjectId | { $in: mongoose.Types.ObjectId[] };
    favorite?: boolean;
    trash?: boolean;
    trashRoot?: boolean;
    root?: boolean;
    permission?: permission | { $in: Array<permission> } | { $nin: Array<permission> };

    // FsObject filters
    key?: string;
    bucket?: string;
    client?: string;
    size?: number;
    public?: boolean;
    name?: string;
    parent?: mongoose.Types.ObjectId;
    type?: fsObjectType;
    ref?: mongoose.Types.ObjectId;

    // Sort
    sortBy?: AggregateStatesAndFsObjectsSortField;
    sortOrder?: AggregateStatesFsObjectsSortOrder;

    // Pagination
    page?: number;
    pageSize?: number;
}

export class FsObjectAndState {
    public stateId: mongoose.Types.ObjectId;

    public userId: string;

    public fsObjectId: mongoose.Types.ObjectId;

    public favorite: boolean;

    public trash: boolean;

    public trashRoot: boolean;

    public root: boolean;

    public permission: permission;

    public stateCreatedAt: Date;

    public stateUpdatedAt: Date;

    public key?: string;

    public bucket?: string;

    public client?: client;

    public size?: number;

    public public?: boolean;

    public name: string;

    public parent: mongoose.Types.ObjectId | null;

    public type: fsObjectType;

    public fsObjectCreatedAt: Date;

    public fsObjectUpdatedAt: Date;

    public ref?: mongoose.Types.ObjectId;

    constructor(fsObject: IFile | IFolder | IShortcut, state: IState) {
        this.stateId = state._id;
        this.userId = state.userId;
        this.favorite = state.favorite;
        this.trash = state.trash;
        this.trashRoot = state.trashRoot;
        this.root = state.root;
        this.permission = state.permission;
        this.stateCreatedAt = state.createdAt;
        this.stateUpdatedAt = state.updatedAt;

        this.fsObjectId = fsObject._id;
        this.name = fsObject.name;
        this.parent = fsObject.parent;
        this.type = fsObject.type;
        this.fsObjectCreatedAt = fsObject.createdAt;
        this.fsObjectUpdatedAt = fsObject.updatedAt;

        if (fsObject.type === 'file') {
            const file = fsObject as IFile;
            this.key = file.key;
            this.bucket = file.bucket;
            this.size = file.size;
            this.public = file.public;
            this.client = file.client;
        }

        if (fsObject.type === 'shortcut') {
            const shortcut = fsObject as IShortcut;
            this.ref = shortcut.ref;
        }
    }
}
