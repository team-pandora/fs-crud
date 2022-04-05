import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ServerError } from '../../express/error';
import logger from '../logger';
import { getPreciseTime, prettyDuration } from '../time';

const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const { statusCode } = res;

    const meta = {
        express: true,
        method: req.method,
        url: req.originalUrl,
        status: statusCode,
        duration: prettyDuration(getPreciseTime() - res.locals.startTime),
    };

    const error: ServerError = (res.locals.error as ServerError) ? res.locals.error : null;

    switch (true) {
        case statusCode >= StatusCodes.INTERNAL_SERVER_ERROR:
            logger.log(
                'error',
                `Internal error: ${error.message}, \nStack:\n${error.stack}\n${
                    error?.originalError ? `Original error: ${error.originalError}` : ''
                }`,
                meta,
            );
            break;

        case statusCode < StatusCodes.INTERNAL_SERVER_ERROR && statusCode >= StatusCodes.BAD_REQUEST:
            logger.log('warn', `Request error: ${error.message}`, meta);
            break;

        default:
            logger.log('info', `Successful request`, meta);
            break;
    }

    next();
};

const setStartTime = (_req: Request, res: Response, next: NextFunction) => {
    res.locals.startTime = getPreciseTime();
    next();
};

export { loggerMiddleware, setStartTime };
