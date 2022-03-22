import { IResponseFsObject } from './interface';

const getFsObjectsByUserId = async (userId: string): Promise<Array<IResponseFsObject[]>> => {
    const files = await .find({ userId });
    return files;
};

export default { getFsObjectsByUserId };
