import { Router } from 'express';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import * as fsController from './controller';
import * as fsValidator from './validator.schema';

const fsRouter: Router = Router();

fsRouter.get(
    '/:objectId',
    ValidateRequest(fsValidator.getFsObjectRequestSchema),
    wrapController(fsController.getFsObject),
);

fsRouter.post('/file', ValidateRequest(fsValidator.createFileRequestSchema), wrapController(fsController.createFile));

fsRouter.post(
    '/folder',
    ValidateRequest(fsValidator.createFolderRequestSchema),
    wrapController(fsController.createFolder),
);

fsRouter.post(
    '/shortcut',
    ValidateRequest(fsValidator.createShortcutRequestSchema),
    wrapController(fsController.createShortcut),
);

fsRouter.patch(
    '/file/:fsObjectId',
    ValidateRequest(fsValidator.updateFileRequestSchema),
    wrapController(fsController.updateFile),
);

fsRouter.patch(
    '/folder/:fsObjectId',
    ValidateRequest(fsValidator.updateFolderRequestSchema),
    wrapController(fsController.updateFolder),
);

fsRouter.patch(
    '/shortcut/:fsObjectId',
    ValidateRequest(fsValidator.updateShortcutRequestSchema),
    wrapController(fsController.updateShortcut),
);

export default fsRouter;
