import { Request, Response } from 'express';
import { INewQuota } from './interface';
import * as quotasManager from './manager';

const createQuota = async (req: Request, res: Response) => {
    res.json(await quotasManager.createQuota(req.body as INewQuota));
};

const getQuotaByUserId = async (req: Request, res: Response) => {
    res.json(await quotasManager.getQuotaByUserId(req.params.userId));
};

const updateQuotaLimit = async (req: Request, res: Response) => {
    res.json(await quotasManager.updateQuotaLimit(req.params.userId, req.body.limit));
};

const changeQuotaUsed = async (req: Request, res: Response) => {
    res.json(await quotasManager.changeQuotaUsed(req.params.userId, req.body.difference));
};

export { getQuotaByUserId, createQuota, updateQuotaLimit, changeQuotaUsed };
