import { Router } from 'express';
import wrapMiddleware from '../../../utils/express';
import ValidateRequest from '../../../utils/joi';
import * as apiController from './controller';
import * as apiValidator from './validator.schema';

const clientsRouter: Router = Router();

clientsRouter.post(
    '/fs/file',
    ValidateRequest(apiValidator.createFileRequestSchema),
    wrapMiddleware(apiController.createFile),
);

clientsRouter.post(
    '/fs/folder',
    ValidateRequest(apiValidator.createFolderRequestSchema),
    wrapMiddleware(apiController.createFolder),
);

clientsRouter.post(
    '/fs/:fsObjectId/share',
    ValidateRequest(apiValidator.shareFsObjectRequestSchema),
    wrapMiddleware(apiController.shareFsObject),
);

clientsRouter.post(
    '/fs/:fsObjectId/favorite',
    ValidateRequest(apiValidator.addToFavoriteRequestSchema),
    wrapMiddleware(apiController.addToFavorite),
);

clientsRouter.get(
    '/states/fsObjects',
    ValidateRequest(apiValidator.aggregateStatesFsObjectsRequestSchema),
    wrapMiddleware(apiController.aggregateStatesFsObjects),
);

clientsRouter.get(
    '/fsObjects/states',
    ValidateRequest(apiValidator.aggregateFsObjectsStatesRequestSchema),
    wrapMiddleware(apiController.aggregateFsObjectsStates),
);

clientsRouter.get(
    '/fs/:fsObjectId/hierarchy',
    ValidateRequest(apiValidator.getFsObjectHierarchyRequestSchema),
    wrapMiddleware(apiController.getFsObjectHierarchy),
);

clientsRouter.patch(
    '/fs/file/:fsObjectId',
    ValidateRequest(apiValidator.updateFileRequestSchema),
    wrapMiddleware(apiController.updateFile),
);

clientsRouter.patch(
    '/fs/folder/:fsObjectId',
    ValidateRequest(apiValidator.updateFolderRequestSchema),
    wrapMiddleware(apiController.updateFolder),
);

clientsRouter.patch(
    '/fs/:fsObjectId/permission',
    ValidateRequest(apiValidator.editFsObjectPermissionRequestSchema),
    wrapMiddleware(apiController.updateFsPermission),
);

clientsRouter.delete(
    '/fs/:fsObjectId/share',
    ValidateRequest(apiValidator.unshareFsObjectRequestSchema),
    wrapMiddleware(apiController.unshareFsObject),
);

clientsRouter.delete(
    '/fs/:fsObjectId/favorite',
    ValidateRequest(apiValidator.deleteFileRequestSchema),
    wrapMiddleware(apiController.removeFromFavorite),
);

clientsRouter.delete(
    '/fs/:fsObjectId/file',
    ValidateRequest(apiValidator.deleteFileRequestSchema),
    wrapMiddleware(apiController.deleteFile),
);

clientsRouter.delete(
    '/fs/:fsObjectId/folder',
    ValidateRequest(apiValidator.deleteFolderRequestSchema),
    wrapMiddleware(apiController.deleteFolder),
);

export default clientsRouter;
