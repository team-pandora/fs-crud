import { Request, Response } from 'express';
import * as fsManager from './manager';

const createFile = async (req: Request, res: Response) => {
    res.json(await fsManager.createFile(req.body));
};

const createFolder = async (req: Request, res: Response) => {
    res.json(await fsManager.createFolder(req.body));
};

const createShortcut = async (req: Request, res: Response) => {
    res.json(await fsManager.createShortcut(req.body));
};

export { createFile, createFolder, createShortcut };
