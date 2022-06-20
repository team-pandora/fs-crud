import { IFsActionParams } from '../interface';

export interface IClientActionParams {
    client: string;
}

export type IClientFsActionParams = IClientActionParams & IFsActionParams;
