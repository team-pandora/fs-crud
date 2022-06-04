import { Request, Response } from 'express';
import { IClientActionParams, IClientFsActionParams } from './interface';
import * as apiManager from './manager';

export const createFile = async (req: Request<IClientActionParams>, res: Response) => {
    res.json(await apiManager.createFile(req.params.clientId, req.body));
};

export const shareFile = async (req: Request<IClientFsActionParams>, res: Response) => {
    const { clientId, fsObjectId } = req.params;
    const { sharedUserId, sharedPermission } = req.body;
    res.json(await apiManager.shareFile(clientId, fsObjectId, sharedUserId, sharedPermission));
};

export const aggregateStatesFsObjects = async (req: Request<IClientActionParams>, res: Response) => {
    res.json(await apiManager.aggregateStatesFsObjects(req.params.clientId, req.query));
};

export const aggregateFsObjectsStates = async (req: Request<IClientActionParams>, res: Response) => {
    res.json(await apiManager.aggregateFsObjectsStates(req.params.clientId, req.query));
};

export const updateFile = async (req: Request<IClientFsActionParams>, res: Response) => {
    const { clientId, fsObjectId } = req.params;
    res.json(await apiManager.updateFileById(clientId, fsObjectId, req.body));
};

export const updateFilePermission = async (req: Request<IClientFsActionParams>, res: Response) => {
    const { clientId, fsObjectId } = req.params;
    const { sharedUserId, updatePermission } = req.body;
    res.json(await apiManager.updateFilePermission(clientId, fsObjectId, sharedUserId, updatePermission));
};

export const unshareFile = async (req: Request<IClientFsActionParams>, res: Response) => {
    const { clientId, fsObjectId } = req.params;
    res.json(await apiManager.unshareFileById(clientId, fsObjectId, req.body.sharedUserId));
};

export const deleteFile = async (req: Request<IClientFsActionParams>, res: Response) => {
    const { clientId, fsObjectId } = req.params;
    res.json(await apiManager.deleteFileById(clientId, fsObjectId));
};
