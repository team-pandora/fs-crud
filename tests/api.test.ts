import * as mongoose from 'mongoose';
import * as request from 'supertest';
import config from '../src/config';
import Server from '../src/express/server';

jest.setTimeout(60000);

const removeFsObjectsCollection = async () =>
    mongoose.connection.collections[config.mongo.fsObjectsCollectionName].deleteMany({});
const removeStateCollection = async () =>
    mongoose.connection.collections[config.mongo.statesCollectionName].deleteMany({});

describe('Api tests:', () => {
    let app: Express.Application;

    beforeAll(async () => {
        await mongoose.connect(config.mongo.uri);
        await removeFsObjectsCollection();
        await removeStateCollection();
        app = Server.createExpressApp();
    });

    afterEach(async () => {
        await removeFsObjectsCollection();
        await removeStateCollection();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    describe('Create file', () => {
        it('should fail to create file', async () => {
            await request(app)
                .post('/api/clients/fs/file')
                .send({
                    parent: '62655a5dd681ae7e5f9eafe0',
                    name: 'file',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    public: true,
                    source: 'drive',
                })
                .expect(400);
        });

        it('should fail to create file with same name', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/clients/fs/folder')
                .send({
                    parent: null,
                    name: 'folder',
                })
                .expect(200);

            await request(app)
                .post('/api/clients/fs/file')
                .send({
                    parent: createdFolder._id,
                    name: 'file1',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            await request(app)
                .post('/api/clients/fs/file')
                .send({
                    parent: createdFolder._id,
                    name: 'file1',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(409);
        });

        it('should create a file', async () => {
            await request(app)
                .post('/api/clients/fs/file')
                .send({
                    parent: null,
                    name: 'abc',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);
        });
    });

    describe('Create folder', () => {
        it('should fail to create a folder', async () => {
            await request(app).post('/api/clients/fs/folder').send({}).expect(400);
        });

        it('should create a folder', async () => {
            await request(app)
                .post('/api/clients/fs/folder')
                .send({
                    parent: null,
                    name: 'abc',
                })
                .expect(200);
        });
    });

    describe('Share fsObject', () => {
        it('should fail to share a FsObject', async () => {
            await request(app)
                .post('/api/clients/fs/5d7e4d4e4f7c8e8d4f7c8e8d/share')
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'write',
                })
                .expect(404);
        });

        it('should share a FsObject', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/clients/fs/file')
                .send({
                    parent: null,
                    name: 'file',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            await request(app)
                .post(`/api/clients/fs/${createdFile._id}/share`)
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'read',
                })
                .expect(200);
        });
    });

    describe('Add fsObject to favorite', () => {
        it('should fail to add fsObject to favorite, fs not found', async () => {
            await request(app).post('/api/clients/fs/5d7e4d4e4f7c8e8d4f7c8e8d/favorite').expect(404);
        });

        it('should add fsObject to favorite', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/clients/fs/file')
                .send({
                    parent: null,
                    name: 'file',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            const { body: sharedFile } = await request(app)
                .post(`/api/clients/fs/${createdFile._id}/share`)
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'read',
                })
                .expect(200);

            await request(app).post(`/api/clients/fs/${sharedFile.fsObjectId}/favorite`).expect(200);

            const { body: result } = await request(app).get('/api/clients/states/fsObjects').expect(200);

            expect(result[0].favorite).toBe(true);
        });
    });

    describe('Aggregate fsObjects and states', () => {
        it('should get aggregated State and FsObject with undefined fields', async () => {
            await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file3',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            await request(app)
                .get('/api/clients/fsObjects/states')
                .query({ permission: ['', ''] })
                .expect(400);
        });

        it('should get aggregated FsObject and State with undefined field', async () => {
            await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file12',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            await request(app)
                .get('/api/clients/fsObjects/states')
                .query({
                    permission: '',
                })
                .expect(400);
        });

        it('should get aggregated FsObject and State by sort filters', async () => {
            await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file1',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file2',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/clients/states/fsObjects')
                .query({ sortBy: 'name', sortOrder: 'asc' })
                .expect(200);

            expect(result.length).toBe(2);
        });

        it('should get aggregated FsObject and State by page filters', async () => {
            await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file2',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file1',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/clients/states/fsObjects')
                .query({ sortBy: 'name', sortOrder: 'asc', page: 1, pageSize: 2 })
                .expect(200);

            expect(result.length).toBe(2);
        });
    });

    describe('Aggregate states and fsObjects', () => {
        it('should get aggregated State and FsObject with undefined fields', async () => {
            await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file3',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            await request(app)
                .get('/api/clients/fsObjects/states')
                .query({ permission: ['', ''] })
                .expect(400);
        });

        it('should get aggregated State and FsObject by asc sort filter', async () => {
            await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file3',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file2',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/clients/fsObjects/states')
                .query({ sortBy: 'name', sortOrder: 'asc' })
                .expect(200);

            expect(result.length).toBe(2);
        });

        it('should get aggregated State and FsObject by desc sort filter', async () => {
            await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file3',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file2',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/clients/fsObjects/states')
                .query({ sortBy: 'name', sortOrder: 'desc' })
                .expect(200);

            expect(result.length).toBe(2);
        });

        it('should get aggregated State and FsObject by page filters', async () => {
            await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file3',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file2',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/clients/fsObjects/states')
                .query({ sortBy: 'name', sortOrder: 'desc', page: 1, pageSize: 2 })
                .expect(200);

            expect(result.length).toBe(2);
        });
    });

    describe('Get fsObject hierarchy', () => {
        it('should not get file hierarchy', async () => {
            await request(app).get('/api/clients/fs/626f8e514560b39744dcd2bb/hierarchy').expect(404);
        });

        it('should get file hierarchy', async () => {
            const { body: folder1 } = await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/folder')
                .send({
                    parent: null,
                    name: 'folder1',
                })
                .expect(200);

            const { body: folder2 } = await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/folder')
                .send({
                    parent: folder1.fsObjectId,
                    name: 'folder2',
                })
                .expect(200);

            const { body: file } = await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: folder2.fsObjectId,
                    name: 'file1',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            const { body: result } = await request(app).get(`/api/clients/fs/${file.fsObjectId}/hierarchy`).expect(200);
            expect(result.length).toBe(2);
        });

        it('should not get file hierarchy', async () => {
            const { body: file } = await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file1',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            const { body: hierarchy } = await request(app)
                .get(`/api/clients/fs/${file.fsObjectId}/hierarchy`)
                .expect(200);
            expect(hierarchy.length).toBe(0);
        });
    });

    describe('Update file', () => {
        it('should not update a file, file does not exist', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file1',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);
            expect(createdFile.name).toBe('file1');

            await request(app)
                .patch(`/api/clients/fs/file/62655a5dd681ae7e5f9eafe0`)
                .send({ name: 'file2' })
                .expect(404);
        });

        it('should update a file name', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file1',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            expect(createdFile.name).toBe('file1');

            const { body: updatedFile } = await request(app)
                .patch(`/api/clients/fs/file/${createdFile.fsObjectId}`)
                .send({ name: 'file2' })
                .expect(200);

            expect(updatedFile.name).toBe('file2');
        });

        it('should update a file parent', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/clients/fs/file')
                .send({
                    parent: null,
                    name: 'file1',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            expect(createdFile.name).toBe('file1');

            const { body: createdFolder } = await request(app)
                .post('/api/clients/fs/folder')
                .send({
                    parent: null,
                    name: 'folder',
                })
                .expect(200);

            const { body: updatedFile } = await request(app)
                .patch(`/api/clients/fs/file/${createdFile._id}`)
                .send({ parent: createdFolder._id })
                .expect(200);

            expect(updatedFile.parent).toBe(createdFolder._id);
        });
    });

    describe('Update folder', () => {
        it('should update a folder', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/folder')
                .send({
                    parent: null,
                    name: 'folder1',
                })
                .expect(200);
            expect(createdFolder.name).toBe('folder1');

            const { body: updatedFolder } = await request(app)
                .patch(`/api/clients/fs/folder/${createdFolder.fsObjectId}`)
                .send({ name: 'folder2' })
                .expect(200);

            expect(updatedFolder.name).toBe('folder2');
        });
    });

    describe('create a file inside shared folder', () => {
        it('should fail to create a new file inside shared folder because has a low permission', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/clients/fs/folder')
                .send({
                    parent: null,
                    name: 'folder',
                })
                .expect(200);

            await request(app)
                .post(`/api/clients/fs/${createdFolder._id}/share`)
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'read',
                })
                .expect(200);

            await request(app)
                .post('/api/users/d7e4d4e4f7c8e8d4f7c8e58f/fs/file')
                .send({
                    parent: createdFolder._id,
                    name: 'file',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(403);
        });

        it('should create a new file inside shared folder', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/clients/fs/folder')
                .send({
                    parent: null,
                    name: 'folder',
                })
                .expect(200);

            await request(app)
                .post(`/api/clients/fs/${createdFolder._id}/share`)
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'write',
                })
                .expect(200);

            const { body: createdFile } = await request(app)
                .post('/api/clients/fs/file')
                .send({
                    parent: createdFolder._id,
                    name: 'file',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            const { body: userState } = await request(app)
                .get(`/api/users/d7e4d4e4f7c8e8d4f7c8e58f/fs/state`)
                .query({ fsObjectId: createdFile._id });
            if (!userState) throw new Error('User state not found');
        });
    });

    describe('create a folder inside a folder', () => {
        it('should create a new folder inside a folder', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/clients/fs/folder')
                .send({
                    parent: null,
                    name: 'folder',
                })
                .expect(200);

            const { body: createdFolder2 } = await request(app)
                .post('/api/clients/fs/folder')
                .send({
                    parent: createdFolder._id,
                    name: 'folder2',
                })
                .expect(200);

            const { body: userState } = await request(app)
                .get(`/api/users/d7e4d4e4f7c8e8d4f7c8e58f/fs/state`)
                .query({ fsObjectId: createdFolder2._id });
            if (!userState) throw new Error('User state not found');
        });
    });

    describe('Unshare fsObject', () => {
        it('should unshare a file', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/clients/fs/file')
                .send({
                    parent: null,
                    name: 'file',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            const { body: sharedFile } = await request(app)
                .post(`/api/clients/fs/${createdFile._id}/share`)
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'read',
                })
                .expect(200);
            expect(sharedFile);

            await request(app)
                .delete(`/api/clients/fs/${createdFile._id}/share`)
                .send({
                    userId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                })
                .expect(200);
        });

        it('should unshare a folder', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/clients/fs/folder')
                .send({
                    parent: null,
                    name: 'folder',
                })
                .expect(200);

            const { body: sharedFile } = await request(app)
                .post(`/api/clients/fs/${createdFolder._id}/share`)
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'read',
                })
                .expect(200);
            expect(sharedFile);

            await request(app)
                .delete(`/api/clients/fs/${createdFolder._id}/share`)
                .send({
                    userId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                })
                .expect(200);
        });
    });

    describe('Remove fs from favorite', () => {
        it('should fail to remove fs from favorite, fs not found', async () => {
            await request(app).delete(`/api/clients/fs/d7e4d4e4f7c8e8d4f7c8e58f/favorite`).expect(404);
        });

        it('should remove fs from favorite', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/clients/fs/file')
                .send({
                    parent: null,
                    name: 'file',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            const { body: sharedFile } = await request(app)
                .post(`/api/clients/fs/${createdFile._id}/share`)
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'read',
                })
                .expect(200);

            await request(app).post(`/api/clients/fs/${sharedFile.fsObjectId}/favorite`).expect(200);

            const { body: result } = await request(app).get('/api/clients/states/fsObjects').expect(200);
            expect(result[0].favorite).toBe(true);

            await request(app).delete(`/api/clients/fs/${sharedFile.fsObjectId}/favorite`).expect(200);

            const { body: res } = await request(app).get('/api/clients/states/fsObjects').expect(200);
            expect(res[0].favorite).toBe(false);
        });
    });

    describe('Delete file', () => {
        it('should delete a file', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/clients/fs/file')
                .send({
                    parent: null,
                    name: 'file',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            await request(app).delete(`/api/clients/fs/${createdFile._id}/file`).expect(200);
        });

        it('should fail deleting a file', async () => {
            await request(app).delete('/api/clients/fs/5d7e4d4e4f7c8e8d4f72sa/file').expect(400);
        });
    });

    describe('Delete folder', () => {
        it('should delete a folder', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/clients/fs/folder')
                .send({
                    parent: null,
                    name: 'folder',
                })
                .expect(200);
            await request(app).delete(`/api/clients/fs/${createdFolder._id}/folder`).expect(200);
        });

        it('should not delete a folder, folder does not exist', async () => {
            await request(app).delete(`/api/clients/fs/62655a5dd681ae7e5f9eafe0/folder`).expect(404);
        });
    });
});
