import { Router } from 'express';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import * as statesController from './controller';
import * as statesValidator from './validator.schema';

const statesRouter: Router = Router();

statesRouter.get(
    '/:stateId',
    ValidateRequest(statesValidator.getStateByIdRequestSchema),
    wrapController(statesController.getStateById),
);

statesRouter.get(
    '/',
    ValidateRequest(statesValidator.getStatesRequestSchema),
    wrapController(statesController.getStates),
);

statesRouter.post(
    '/',
    ValidateRequest(statesValidator.createStateRequestSchema),
    wrapController(statesController.createState),
);

statesRouter.patch(
    '/:stateId',
    ValidateRequest(statesValidator.updateStateRequestSchema),
    wrapController(statesController.updateState),
);

export default statesRouter;
