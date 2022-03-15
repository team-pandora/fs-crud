import { Router } from 'express';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import * as stateController from './controller';
import * as stateValidator from './validator.schema';

const stateRouter: Router = Router();

stateRouter.post(
    '/',
    ValidateRequest(stateValidator.createStateRequestSchema),
    wrapController(stateController.createState),
);

stateRouter.get('/', ValidateRequest(stateValidator.getStatesRequestSchema), wrapController(stateController.getStates));

export default stateRouter;
