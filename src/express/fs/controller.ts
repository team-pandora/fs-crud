import { Request, Response } from 'express';
import { IReqParams } from './interface';
import * as fsManager from './manager';

const getFsObject = async (req: Request<IReqParams>, res: Response) => {
    res.json(await fsManager.getFsObject(req.params.fsObjectId));
};

const createFile = async (req: Request, res: Response) => {
    res.json(await fsManager.createFile(req.body));
};

const createFolder = async (req: Request, res: Response) => {
    res.json(await fsManager.createFolder(req.body));
};

const createShortcut = async (req: Request, res: Response) => {
    res.json(await fsManager.createShortcut(req.body));
};

const updateFile = async (req: Request<IReqParams>, res: Response) => {
    res.json(await fsManager.updateFile(req.params.fsObjectId, req.body));
};

const updateFolder = async (req: Request<IReqParams>, res: Response) => {
    res.json(await fsManager.updateFolder(req.params.fsObjectId, req.body));
};

const updateShortcut = async (req: Request<IReqParams>, res: Response) => {
    res.json(await fsManager.updateShortcut(req.params.fsObjectId, req.body));
};

const deleteFile = async (req: Request<IReqParams>, res: Response) => {
    res.json(await fsManager.deleteFile(req.params.fsObjectId));
};

const deleteShortcut = async (req: Request<IReqParams>, res: Response) => {
    res.json(await fsManager.deleteShortcut(req.params.fsObjectId));
};

export {
    getFsObject,
    createFile,
    createFolder,
    createShortcut,
    updateShortcut,
    updateFile,
    updateFolder,
    deleteFile,
    deleteShortcut,
};
