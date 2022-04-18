import { IFsActionParams, IStateActionParams } from '../interface';

export interface IUserActionParams {
    userId: string;
}

export type IUserFsActionParams = IUserActionParams & IFsActionParams;

export type IUserStateActionParams = IUserActionParams & IStateActionParams;
