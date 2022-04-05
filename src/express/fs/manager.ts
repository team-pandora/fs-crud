import { StatusCodes } from 'http-status-codes';
import * as mongoose from 'mongoose';
import { ClientSession } from 'mongoose';
import { defaultNewFile, defaultNewFolder, defaultNewShortcut } from '../../config/defaults';
import { ServerError } from '../error';
import { IFile, IFolder, INewFile, INewFolder, INewShortcut, IShortcut, IUpdateShortcut } from './interface';
import { FileModel, FolderModel, FsObjectModel, ShortcutModel } from './model';

const getFsObject = async (id: mongoose.Types.ObjectId): Promise<IFile | IFolder | IShortcut> => {
    const result = await FileModel.findById(id).exec();

    if (result === null) throw new ServerError(404, 'Object not found.');

    return result;
};

const createFile = async (file: INewFile, session?: ClientSession): Promise<IFile> => {
    if (file.parent) {
        if (!(await FolderModel.exists({ _id: file.parent })))
            throw new ServerError(StatusCodes.BAD_REQUEST, 'Provided parent does not exist.');
        if (await FsObjectModel.exists({ parent: file.parent, name: file.name, source: file.source }))
            throw new ServerError(StatusCodes.CONFLICT, 'Object with this name already exists in folder.');
    }

    const newFile: INewFile = { ...defaultNewFile, ...file };
    return (await FileModel.create([newFile], { session }))[0];
};

const createFolder = async (folder: INewFolder, session?: ClientSession): Promise<IFolder> => {
    if (folder.parent) {
        if (!(await FolderModel.exists({ _id: folder.parent })))
            throw new ServerError(StatusCodes.BAD_REQUEST, 'Provided parent does not exist.');
        if (await FsObjectModel.exists({ parent: folder.parent, name: folder.name }))
            throw new ServerError(StatusCodes.CONFLICT, 'Object with this name already exists in folder.');
    }

    const newFolder: INewFolder = { ...defaultNewFolder, ...folder };
    return (await FolderModel.create([newFolder], { session }))[0];
};

const createShortcut = async (shortcut: INewShortcut, session?: ClientSession): Promise<IShortcut> => {
    if (shortcut.parent) {
        if (!(await FolderModel.exists({ _id: shortcut.parent })))
            throw new ServerError(StatusCodes.BAD_REQUEST, 'Provided parent does not exist.');
        if (await FsObjectModel.exists({ parent: shortcut.parent, name: shortcut.name }))
            throw new ServerError(StatusCodes.CONFLICT, 'Object with this name already exists in folder.');
    }
    if (!(await FsObjectModel.exists({ _id: shortcut.ref, type: { $ne: 'shortcut' } })))
        throw new ServerError(StatusCodes.BAD_REQUEST, 'Provided ref does not exist.');

    const newShortcut: INewShortcut = { ...defaultNewShortcut, ...shortcut };
    return (await ShortcutModel.create([newShortcut], { session }))[0];
};

const updateShortcut = async (
    id: mongoose.Types.ObjectId,
    shortcut: IUpdateShortcut,
    session?: ClientSession,
): Promise<IShortcut> => {
    const updatedShortcut = await ShortcutModel.findByIdAndUpdate(id, shortcut, { session, new: true }).exec();
    if (updatedShortcut === null) throw new ServerError(StatusCodes.NOT_FOUND, 'Shortcut not found.');
    return updatedShortcut;
};

export { createFile, createFolder, createShortcut, getFsObject, updateShortcut };
