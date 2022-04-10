import { Request, Response } from 'express';
import * as statesManager from './manager';

const getStateById = async (req: Request, res: Response) => {
    res.json(await statesManager.getStateById(req.params.stateId));
};

const getStates = async (req: Request, res: Response) => {
    res.json(await statesManager.getStates(req.query));
};

const createState = async (req: Request, res: Response) => {
    res.json(await statesManager.createState(req.body));
};

const updateState = async (req: Request, res: Response) => {
    res.json(await statesManager.updateState({ _id: req.params.stateId }, req.body));
};

export { getStateById, getStates, createState, updateState };
