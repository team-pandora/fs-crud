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

const getObject = async (req: Request, res: Response) => {
    // eslint-disable-next-line no-underscore-dangle
    res.json(await fsManager.getObject(req.params.id));
};

export { createFile, createFolder, createShortcut, getObject };
