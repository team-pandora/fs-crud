import { Request, Response } from 'express';
import { IAggregateStatesFsObjectsReq } from './interface';
import * as actionsManager from './manager';

const aggregateStatesFsObjects = async (req: Request, res: Response) => {
    res.json(await actionsManager.aggregateStatesFsObjects(req.query as IAggregateStatesFsObjectsReq));
};

const aggregateFsObjectStates = async (req: Request, res: Response) => {
    res.json(await actionsManager.aggregateFsObjectsStates(req.query as IAggregateStatesFsObjectsReq));
};

// const deleteObjectTransactions = async (req: Request, res: Response) => {
//     res.json(await actionsManager.deleteObjectTransactions(req.params.fsObjectId as IAggregateStatesFsObjectsReq));
// };

const createUserFileTransaction = async (req: Request, res: Response) => {
    res.json(await actionsManager.createUserFileTransaction(req.params.userId, req.body));
};

export { aggregateStatesFsObjects, aggregateFsObjectStates, createUserFileTransaction };
