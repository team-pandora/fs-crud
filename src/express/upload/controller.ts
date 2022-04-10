import { Request, Response } from 'express';
import { IUpload, IUploadFilters } from './interface';
import * as uploadManager from './manager';

const createUpload = async (req: Request, res: Response) => {
    res.json(await uploadManager.createUpload(req.body as IUpload));
};

const getUploads = async (req: Request, res: Response) => {
    res.json(await uploadManager.getUploads(req.query));
};

const updateUpload = async (req: Request, res: Response) => {
    res.json(await uploadManager.updateUpload(req.params.id, req.body as IUploadFilters));
};

const deleteUpload = async (req: Request, res: Response) => {
    res.json(await uploadManager.deleteUpload(req.params.id));
};

export { createUpload, getUploads, updateUpload, deleteUpload };
