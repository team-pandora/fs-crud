import { Router } from 'express';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';

const actionsRouter: Router = Router();

actionsRouter.get(
    '/getFsObjectsByUserId',
    ValidateRequest(actionsValidator.createFileRequestSchema),
    wrapController(actionsController.createFile),
);

export default actionsRouter;
