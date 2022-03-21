import { Router } from 'express';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import * as fsController from './controller';
import * as fsValidator from './validator.schema';

const fsRouter: Router = Router();

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

export default fsRouter;
