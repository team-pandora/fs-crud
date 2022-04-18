import * as mongoose from 'mongoose';
import config from '../../config';

export type permission = typeof config.constants.permissions[number];
export interface IRequestParams {
    stateId: mongoose.Types.ObjectId;
}

export interface IState {
    _id: mongoose.Types.ObjectId;
    userId: string;
    fsObjectId: mongoose.Types.ObjectId;
    favorite: boolean;
    trash: boolean;
    trashRoot: boolean;
    root: boolean;
    permission: permission;
    createdAt: Date;
    updatedAt: Date;
}

export type IStateFilters = {
    _id?: mongoose.Types.ObjectId;
    userId?: string | { $in: string[] } | { $nin: string[] };
    fsObjectId?: mongoose.Types.ObjectId | { $in: mongoose.Types.ObjectId[] } | { $nin: mongoose.Types.ObjectId[] };
    favorite?: boolean;
    trash?: boolean;
    trashRoot?: boolean;
    root?: boolean;
    permission?: permission | { $in: permission[] } | { $nin: string[] };
};

export interface INewState {
    userId: string;
    fsObjectId: mongoose.Types.ObjectId;
    permission: permission;

    favorite?: boolean;
    trash?: boolean;
    trashRoot?: boolean;

    root?: boolean;
}

export interface IUpdateState {
    favorite?: boolean;
    trash?: boolean;
    trashRoot?: boolean;
    permission?: permission;

    root?: boolean;
}
