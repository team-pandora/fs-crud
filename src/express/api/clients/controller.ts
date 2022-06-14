import { Request, Response } from 'express';
import { IClientActionParams, IClientFsActionParams } from './interface';
import * as apiManager from './manager';

export const createFile = async (req: Request<IClientActionParams>, res: Response) => {
    res.json(await apiManager.createFile(req.params.client, req.body));
};

export const shareFile = async (req: Request<IClientFsActionParams>, res: Response) => {
    const { client, fsObjectId } = req.params;
    const { sharedUserId, sharedPermission } = req.body;
    res.json(await apiManager.shareFile(client, fsObjectId, sharedUserId, sharedPermission));
};

export const aggregateStatesFsObjects = async (req: Request<IClientActionParams>, res: Response) => {
    res.json(await apiManager.aggregateStatesFsObjects(req.params.client, req.query));
};

export const aggregateFsObjectsStates = async (req: Request<IClientActionParams>, res: Response) => {
    res.json(await apiManager.aggregateFsObjectsStates(req.params.client, req.query));
};

export const getFiles = async (req: Request<IClientActionParams>, res: Response) => {
    res.json(await apiManager.getFiles(req.params.client, req.query));
};

export const updateFile = async (req: Request<IClientFsActionParams>, res: Response) => {
    const { client, fsObjectId } = req.params;
    res.json(await apiManager.updateFileById(client, fsObjectId, req.body));
};

export const updateFilePermission = async (req: Request<IClientFsActionParams>, res: Response) => {
    const { client, fsObjectId } = req.params;
    const { sharedUserId, updatePermission } = req.body;
    res.json(await apiManager.updateFilePermission(client, fsObjectId, sharedUserId, updatePermission));
};

export const unshareFile = async (req: Request<IClientFsActionParams>, res: Response) => {
    const { client, fsObjectId } = req.params;
    res.json(await apiManager.unshareFileById(client, fsObjectId, req.body.sharedUserId));
};

export const deleteFile = async (req: Request<IClientFsActionParams>, res: Response) => {
    const { client, fsObjectId } = req.params;
    res.json(await apiManager.deleteFileById(client, fsObjectId));
};
