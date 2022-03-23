import { Request, Response } from 'express';
import { IAggregateStatesFsObjectsReq } from './interface';
import * as actionsManager from './manager';

const aggregateStatesFsObjects = async (req: Request, res: Response) => {
    res.json(await actionsManager.aggregateStatesFsObjects(req.query as IAggregateStatesFsObjectsReq));
};

export { aggregateStatesFsObjects };
export default { aggregateStatesFsObjects };
