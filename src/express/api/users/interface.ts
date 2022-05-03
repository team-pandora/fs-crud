import { IFsActionParams, IStateActionParams, IUploadActionParams } from '../interface';

export interface IUserActionParams {
    userId: string;
}

export type IUserFsActionParams = IUserActionParams & IFsActionParams;

export type IUserStateActionParams = IUserActionParams & IStateActionParams;

export type IUserUploadActionParams = IUserActionParams & IUploadActionParams;
