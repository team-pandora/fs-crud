import * as mongoose from 'mongoose';

export const permissions = ['read', 'write', 'owner'] as const;
export type permission = typeof permissions[number];

export interface IState {
    _id: mongoose.Types.ObjectId;
    userId: string;
    fsObjectId: string;
    favorite: boolean;
    trash: boolean;
    root: boolean;
    permission: permission;
    createdAt: Date;
    updatedAt: Date;
}

export interface INewState {
    userId: string;
    fsObjectId: string;
    favorite?: boolean;
    trash?: boolean;
    root: boolean;
    permission: permission;
}

export type IStateFilters = Partial<INewState>;
