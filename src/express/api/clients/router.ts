import { Router } from 'express';
import wrapMiddleware from '../../../utils/express';
import ValidateRequest from '../../../utils/joi';
import * as apiController from './controller';
import * as apiValidator from './validator.schema';

const clientsRouter: Router = Router();

clientsRouter.post(
    '/:client/fs/file',
    ValidateRequest(apiValidator.createFileRequestSchema),
    wrapMiddleware(apiController.createFile),
);

clientsRouter.post(
    '/:client/fs/file/:fsObjectId/share',
    ValidateRequest(apiValidator.shareFileRequestSchema),
    wrapMiddleware(apiController.shareFile),
);

clientsRouter.get(
    '/:client/states/fsObjects',
    ValidateRequest(apiValidator.aggregateStatesFsObjectsRequestSchema),
    wrapMiddleware(apiController.aggregateStatesFsObjects),
);

clientsRouter.get(
    '/:client/fsObjects/states',
    ValidateRequest(apiValidator.aggregateFsObjectsStatesRequestSchema),
    wrapMiddleware(apiController.aggregateFsObjectsStates),
);

clientsRouter.get(
    '/:client/fs/files',
    ValidateRequest(apiValidator.getFilesRequestSchema),
    wrapMiddleware(apiController.getFiles),
);

clientsRouter.patch(
    '/:client/fs/file/:fsObjectId',
    ValidateRequest(apiValidator.updateFileRequestSchema),
    wrapMiddleware(apiController.updateFile),
);

clientsRouter.patch(
    '/:client/fs/file/:fsObjectId/permission',
    ValidateRequest(apiValidator.updateFilePermissionRequestSchema),
    wrapMiddleware(apiController.updateFilePermission),
);

clientsRouter.delete(
    '/:client/fs/file/:fsObjectId/share',
    ValidateRequest(apiValidator.unshareFileRequestSchema),
    wrapMiddleware(apiController.unshareFile),
);

clientsRouter.delete(
    '/:client/fs/file/:fsObjectId',
    ValidateRequest(apiValidator.deleteFileRequestSchema),
    wrapMiddleware(apiController.deleteFile),
);

export default clientsRouter;
