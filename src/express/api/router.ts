import { Router } from 'express';
import clientsRouter from './clients/router';
import usersRouter from './users/router';

const apiRouter: Router = Router();

apiRouter.use('/users', usersRouter);

apiRouter.use('/clients', clientsRouter);

export default apiRouter;
