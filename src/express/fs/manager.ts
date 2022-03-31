import { ClientSession } from 'mongoose';
import { defaultNewFile, defaultNewFolder, defaultNewShortcut } from '../../config/defaults';
import { ServerError } from '../error';
import { IFile, IFolder, INewFile, INewFolder, INewShortcut, IShortcut } from './interface';
import { FileModel, FolderModel, ShortcutModel } from './model';

const createFile = async (file: INewFile, session?: ClientSession): Promise<IFile> => {
    if (file.parent && !(await FolderModel.exists({ _id: file.parent })))
        throw new ServerError(404, 'Parent not found');
    if (await FileModel.exists({ parent: file.parent, name: file.name }))
        throw new ServerError(409, 'Object with this name already exists in folder');

    const newFile: INewFile = { ...defaultNewFile, ...file };
    return (await FileModel.create([newFile], { session }))[0];
};

const createFolder = async (folder: INewFolder, session?: ClientSession): Promise<IFolder> => {
    if (folder.parent && !(await FolderModel.exists({ _id: folder.parent })))
        throw new ServerError(404, 'Parent not found');
    if (await FolderModel.exists({ parent: folder.parent, name: folder.name }))
        throw new ServerError(409, 'Object with this name already exists in folder');

    const newFolder: INewFolder = { ...defaultNewFolder, ...folder };
    return (await FolderModel.create([newFolder], { session }))[0];
};

const createShortcut = async (shortcut: INewShortcut, session?: ClientSession): Promise<IShortcut> => {
    if (shortcut.parent && !(await FolderModel.exists({ _id: shortcut.parent })))
        throw new ServerError(404, 'Parent not found');
    if (await ShortcutModel.exists({ parent: shortcut.parent, name: shortcut.name }))
        throw new ServerError(409, 'Object with this name already exists in folder');

    const newShortcut: INewShortcut = { ...defaultNewShortcut, ...shortcut };
    return (await ShortcutModel.create([newShortcut], { session }))[0];
};

const getObject = async (id: string): Promise<IFile | IFolder | IShortcut> => {
    const result = await FileModel.findById(id).exec();
    if (result === null) {
        throw new ServerError(404, 'File not found');
    }
    return result as IFile | IFolder | IShortcut;
};

export { createFile, createFolder, createShortcut, getObject };
