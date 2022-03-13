import { Request, Response } from 'express';
import { INewQuota } from './interface';
import * as quotaManager from './manager';

const createQuota = async (req: Request, res: Response) => {
    res.json(await quotaManager.createQuota(req.body as INewQuota));
};

const getQuotaByUserId = async (req: Request, res: Response) => {
    res.json(await quotaManager.getQuotaByUserId(req.params.userId));
};

const updateQuotaLimit = async (req: Request, res: Response) => {
    res.json(await quotaManager.updateQuotaLimit(req.params.userId, req.body.limit));
};
const raiseQuoataUsed = async (req: Request, res: Response) => {
     res.json(await quotaManager.raiseQuoataUsed(req.params.userId, req.body.raiseBy));
}

export { getQuotaByUserId, createQuota, updateQuotaLimit };
