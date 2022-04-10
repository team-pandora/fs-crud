import * as mongoose from 'mongoose';

export const permissions = ['read', 'write', 'owner'] as const;
export type permission = typeof permissions[number];

export const permissionRanking = {
    read: 0,
    write: 1,
    owner: 2,
};

export interface IState {
    _id: mongoose.Types.ObjectId;
    userId: string;
    fsObjectId: mongoose.Types.ObjectId;
    favorite: boolean;
    trash: boolean;
    root: boolean;
    permission: permission;
    createdAt: Date;
    updatedAt: Date;
}

export interface INewState {
    userId: string;
    fsObjectId: mongoose.Types.ObjectId;
    favorite?: boolean;
    trash?: boolean;
    root: boolean;
    permission: permission;
}

export interface IUpdateState {
    favorite?: boolean;
    trash?: boolean;
    permission?: permission;
    root?: boolean;
}

export type IGetStatesQuery = {
    userId?: string;
    fsObjectId?: mongoose.Types.ObjectId;
    favorite?: boolean;
    trash?: boolean;
    root?: boolean;
    permission?: permission;
};
