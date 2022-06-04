import config from '../../config';
import { ObjectId } from '../../utils/mongoose';

export type permission = typeof config.constants.permissions[number];
export interface IRequestParams {
    stateId: ObjectId;
}

export interface IState {
    _id: ObjectId;
    userId: string;
    fsObjectId: ObjectId;
    favorite: boolean;
    trash: boolean;
    trashRoot: boolean;
    root: boolean;
    permission: permission;
    createdAt: Date;
    updatedAt: Date;
}

export type IStateFilters = {
    _id?: ObjectId;
    userId?: string | { $in: string[] } | { $nin: string[] };
    fsObjectId?: ObjectId | { $in: ObjectId[] } | { $nin: ObjectId[] };
    favorite?: boolean;
    trash?: boolean;
    trashRoot?: boolean;
    root?: boolean;
    permission?: permission | { $in: permission[] } | { $nin: string[] };
};

export interface INewState {
    userId: string;
    fsObjectId: ObjectId;
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
