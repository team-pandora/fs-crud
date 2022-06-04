import { Router } from 'express';
import wrapMiddleware from '../../../utils/express';
import ValidateRequest from '../../../utils/joi';
import * as apiController from './controller';
import * as apiValidator from './validator.schema';

const clientsRouter: Router = Router();

clientsRouter.post(
    '/:clientId/fs/file',
    ValidateRequest(apiValidator.createFileRequestSchema),
    wrapMiddleware(apiController.createFile),
);

clientsRouter.post(
    '/:clientId/fs/file/:fsObjectId/share',
    ValidateRequest(apiValidator.shareFileRequestSchema),
    wrapMiddleware(apiController.shareFile),
);

clientsRouter.get(
    '/:clientId/states/fsObjects',
    ValidateRequest(apiValidator.aggregateStatesFsObjectsRequestSchema),
    wrapMiddleware(apiController.aggregateStatesFsObjects),
);

clientsRouter.get(
    '/:clientId/fsObjects/states',
    ValidateRequest(apiValidator.aggregateFsObjectsStatesRequestSchema),
    wrapMiddleware(apiController.aggregateFsObjectsStates),
);

clientsRouter.patch(
    '/:clientId/fs/file/:fsObjectId',
    ValidateRequest(apiValidator.updateFileRequestSchema),
    wrapMiddleware(apiController.updateFile),
);

clientsRouter.patch(
    '/:clientId/fs/file/:fsObjectId/permission',
    ValidateRequest(apiValidator.updateFilePermissionRequestSchema),
    wrapMiddleware(apiController.updateFilePermission),
);

clientsRouter.delete(
    '/:clientId/fs/file/:fsObjectId/share',
    ValidateRequest(apiValidator.unshareFileRequestSchema),
    wrapMiddleware(apiController.unshareFile),
);

clientsRouter.delete(
    '/:clientId/fs/file/:fsObjectId',
    ValidateRequest(apiValidator.deleteFileRequestSchema),
    wrapMiddleware(apiController.deleteFile),
);

export default clientsRouter;
