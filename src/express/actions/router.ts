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
// actionsRouter.delete(
//     '/users/fsObjects/:fsObjectId',
//     ValidateRequest(actionsValidator.deleteObjectTransactionsRequestSchema),
//     wrapController(actionsController.deleteObjectTransactions),
// );
actionsRouter.post(
    '/users/:userId/fsObjects/file',
    ValidateRequest(actionsValidator.createUserFileTransactionRequestSchema),
    wrapController(actionsController.createUserFileTransaction),
);

actionsRouter.post(
    '/users/:userId/fsObjects/folder',
    ValidateRequest(actionsValidator.createUserFolderTransactionRequestSchema),
    wrapController(actionsController.createUserFolderTransaction),
);

actionsRouter.post(
    '/users/:userId/fsObjects/shortcut',
    ValidateRequest(actionsValidator.createUserShortcutTransactionRequestSchema),
    wrapController(actionsController.createUserShortcutTransaction),
);

export default actionsRouter;
