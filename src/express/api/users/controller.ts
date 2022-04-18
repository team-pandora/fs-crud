import { Request, Response } from 'express';
import { IUserActionParams, IUserFsActionParams, IUserStateActionParams } from './interface';
import * as usersManager from './manager';

export const createFile = async (req: Request<IUserActionParams>, res: Response) => {
    res.json(await usersManager.createFile(req.params.userId, req.body));
};

export const createFolder = async (req: Request<IUserActionParams>, res: Response) => {
    res.json(await usersManager.createFolder(req.params.userId, req.body));
};

export const createShortcut = async (req: Request<IUserActionParams>, res: Response) => {
    res.json(await usersManager.createShortcut(req.params.userId, req.body));
};

export const restoreFileFromTrash = async (req: Request<IUserFsActionParams>, res: Response) => {
    res.json(await usersManager.restoreFileFromTrash(req.params.userId, req.params.fsObjectId));
};

export const restoreFolderFromTrash = async (req: Request<IUserFsActionParams>, res: Response) => {
    res.json(await usersManager.restoreFolderFromTrash(req.params.userId, req.params.fsObjectId));
};

export const restoreShortcutFromTrash = async (req: Request<IUserFsActionParams>, res: Response) => {
    res.json(await usersManager.restoreShortcutFromTrash(req.params.userId, req.params.fsObjectId));
};

export const shareFsObject = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    const { sharedUserId, sharedPermission } = req.body;
    res.json(await usersManager.shareFsObject(userId, fsObjectId, sharedUserId, sharedPermission));
};

export const aggregateStatesFsObjects = async (req: Request<IUserActionParams>, res: Response) => {
    res.json(await usersManager.aggregateStatesFsObjects(req.params.userId, req.query));
};

export const aggregateFsObjectsStates = async (req: Request<IUserFsActionParams>, res: Response) => {
    res.json(await usersManager.aggregateFsObjectsStates(req.params.userId, req.query));
};

export const getQuotaByUserId = async (req: Request<IUserActionParams>, res: Response) => {
    res.json(await usersManager.getQuotaByUserId(req.params.userId));
};

export const getFsObjectHierarchy = async (req: Request<IUserFsActionParams>, res: Response) => {
    res.json(await usersManager.getFsObjectHierarchy(req.params.userId, req.params.fsObjectId));
};

export const updateState = async (req: Request<IUserStateActionParams>, res: Response) => {
    res.json(await usersManager.updateState(req.params.userId, req.params.stateId, req.body));
};

export const updateFile = async (req: Request<IUserFsActionParams>, res: Response) => {
    res.json(await usersManager.updateFile(req.params.userId, req.params.fsObjectId, req.body));
};

export const updateFolder = async (req: Request<IUserFsActionParams>, res: Response) => {
    res.json(await usersManager.updateFolder(req.params.userId, req.params.fsObjectId, req.body));
};

export const updateShortcut = async (req: Request<IUserFsActionParams>, res: Response) => {
    res.json(await usersManager.updateShortcut(req.params.userId, req.params.fsObjectId, req.body));
};

export const unshareFsObject = async (req: Request<IUserFsActionParams>, res: Response) => {
    res.json(await usersManager.unshareFsObject(req.params.userId, req.params.fsObjectId, req.body));
};

export const deleteFile = async (req: Request<IUserFsActionParams>, res: Response) => {
    res.json(await usersManager.deleteFile(req.params.userId, req.params.fsObjectId));
};

export const deleteFolder = async (req: Request<IUserFsActionParams>, res: Response) => {
    res.json(await usersManager.deleteFolder(req.params.userId, req.params.fsObjectId));
};

export const deleteShortcut = async (req: Request<IUserFsActionParams>, res: Response) => {
    res.json(await usersManager.deleteShortcut(req.params.userId, req.params.fsObjectId));
};
