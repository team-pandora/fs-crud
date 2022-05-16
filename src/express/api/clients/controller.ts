import { Request, Response } from 'express';
import { IFsActionParams } from '../interface';
import * as apiManager from './manager';

export const createFile = async (req: Request, res: Response) => {
    res.json(await apiManager.createFile(req.body));
};

export const createFolder = async (req: Request, res: Response) => {
    res.json(await apiManager.createFolder(req.body));
};

export const shareFsObject = async (req: Request<IFsActionParams>, res: Response) => {
    const { sharedUserId, sharedPermission } = req.body;
    res.json(await apiManager.shareFsObjectById(req.params.fsObjectId, sharedUserId, sharedPermission));
};

export const addToFavorite = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.addToFavorite(req.params.fsObjectId));
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

export const updateFile = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.updateFileById(req.params.fsObjectId, req.body));
};

export const updateFolder = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.updateFolderById(req.params.fsObjectId, req.body));
};

export const unshareFsObject = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.unshareFsObjectById(req.params.fsObjectId, req.body.userId));
};

export const removeFromFavorite = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.removeFavorite(req.params.fsObjectId));
};

export const deleteFile = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.deleteFileById(req.params.fsObjectId));
};

export const deleteFolder = async (req: Request<IFsActionParams>, res: Response) => {
    res.json(await apiManager.deleteFolderById(req.params.fsObjectId));
};
