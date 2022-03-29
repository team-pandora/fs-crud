import { Request, Response } from 'express';
import { INewState, IStateFilters } from './interface';
import * as stateManager from './manager';

const createState = async (req: Request, res: Response) => {
    res.json(await stateManager.createState(req.body as INewState));
};

const getStates = async (req: Request, res: Response) => {
    res.json(await stateManager.getStates(req.query as IStateFilters));
};

const updateState = async (req: Request, res: Response) => {
    res.json(await stateManager.updateState(req.params.id, req.body));
};

export { createState, getStates, updateState };
