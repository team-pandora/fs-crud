import { Router } from 'express';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import * as QuotasController from './controller';
import * as QuotasValidator from './validator.schema';

const quotasRouter: Router = Router();

quotasRouter.post(
    '/',
    ValidateRequest(QuotasValidator.createQuotaRequestSchema),
    wrapController(QuotasController.createQuota),
);

quotasRouter.get(
    '/:userId',
    ValidateRequest(QuotasValidator.getQuotaByUserIdRequestSchema),
    wrapController(QuotasController.getQuotaByUserId),
);

quotasRouter.patch(
    '/:userId/limit',
    ValidateRequest(QuotasValidator.updateQuotaLimitRequestSchema),
    wrapController(QuotasController.updateQuotaLimit),
);

quotasRouter.patch(
    '/:userId/used',
    ValidateRequest(QuotasValidator.changeQuotaUsedRequestSchema),
    wrapController(QuotasController.changeQuotaUsed),
);

export default quotasRouter;
