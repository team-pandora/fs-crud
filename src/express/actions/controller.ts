import { Request, Response } from 'express';
import { IUserActionParams, IUserStateActionParams } from './interface';
import * as actionsManager from './manager';

const aggregateStatesFsObjects = async (req: Request, res: Response) => {
    res.json(await actionsManager.aggregateStatesFsObjects(req.query));
};

const aggregateFsObjectStates = async (req: Request, res: Response) => {
    res.json(await actionsManager.aggregateFsObjectsStates(req.query));
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

const updateUserState = async (req: Request<IUserStateActionParams>, res: Response) => {
    res.json(await actionsManager.updateUserState(req.params.userId, req.params.stateId, req.body));
};

const getSharedUsers = async (req: Request<IUserActionParams>, res: Response) => {
    res.json(await actionsManager.getSharedUsers(req.params.userId, req.params.fsObjectId));
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

const updateUserFile = async (req: Request<IUserActionParams>, res: Response) => {
    res.json(await actionsManager.updateUserFile(req.params.userId, req.params.fsObjectId, req.body));
};

const updateUserFolder = async (req: Request<IUserActionParams>, res: Response) => {
    res.json(await actionsManager.updateUserFolder(req.params.userId, req.params.fsObjectId, req.body));
};

const updateUserShortcut = async (req: Request<IUserActionParams>, res: Response) => {
    res.json(await actionsManager.updateUserShortcut(req.params.userId, req.params.fsObjectId, req.body));
};

const deleteUserFile = async (req: Request<IUserActionParams>, res: Response) => {
    res.json(await actionsManager.deleteUserFile(req.params.userId, req.params.fsObjectId));
};

const deleteUserShortcut = async (req: Request<IUserActionParams>, res: Response) => {
    res.json(await actionsManager.deleteUserShortcut(req.params.userId, req.params.fsObjectId));
};

export {
    aggregateStatesFsObjects,
    aggregateFsObjectStates,
    createUserFile,
    createUserShortcut,
    createUserFolder,
    updateUserState,
    getSharedUsers,
    shareFsObject,
    getFsObjectHierarchy,
    updateUserFile,
    updateUserFolder,
    updateUserShortcut,
    deleteUserFile,
    deleteUserShortcut,
};
