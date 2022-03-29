import { defaultNewFile, defaultNewFolder, defaultNewShortcut } from '../../config/defaults';
import { ServerError } from '../error';
import { IFile, IFolder, INewFile, INewFolder, INewShortcut, IShortcut } from './interface';
import { FileModel, FolderModel, ShortcutModel } from './model';

const createFile = (file: INewFile): Promise<IFile> => {
    const newFile: INewFile = { ...defaultNewFile, ...file };
    return FileModel.create(newFile);
};

const createFolder = (folder: INewFolder): Promise<IFolder> => {
    const newFolder: INewFolder = { ...defaultNewFolder, ...folder };
    return FolderModel.create(newFolder);
};

const createShortcut = (shortcut: INewShortcut): Promise<IShortcut> => {
    const newShortcut: INewShortcut = { ...defaultNewShortcut, ...shortcut };
    return ShortcutModel.create(newShortcut);
};

const getObject = async (id: string): Promise<IFile | IFolder | IShortcut> => {
    const result = await FileModel.findById(id).exec();
    if (result === null) {
        throw new ServerError(404, 'File not found');
    }
    return result as IFile | IFolder | IShortcut;
};

export { createFile, createFolder, createShortcut, getObject };
