import { Router } from 'express';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import * as actionsController from './controller';
import * as actionsValidator from './validator.schema';

const actionsRouter: Router = Router();

actionsRouter.get(
    '/states/fsObjects',
    ValidateRequest(actionsValidator.aggregateStatesFsObjectsRequestSchema),
    wrapController(actionsController.aggregateStatesFsObjects),
);
actionsRouter.get(
    '/fsObjects/states',
    ValidateRequest(actionsValidator.aggregateStatesFsObjectsRequestSchema),
    wrapController(actionsController.aggregateFsObjectStates),
);
actionsRouter.delete(
    '/users/fsObjects/:fsObjectId',
    ValidateRequest(actionsValidator.deleteObjectTransactionsRequestSchema),
    wrapController(actionsController.deleteObjectTransactions),
);

export default actionsRouter;
