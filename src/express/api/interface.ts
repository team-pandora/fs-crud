import config from '../../config';
import { ObjectId } from '../../utils/mongoose';
import { fsObjectType, IFile, IFolder, IShortcut } from '../fs/interface';
import { IState, permission } from '../states/interface';

export type AggregateStatesAndFsObjectsSortField =
    | typeof config.constants.fsObjectsSortFields[number]
    | typeof config.constants.statesSortFields[number];

export type AggregateStatesFsObjectsSortOrder = typeof config.constants.sortOrders[number];

export interface IFsActionParams {
    fsObjectId: ObjectId;
}

export interface IAggregateStatesAndFsObjectsQuery {
    // State filters
    stateId?: ObjectId;
    userId?: string;
    fsObjectId?: ObjectId | { $in: ObjectId[] };
    favorite?: boolean;
    trash?: boolean;
    trashRoot?: boolean;
    root?: boolean;
    permission?: permission | { $in: Array<permission> } | { $nin: Array<permission> };

    // FsObject filters
    bucket?: string;
    client?: string;
    size?: number | { $gt: number };
    public?: boolean;
    name?: string;
    parent?: ObjectId;
    type?: fsObjectType;
    ref?: ObjectId;

    // Sort
    sortBy?: AggregateStatesAndFsObjectsSortField;
    sortOrder?: AggregateStatesFsObjectsSortOrder;

    // Pagination
    page?: number;
    pageSize?: number;
}

export class FsObjectAndState {
    public stateId: ObjectId;

    public userId: string;

    public fsObjectId: ObjectId;

    public favorite: boolean;

    public trash: boolean;

    public trashRoot: boolean;

    public root: boolean;

    public permission: permission;

    public stateCreatedAt: Date;

    public stateUpdatedAt: Date;

    public bucket?: string;

    public client?: string;

    public size?: number;

    public public?: boolean;

    public name: string;

    public parent: ObjectId | null;

    public type: fsObjectType;

    public fsObjectCreatedAt: Date;

    public fsObjectUpdatedAt: Date;

    public ref?: ObjectId;

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
