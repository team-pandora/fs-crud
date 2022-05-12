import { Router } from 'express';
import wrapMiddleware from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import * as apiController from './controller';
import usersRouter from './users/router';
import * as apiValidator from './validator.schema';

const apiRouter: Router = Router();

apiRouter.use('/', usersRouter);

apiRouter.post(
    '/fs/file',
    ValidateRequest(apiValidator.createFileRequestSchema),
    wrapMiddleware(apiController.createFile),
);

apiRouter.post(
    '/fs/folder',
    ValidateRequest(apiValidator.createFolderRequestSchema),
    wrapMiddleware(apiController.createFolder),
);

apiRouter.post(
    '/fs/:fsObjectId/share',
    ValidateRequest(apiValidator.shareFsObjectRequestSchema),
    wrapMiddleware(apiController.shareFsObject),
);

apiRouter.get(
    '/states/fsObjects',
    ValidateRequest(apiValidator.aggregateStatesFsObjectsRequestSchema),
    wrapMiddleware(apiController.aggregateStatesFsObjects),
);

apiRouter.get(
    '/fsObjects/states',
    ValidateRequest(apiValidator.aggregateFsObjectsStatesRequestSchema),
    wrapMiddleware(apiController.aggregateFsObjectsStates),
);

apiRouter.get(
    '/fs/:fsObjectId/hierarchy',
    ValidateRequest(apiValidator.getFsObjectHierarchyRequestSchema),
    wrapMiddleware(apiController.getFsObjectHierarchy),
);

apiRouter.patch(
    '/states/:stateId',
    ValidateRequest(apiValidator.updateStateRequestSchema),
    wrapMiddleware(apiController.updateState),
);

apiRouter.patch(
    '/fs/file/:fsObjectId',
    ValidateRequest(apiValidator.updateFileRequestSchema),
    wrapMiddleware(apiController.updateFile),
);

apiRouter.patch(
    '/fs/folder/:fsObjectId',
    ValidateRequest(apiValidator.updateFolderRequestSchema),
    wrapMiddleware(apiController.updateFolder),
);

apiRouter.delete(
    '/fs/:fsObjectId/share',
    ValidateRequest(apiValidator.unshareFsObjectRequestSchema),
    wrapMiddleware(apiController.unshareFsObject),
);

apiRouter.delete(
    '/fs/:fsObjectId/file',
    ValidateRequest(apiValidator.deleteFileRequestSchema),
    wrapMiddleware(apiController.deleteFile),
);

apiRouter.delete(
    '/fs/:fsObjectId/folder',
    ValidateRequest(apiValidator.deleteFolderRequestSchema),
    wrapMiddleware(apiController.deleteFolder),
);

export default apiRouter;
