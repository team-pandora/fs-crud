import { Request, Response } from 'express';
import { IUserActionParams } from './interface';
import * as actionsManager from './manager';

const aggregateStatesFsObjects = async (req: Request, res: Response) => {
    res.json(await actionsManager.aggregateStatesFsObjects(req.query));
};

const aggregateFsObjectStates = async (req: Request, res: Response) => {
    res.json(await actionsManager.aggregateFsObjectsStates(req.query));
};

const deleteFileTransaction = async (req: Request<IUserActionParams>, res: Response) => {
    res.json(await actionsManager.deleteFileTransaction(req.params.userId, req.params.fsObjectId));
};

const createUserFile = async (req: Request, res: Response) => {
    res.json(await actionsManager.createUserFile(req.params.userId, req.body));
};

const createUserFolder = async (req: Request, res: Response) => {
    res.json(await actionsManager.createUserFolder(req.params.userId, req.body));
};

const createUserShortcut = async (req: Request, res: Response) => {
    res.json(await actionsManager.createUserShortcut(req.params.userId, req.body));
};

const updateShortcutTransaction = async (req: Request<IUserActionParams>, res: Response) => {
    res.json(await actionsManager.updateShortcutTransaction(req.params.userId, req.params.fsObjectId, req.body));
};

const getAllSharedUsers = async (req: Request<IUserActionParams>, res: Response) => {
    res.json(await actionsManager.getAllSharedUsers(req.params.userId, req.params.fsObjectId));
};

const shareFsObject = async (req: Request<IUserActionParams>, res: Response) => {
    res.json(
        await actionsManager.shareFsObject(
            req.params.userId,
            req.params.fsObjectId,
            req.body.userId,
            req.body.permission,
        ),
    );
};

const getFsObjectHierarchy = async (req: Request<IUserActionParams>, res: Response) => {
    res.json(await actionsManager.getFsObjectHierarchy(req.params.userId, req.params.fsObjectId));
};

export {
    aggregateStatesFsObjects,
    aggregateFsObjectStates,
    deleteFileTransaction,
    createUserFile,
    createUserShortcut,
    createUserFolder,
    updateShortcutTransaction,
    getAllSharedUsers,
    shareFsObject,
    getFsObjectHierarchy,
};
