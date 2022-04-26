import { Request, Response } from 'express';
import { IFsActionParams, IStateActionParams } from './interface';
import * as apiManager from './manager';

export const createFile = async (req: Request, res: Response) => {
    res.json(await apiManager.createFile(req.body));
};

export const createFolder = async (req: Request, res: Response) => {
    res.json(await apiManager.createFolder(req.body));
};

export const createShortcut = async (req: Request, res: Response) => {
    res.json(await apiManager.createShortcut(req.body));
};

export const shareFsObject = async (req: Request<IFsActionParams>, res: Response) => {
    const { sharedUserId, sharedPermission } = req.body;
    res.json(await apiManager.shareFsObject(req.params.fsObjectId, sharedUserId, sharedPermission));
};

export const aggregateStatesFsObjects = async (req: Request, res: Response) => {
    res.json(await apiManager.aggregateStatesFsObjects(req.query));
};

export const aggregateFsObjectsStates = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.aggregateFsObjectsStates(req.query));
};

export const getFsObjectHierarchy = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.getFsObjectHierarchy(req.params.fsObjectId));
};

export const updateState = async (req: Request<IStateActionParams>, res: Response) => {
    res.json(await apiManager.updateState(req.params.stateId, req.body));
};

export const updateFile = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.updateFile(req.params.fsObjectId, req.body));
};

export const updateFolder = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.updateFolder(req.params.fsObjectId, req.body));
};

export const updateShortcut = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.updateShortcut(req.params.fsObjectId, req.body));
};

export const unshareFsObject = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.unshareFsObject(req.params.fsObjectId, req.body.userId));
};

export const deleteFile = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.deleteFile(req.params.fsObjectId));
};

export const deleteFolder = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.deleteFolder(req.params.fsObjectId));
};

export const deleteShortcut = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.deleteShortcut(req.params.fsObjectId));
};
