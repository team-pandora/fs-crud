import { IFsActionParams } from '../interface';

export interface IUserActionParams {
    userId: string;
}

export type IUserFsActionParams = IUserActionParams & IFsActionParams;
