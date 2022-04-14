import * as mongoose from 'mongoose';
import { ClientSession } from 'mongoose';
import { mongoDuplicateKeyError } from './express/errors';

function errorHandler(error: any, _res: any, next: any) {
    if (error.code === 11000) {
        next(mongoDuplicateKeyError(error));
    } else {
        next();
    }
}

const makeTransaction = async <Type>(transaction: (session: ClientSession) => Promise<Type>): Promise<Type> => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const result = await transaction(session);
        await session.commitTransaction();
        return result;
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

export { errorHandler, makeTransaction };
