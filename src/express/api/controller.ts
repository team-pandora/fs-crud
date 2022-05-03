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
    res.json(await apiManager.shareFsObjectById(req.params.fsObjectId, sharedUserId, sharedPermission));
};

export const aggregateStatesFsObjects = async (req: Request, res: Response) => {
    res.json(await apiManager.aggregateStatesFsObjects(req.query));
};

export const aggregateFsObjectsStates = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.aggregateFsObjectsStates(req.query));
};

export const getFsObjectHierarchy = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.getFsObjectHierarchyById(req.params.fsObjectId));
};

export const updateState = async (req: Request<IStateActionParams>, res: Response) => {
    res.json(await apiManager.updateStateById(req.params.stateId, req.body));
};

export const updateFile = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.updateFileById(req.params.fsObjectId, req.body));
};

export const updateFolder = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.updateFolderById(req.params.fsObjectId, req.body));
};

export const updateShortcut = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.updateShortcutById(req.params.fsObjectId, req.body));
};

export const unshareFsObject = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.unshareFsObjectById(req.params.fsObjectId, req.body.userId));
};

export const deleteFile = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.deleteFileById(req.params.fsObjectId));
};

export const deleteFolder = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.deleteFolderById(req.params.fsObjectId));
};

export const deleteShortcut = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.deleteShortcutById(req.params.fsObjectId));
};
