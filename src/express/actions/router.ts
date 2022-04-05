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
    ValidateRequest(actionsValidator.aggregateFsObjectsStatesRequestSchema),
    wrapController(actionsController.aggregateFsObjectStates),
);

actionsRouter.post(
    '/users/:userId/fs/file',
    ValidateRequest(actionsValidator.createUserFileRequestSchema),
    wrapController(actionsController.createUserFile),
);

actionsRouter.post(
    '/users/:userId/fs/folder',
    ValidateRequest(actionsValidator.createUserFolderRequestSchema),
    wrapController(actionsController.createUserFolder),
);

actionsRouter.post(
    '/users/:userId/fs/shortcut',
    ValidateRequest(actionsValidator.createUserShortcutRequestSchema),
    wrapController(actionsController.createUserShortcut),
);

actionsRouter.patch(
    '/users/:userId/fs/shortcut/:id',
    ValidateRequest(actionsValidator.updatedShortcutTransactionRequestSchema),
    wrapController(actionsController.updateShortcutTransaction),
);

actionsRouter.get(
    '/users/:userId/fs/:fsObjectId/sharedUsers',
    ValidateRequest(actionsValidator.getAllSharedUsersRequestSchema),
    wrapController(actionsController.getAllSharedUsers),
);

actionsRouter.post(
    '/users/:userId/fs/:fsObjectId/share',
    ValidateRequest(actionsValidator.shareFsObjectRequestSchema),
    wrapController(actionsController.shareFsObject),
);

actionsRouter.delete(
    '/users/:userId/fs/:fsObjectId',
    ValidateRequest(actionsValidator.deleteFileTransactionRequestSchema),
    wrapController(actionsController.deleteFileTransaction),
);

actionsRouter.get(
    '/users/:userId/fs/:fsObjectId/hierarchy',
    ValidateRequest(actionsValidator.getFsObjectHierarchyRequestSchema),
    wrapController(actionsController.getFsObjectHierarchy),
);

export default actionsRouter;
