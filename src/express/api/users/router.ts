import { Router } from 'express';
import wrapMiddleware from '../../../utils/express';
import ValidateRequest from '../../../utils/joi';
import * as usersController from './controller';
import * as usersValidator from './validator.schema';

const usersRouter: Router = Router();

usersRouter.post(
    '/users/:userId/fs/file',
    ValidateRequest(usersValidator.createFileRequestSchema),
    wrapMiddleware(usersController.createFile),
);

usersRouter.post(
    '/users/:userId/fs/folder',
    ValidateRequest(usersValidator.createFolderRequestSchema),
    wrapMiddleware(usersController.createFolder),
);

usersRouter.post(
    '/users/:userId/fs/shortcut',
    ValidateRequest(usersValidator.createShortcutRequestSchema),
    wrapMiddleware(usersController.createShortcut),
);

usersRouter.post(
    '/users/:userId/fs/file/:fsObjectId/restore',
    ValidateRequest(usersValidator.restoreFileFromTrashRequestSchema),
    wrapMiddleware(usersController.restoreFileFromTrash),
);

usersRouter.post(
    '/users/:userId/fs/folder/:fsObjectId/restore',
    ValidateRequest(usersValidator.restoreFolderFromTrashRequestSchema),
    wrapMiddleware(usersController.restoreFolderFromTrash),
);

usersRouter.post(
    '/users/:userId/fs/shortcut/:fsObjectId/restore',
    ValidateRequest(usersValidator.restoreShortcutFromTrashRequestSchema),
    wrapMiddleware(usersController.restoreShortcutFromTrash),
);

usersRouter.post(
    '/users/:userId/fs/:fsObjectId/share',
    ValidateRequest(usersValidator.shareFsObjectRequestSchema),
    wrapMiddleware(usersController.shareFsObject),
);

usersRouter.post(
    '/users/:userId/uploads',
    ValidateRequest(usersValidator.createUploadRequestSchema),
    wrapMiddleware(usersController.createUpload),
);

usersRouter.get(
    '/users/:userId/quota',
    ValidateRequest(usersValidator.getQuotaByUserIdRequestSchema),
    wrapMiddleware(usersController.getQuotaByUserId),
);

usersRouter.get(
    '/users/:userId/states/fsObjects',
    ValidateRequest(usersValidator.aggregateStatesFsObjectsRequestSchema),
    wrapMiddleware(usersController.aggregateStatesFsObjects),
);

usersRouter.get(
    '/users/:userId/fsObjects/states',
    ValidateRequest(usersValidator.aggregateFsObjectsStatesRequestSchema),
    wrapMiddleware(usersController.aggregateFsObjectsStates),
);

usersRouter.get(
    '/users/:userId/fs/:fsObjectId/hierarchy',
    ValidateRequest(usersValidator.getFsObjectHierarchyRequestSchema),
    wrapMiddleware(usersController.getFsObjectHierarchy),
);

usersRouter.get(
    '/users/:userId/uploads/upload',
    ValidateRequest(usersValidator.getUploadRequestSchema),
    wrapMiddleware(usersController.getUpload),
);

usersRouter.get(
    '/users/:userId/uploads',
    ValidateRequest(usersValidator.getUploadsRequestSchema),
    wrapMiddleware(usersController.getUploads),
);

usersRouter.patch(
    '/users/:userId/states/:stateId',
    ValidateRequest(usersValidator.updateStateRequestSchema),
    wrapMiddleware(usersController.updateState),
);

usersRouter.patch(
    '/users/:userId/fs/file/:fsObjectId',
    ValidateRequest(usersValidator.updateFileRequestSchema),
    wrapMiddleware(usersController.updateFile),
);

usersRouter.patch(
    '/users/:userId/fs/folder/:fsObjectId',
    ValidateRequest(usersValidator.updateFolderRequestSchema),
    wrapMiddleware(usersController.updateFolder),
);

usersRouter.patch(
    '/users/:userId/fs/shortcut/:fsObjectId',
    ValidateRequest(usersValidator.updateShortcutRequestSchema),
    wrapMiddleware(usersController.updateShortcut),
);

usersRouter.patch(
    '/users/:userId/uploads/:uploadId',
    ValidateRequest(usersValidator.updateUploadRequestSchema),
    wrapMiddleware(usersController.updateUpload),
);

usersRouter.delete(
    '/users/:userId/fs/:fsObjectId/share',
    ValidateRequest(usersValidator.unshareFsObjectRequestSchema),
    wrapMiddleware(usersController.unshareFsObject),
);

usersRouter.delete(
    '/users/:userId/fs/file/:fsObjectId',
    ValidateRequest(usersValidator.deleteFileRequestSchema),
    wrapMiddleware(usersController.deleteFile),
);

usersRouter.delete(
    '/users/:userId/fs/folder/:fsObjectId',
    ValidateRequest(usersValidator.deleteFolderRequestSchema),
    wrapMiddleware(usersController.deleteFolder),
);

usersRouter.delete(
    '/users/:userId/fs/shortcut/:fsObjectId',
    ValidateRequest(usersValidator.deleteShortcutRequestSchema),
    wrapMiddleware(usersController.deleteShortcut),
);

usersRouter.delete(
    '/users/:userId/uploads/:uploadId',
    ValidateRequest(usersValidator.deleteUploadRequestSchema),
    wrapMiddleware(usersController.deleteUpload),
);

export default usersRouter;
