import { client } from '../../fs/interface';
import { IFsActionParams } from '../interface';

export interface IClientActionParams {
    clientId: client;
}

export type IClientFsActionParams = IClientActionParams & IFsActionParams;
