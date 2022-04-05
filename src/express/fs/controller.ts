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

const updateShortcut = async (req: Request<IReqParams>, res: Response) => {
    res.json(await fsManager.updateShortcut(req.params.fsObjectId, req.body));
};
export { getFsObject, createFile, createFolder, createShortcut, updateShortcut };
