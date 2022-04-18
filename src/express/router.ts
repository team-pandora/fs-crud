import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import apiRouter from './api/router';
import { ServerError } from './error';

const appRouter = Router();

appRouter.use('/api', apiRouter);

appRouter.use('/isAlive', (_req, res) => {
    res.status(StatusCodes.OK).send('alive');
});

appRouter.use('*', (_req, res, next) => {
    if (!res.headersSent) {
        next(new ServerError(StatusCodes.NOT_FOUND, 'Invalid route'));
    }
    next();
});

export default appRouter;
