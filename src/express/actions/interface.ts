import * as mongoose from 'mongoose';
import { fsObjectType, IFile, IFolder, IShortcut, source } from '../fs/interface';
import { IState, permission } from '../states/interface';

export const AggregateStatesFsObjectsSortByFields = [
    'size',
    'public',
    'name',
    'type',
    'fsObjectCreatedAt',
    'fsObjectUpdatedAt',
    'stateCreatedAt',
    'stateUpdatedAt',
    'stateUpdatedAt',
] as const;
export type AggregateStatesFsObjectsSortBy = typeof AggregateStatesFsObjectsSortByFields[number];

export const AggregateStatesFsObjectsSortOrders = ['asc', 'desc'] as const;
export type AggregateStatesFsObjectsSortOrder = typeof AggregateStatesFsObjectsSortOrders[number];

export interface IUserActionParams {
    userId: string;
    fsObjectId: mongoose.Types.ObjectId;
}

export interface IUserStateActionParams {
    userId: string;
    stateId: mongoose.Types.ObjectId;
}

export interface IAggregateStatesFsObjectsReq {
    // State filters
    stateId?: mongoose.Types.ObjectId;
    userId?: string;
    fsObjectId?: mongoose.Types.ObjectId;
    favorite?: boolean;
    trash?: boolean;
    root?: boolean;
    permission?: Array<permission>;

    // FsObject filters
    key?: string;
    bucket?: string;
    source?: string;
    size?: number;
    public?: boolean;
    name?: string;
    parent?: mongoose.Types.ObjectId;
    type?: fsObjectType;
    ref?: mongoose.Types.ObjectId;

    // Sort
    sortBy?: AggregateStatesFsObjectsSortBy;
    sortOrder?: AggregateStatesFsObjectsSortOrder;

    // Pagination
    page?: number;
    pageSize?: number;
}

export type IAggregateFsObjectsStatesReq = IAggregateStatesFsObjectsReq;

export interface IUserAndPermission {
    userId: string;
    permission: permission;
}

export class FsObjectAndState {
    public stateId: mongoose.Types.ObjectId;

    public userId: string;

    public fsObjectId: mongoose.Types.ObjectId;

    public favorite: boolean;

    public trash: boolean;

    public root: boolean;

    public permission: permission;

    public stateCreatedAt: Date;

    public stateUpdatedAt: Date;

    public key?: string;

    public bucket?: string;

    public source?: source;

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
            this.source = file.source;
        }

        if (fsObject.type === 'shortcut') {
            const shortcut = fsObject as IShortcut;
            this.ref = shortcut.ref;
        }
    }
}