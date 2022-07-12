import { Request, Response } from 'express';
import { IUserActionParams, IUserFsActionParams } from './interface';
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

export const moveFileToTrash = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    res.json(await usersManager.moveFileToTrash(userId, fsObjectId));
};

export const moveFolderToTrash = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    res.json(await usersManager.moveFolderToTrash(userId, fsObjectId));
};

export const moveShortcutToTrash = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    res.json(await usersManager.moveShortcutToTrash(userId, fsObjectId));
};

export const restoreFileFromTrash = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    res.json(await usersManager.restoreFileFromTrash(userId, fsObjectId));
};

export const restoreFolderFromTrash = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    res.json(await usersManager.restoreFolderFromTrash(userId, fsObjectId));
};

export const restoreShortcutFromTrash = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    res.json(await usersManager.restoreShortcutFromTrash(userId, fsObjectId));
};

export const shareFsObject = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    const { sharedUserId, sharedPermission } = req.body;
    res.json(await usersManager.shareFsObject(userId, fsObjectId, sharedUserId, sharedPermission));
};

export const favoriteFsObject = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    res.json(await usersManager.favoriteFsObject(userId, fsObjectId));
};

export const aggregateStatesFsObjects = async (req: Request<IUserActionParams>, res: Response) => {
    res.json(await usersManager.aggregateStatesFsObjects(req.params.userId, req.query));
};

export const aggregateFsObjectsStates = async (req: Request<IUserFsActionParams>, res: Response) => {
    res.json(await usersManager.aggregateFsObjectsStates(req.params.userId, req.query));
};

export const searchFsObjectsStates = async (req: Request<IUserFsActionParams>, res: Response) => {
    res.json(await usersManager.searchFsObjectsStates(req.params.userId, req.query.query as string));
};

export const getQuotaByUserId = async (req: Request<IUserActionParams>, res: Response) => {
    res.json(await usersManager.getQuotaByUserId(req.params.userId));
};

export const getFsObjectHierarchy = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    res.json(await usersManager.getFsObjectHierarchy(userId, fsObjectId));
};

export const getFolderChildren = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    res.json(await usersManager.getFolderChildren(userId, fsObjectId));
};

export const getSharedUsers = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    res.json(await usersManager.getSharedUsers(userId, fsObjectId));
};

export const updateFile = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    res.json(await usersManager.updateFile(userId, fsObjectId, req.body));
};

export const updateFolder = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    res.json(await usersManager.updateFolder(userId, fsObjectId, req.body));
};

export const updateShortcut = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    res.json(await usersManager.updateShortcut(userId, fsObjectId, req.body));
};

export const updateFsPermission = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    const { sharedUserId, updatePermission } = req.body;
    res.json(await usersManager.updateFsObjectPermission(userId, fsObjectId, sharedUserId, updatePermission));
};

export const unshareFsObject = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    res.json(await usersManager.unshareFsObject(userId, fsObjectId, req.body.sharedUserId));
};

export const unfavoriteFsObject = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    res.json(await usersManager.unfavoriteFsObject(userId, fsObjectId));
};

export const deleteFileFromTrash = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    res.json(await usersManager.deleteFileFromTrash(userId, fsObjectId));
};

export const deleteFolderFromTrash = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    res.json(await usersManager.deleteFolderFromTrash(userId, fsObjectId));
};

export const deleteShortcutFromTrash = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    res.json(await usersManager.deleteShortcutFromTrash(userId, fsObjectId));
};

export const deleteFile = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    res.json(await usersManager.deleteFile(userId, fsObjectId));
};

export const deleteFolder = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    res.json(await usersManager.deleteFolder(userId, fsObjectId));
};

export const deleteShortcut = async (req: Request<IUserFsActionParams>, res: Response) => {
    const { userId, fsObjectId } = req.params;
    res.json(await usersManager.deleteShortcut(userId, fsObjectId));
};
