import { StatusCodes } from 'http-status-codes';
import { ServerError } from '../error';

export const mongoDuplicateKeyError = (error: any) =>
    new ServerError(
        StatusCodes.BAD_REQUEST,
        `Duplicate key error: quota with ${JSON.stringify(error.keyValue)} already exists`,
        error,
    );

export default { mongoDuplicateKeyError };
