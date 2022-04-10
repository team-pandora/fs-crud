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
    '/users/:userId/states/:stateId',
    ValidateRequest(actionsValidator.updateUserStateRequestSchema),
    wrapController(actionsController.updateUserState),
);

actionsRouter.get(
    '/users/:userId/fs/:fsObjectId/sharedUsers',
    ValidateRequest(actionsValidator.getSharedUsersRequestSchema),
    wrapController(actionsController.getSharedUsers),
);

actionsRouter.post(
    '/users/:userId/fs/:fsObjectId/share',
    ValidateRequest(actionsValidator.shareFsObjectRequestSchema),
    wrapController(actionsController.shareFsObject),
);

actionsRouter.get(
    '/users/:userId/fs/:fsObjectId/hierarchy',
    ValidateRequest(actionsValidator.getFsObjectHierarchyRequestSchema),
    wrapController(actionsController.getFsObjectHierarchy),
);

actionsRouter.patch(
    '/users/:userId/fsObjects/file/:fsObjectId',
    ValidateRequest(actionsValidator.updateUserFileRequestSchema),
    wrapController(actionsController.updateUserFile),
);

actionsRouter.patch(
    '/users/:userId/fsObjects/folder/:fsObjectId',
    ValidateRequest(actionsValidator.updateUserFolderRequestSchema),
    wrapController(actionsController.updateUserFolder),
);

actionsRouter.patch(
    '/users/:userId/fsObjects/shortcut/:fsObjectId',
    ValidateRequest(actionsValidator.updateUserShortcutRequestSchema),
    wrapController(actionsController.updateUserShortcut),
);

export default actionsRouter;
