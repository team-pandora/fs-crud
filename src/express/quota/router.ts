import { Router } from 'express';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import * as QuotaController from './controller';
import * as QuotaValidator from './validator.schema';

const quotaRouter: Router = Router();

quotaRouter.post(
    '/',
    ValidateRequest(QuotaValidator.createQuotaRequestSchema),
    wrapController(QuotaController.createQuota),
);

quotaRouter.get(
    '/:userId',
    ValidateRequest(QuotaValidator.getQuotaByUserIdRequestSchema),
    wrapController(QuotaController.getQuotaByUserId),
);
quotaRouter.patch(
    '/:userId',
    ValidateRequest(QuotaValidator.updateQuotaRequestSchema),
    wrapController(QuotaController.updateQuotaLimit),
);

export default quotaRouter;
