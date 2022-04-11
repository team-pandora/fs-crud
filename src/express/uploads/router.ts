import { Router } from 'express';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import * as uploadController from './controller';
import * as uploadValidator from './validator.schema';

const uploadRouter: Router = Router();

uploadRouter.post(
    '/',
    ValidateRequest(uploadValidator.createUploadRequestSchema),
    wrapController(uploadController.createUpload),
);

uploadRouter.get(
    '/',
    ValidateRequest(uploadValidator.getUploadsRequestSchema),
    wrapController(uploadController.getUploads),
);

uploadRouter.patch(
    '/:id',
    ValidateRequest(uploadValidator.updateUploadRequestSchema),
    wrapController(uploadController.updateUpload),
);

uploadRouter.delete(
    '/:id',
    ValidateRequest(uploadValidator.deleteUploadRequestSchema),
    wrapController(uploadController.deleteUpload),
);

export default uploadRouter;
