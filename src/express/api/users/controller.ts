import { Request, Response } from 'express';
import { IUserActionParams, IUserFsActionParams, IUserUploadActionParams } from './interface';
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

export const createUpload = async (req: Request<IUserActionParams>, res: Response) => {
    res.json(await usersManager.createUpload(req.params.userId, req.body));
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

export const addToFavorite = async (req: Request<IUserFsActionParams>, res: Response) => {
    res.json(await usersManager.addToFavorite(req.params.userId, req.params.fsObjectId));
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

export const getUploads = async (req: Request, res: Response) => {
    res.json(await usersManager.getUploads(req.params.userId, req.query));
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

export const updateUpload = async (req: Request<IUserUploadActionParams>, res: Response) => {
    res.json(await usersManager.updateUploadById(req.params.userId, req.params.uploadId, req.body));
};

export const updateFsPermission = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    const { sharedUserId, updatePermission } = req.body;
    res.json(await usersManager.updateFsPermission(userId, fsObjectId, sharedUserId, updatePermission));
};

export const unshareFsObject = async (req: Request<IUserFsActionParams>, res: Response) => {
    res.json(await usersManager.unshareFsObject(req.params.userId, req.params.fsObjectId, req.body.userId));
};

export const removeFromFavorite = async (req: Request<IUserFsActionParams>, res: Response) => {
    res.json(await usersManager.removeFromFavorite(req.params.userId, req.params.fsObjectId));
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

export const deleteUpload = async (req: Request<IUserUploadActionParams>, res: Response) => {
    res.json(await usersManager.deleteUploadById(req.params.userId, req.params.uploadId));
};
