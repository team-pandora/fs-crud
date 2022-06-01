import { Router } from 'express';
import wrapMiddleware from '../../../utils/express';
import ValidateRequest from '../../../utils/joi';
import * as usersController from './controller';
import * as usersValidator from './validator.schema';

const usersRouter: Router = Router();

usersRouter.post(
    '/:userId/fs/file',
    ValidateRequest(usersValidator.createFileRequestSchema),
    wrapMiddleware(usersController.createFile),
);

usersRouter.post(
    '/:userId/fs/folder',
    ValidateRequest(usersValidator.createFolderRequestSchema),
    wrapMiddleware(usersController.createFolder),
);

usersRouter.post(
    '/:userId/fs/shortcut',
    ValidateRequest(usersValidator.createShortcutRequestSchema),
    wrapMiddleware(usersController.createShortcut),
);

usersRouter.post(
    '/:userId/fs/file/:fsObjectId/restore',
    ValidateRequest(usersValidator.restoreFileFromTrashRequestSchema),
    wrapMiddleware(usersController.restoreFileFromTrash),
);

usersRouter.post(
    '/:userId/fs/folder/:fsObjectId/restore',
    ValidateRequest(usersValidator.restoreFolderFromTrashRequestSchema),
    wrapMiddleware(usersController.restoreFolderFromTrash),
);

usersRouter.post(
    '/:userId/fs/shortcut/:fsObjectId/restore',
    ValidateRequest(usersValidator.restoreShortcutFromTrashRequestSchema),
    wrapMiddleware(usersController.restoreShortcutFromTrash),
);

usersRouter.post(
    '/:userId/fs/:fsObjectId/share',
    ValidateRequest(usersValidator.shareFsObjectRequestSchema),
    wrapMiddleware(usersController.shareFsObject),
);

usersRouter.post(
    '/:userId/fs/:fsObjectId/favorite',
    ValidateRequest(usersValidator.addToFavoriteRequestSchema),
    wrapMiddleware(usersController.favoriteFsObject),
);

usersRouter.get(
    '/:userId/quota',
    ValidateRequest(usersValidator.getQuotaByUserIdRequestSchema),
    wrapMiddleware(usersController.getQuotaByUserId),
);

usersRouter.get(
    '/:userId/states/fsObjects',
    ValidateRequest(usersValidator.aggregateStatesFsObjectsRequestSchema),
    wrapMiddleware(usersController.aggregateStatesFsObjects),
);

usersRouter.get(
    '/:userId/fsObjects/states',
    ValidateRequest(usersValidator.aggregateFsObjectsStatesRequestSchema),
    wrapMiddleware(usersController.aggregateFsObjectsStates),
);

usersRouter.get(
    '/:userId/fs/:fsObjectId/hierarchy',
    ValidateRequest(usersValidator.getFsObjectHierarchyRequestSchema),
    wrapMiddleware(usersController.getFsObjectHierarchy),
);

usersRouter.patch(
    '/:userId/fs/file/:fsObjectId',
    ValidateRequest(usersValidator.updateFileRequestSchema),
    wrapMiddleware(usersController.updateFile),
);

usersRouter.patch(
    '/:userId/fs/folder/:fsObjectId',
    ValidateRequest(usersValidator.updateFolderRequestSchema),
    wrapMiddleware(usersController.updateFolder),
);

usersRouter.patch(
    '/:userId/fs/shortcut/:fsObjectId',
    ValidateRequest(usersValidator.updateShortcutRequestSchema),
    wrapMiddleware(usersController.updateShortcut),
);

usersRouter.patch(
    '/:userId/fs/:fsObjectId/permission',
    ValidateRequest(usersValidator.updatePermissionRequestSchema),
    wrapMiddleware(usersController.updateFsPermission),
);

usersRouter.delete(
    '/:userId/fs/:fsObjectId/share',
    ValidateRequest(usersValidator.unshareFsObjectRequestSchema),
    wrapMiddleware(usersController.unshareFsObject),
);

usersRouter.delete(
    '/:userId/fs/:fsObjectId/favorite',
    ValidateRequest(usersValidator.deleteFileRequestSchema),
    wrapMiddleware(usersController.unfavoriteFsObject),
);

usersRouter.delete(
    '/:userId/fs/file/:fsObjectId',
    ValidateRequest(usersValidator.deleteFileRequestSchema),
    wrapMiddleware(usersController.deleteFile),
);

usersRouter.delete(
    '/:userId/fs/folder/:fsObjectId',
    ValidateRequest(usersValidator.deleteFolderRequestSchema),
    wrapMiddleware(usersController.deleteFolder),
);

usersRouter.delete(
    '/:userId/fs/shortcut/:fsObjectId',
    ValidateRequest(usersValidator.deleteShortcutRequestSchema),
    wrapMiddleware(usersController.deleteShortcut),
);

export default usersRouter;
