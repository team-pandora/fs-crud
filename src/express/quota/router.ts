import { Router } from 'express';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import * as QuotaController from './controller';
import * as QuotaValidator from './validator.schema';

const quotaRouter: Router = Router();

quotaRouter.get(
    '/',
    ValidateRequest(QuotaValidator.getQuotaByUserIdRequestSchema),
    wrapController(QuotaController.getQuotaByUserId),
);

export default quotaRouter;
