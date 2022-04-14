import { StatusCodes } from 'http-status-codes';
import * as mongoose from 'mongoose';
import { ClientSession } from 'mongoose';
import { defaultNewState } from '../../config/defaults';
import { ServerError } from '../error';
import { IGetStatesQuery, INewState, IState, IUpdateState } from './interface';
import StateModel from './model';

const getStateById = async (stateId: string): Promise<IState> => {
    const result = await StateModel.findById(stateId).exec();

    if (result === null) throw new ServerError(404, 'State not found.');

    return result;
};

const getStates = (query: IGetStatesQuery): Promise<IState[]> => {
    return StateModel.find(query).exec();
};

/**
 * Create new State document.
 * @param {INewState} state - The new State object.
 * @param {ClientSession | undefined} session - Optional mongoose session.
 * @returns {Promise<IState>} - Promise object containing the created State.
 */
const createState = async (state: INewState, session?: ClientSession): Promise<IState> => {
    return (await StateModel.create([{ ...defaultNewState, ...state }], { session }))[0];
};

const updateState = async (filters: any, update: IUpdateState, session?: ClientSession): Promise<IState> => {
    const result = await StateModel.findOneAndUpdate(filters, { $set: update }, { new: true, session }).exec();
    if (result === null) throw new ServerError(StatusCodes.NOT_FOUND, 'State not found.');
    return result;
};

const moveToTrash = async (userId: string, fileId: mongoose.Types.ObjectId, session?: ClientSession): Promise<void> => {
    const result = await StateModel.findOneAndUpdate(
        { userId, fsObjectId: fileId },
        { $set: { trash: true } },
        { new: true, session },
    ).exec();
    if (result === null) throw new ServerError(StatusCodes.NOT_FOUND, 'State not found.');
};

const deleteState = async (
    userId: string,
    fileId: mongoose.Types.ObjectId,
    session?: ClientSession,
): Promise<IState> => {
    const result = await StateModel.findOneAndDelete({ userId, fsObjectId: fileId }, { session }).exec();
    if (result === null) throw new ServerError(StatusCodes.NOT_FOUND, 'State not found.');
    return result;
};

const deleteStates = async (
    fileId: mongoose.Types.ObjectId,
    permission: string,
    session?: ClientSession,
): Promise<void> => {
    const states = await StateModel.find({ fsObjectId: fileId }).exec();
    const statesToDelete = states.filter((state) => state.permission !== permission);

    await StateModel.deleteMany({ _id: { $in: statesToDelete.map((state) => state._id) } }, { session });
};

export { getStateById, getStates, createState, updateState, deleteState, deleteStates, moveToTrash };
