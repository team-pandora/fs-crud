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
    '/fs/shortcut',
    ValidateRequest(apiValidator.createShortcutRequestSchema),
    wrapMiddleware(apiController.createShortcut),
);

apiRouter.post(
    '/fs/:fsObjectId/share',
    ValidateRequest(apiValidator.shareFsObjectRequestSchema),
    wrapMiddleware(apiController.shareFsObject),
);

apiRouter.post(
    '/uploads/upload',
    ValidateRequest(apiValidator.createUploadRequestSchema),
    wrapMiddleware(apiController.createUpload),
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

apiRouter.get(
    '/uploads/:uploadId',
    ValidateRequest(apiValidator.getUploadRequestSchema),
    wrapMiddleware(apiController.getUpload),
);

apiRouter.get(
    '/uploads',
    ValidateRequest(apiValidator.getUploadsRequestSchema),
    wrapMiddleware(apiController.getUploads),
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

apiRouter.patch(
    '/fs/shortcut/:fsObjectId',
    ValidateRequest(apiValidator.updateShortcutRequestSchema),
    wrapMiddleware(apiController.updateShortcut),
);

apiRouter.patch(
    '/uploads/upload/:uploadId',
    ValidateRequest(apiValidator.updateUploadRequestSchema),
    wrapMiddleware(apiController.updateUpload),
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

apiRouter.delete(
    '/fs/:fsObjectId/shortcut',
    ValidateRequest(apiValidator.deleteShortcutRequestSchema),
    wrapMiddleware(apiController.deleteShortcut),
);

apiRouter.delete(
    '/:uploadId',
    ValidateRequest(apiValidator.deleteUploadRequestSchema),
    wrapMiddleware(apiController.deleteUpload),
);

export default apiRouter;
