import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import actionsRouter from './actions/router';
import { ServerError } from './error';
import fsRouter from './fs/router';
import quotasRouter from './quotas/router';
import statesRouter from './states/router';

const appRouter = Router();

appRouter.use('/api/quotas', quotasRouter);
appRouter.use('/api/states', statesRouter);
appRouter.use('/api/fs', fsRouter);
appRouter.use('/api/actions', actionsRouter);

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
