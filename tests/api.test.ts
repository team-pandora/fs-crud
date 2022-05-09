import * as mongoose from 'mongoose';
import * as request from 'supertest';
import config from '../src/config';
import Server from '../src/express/server';

jest.setTimeout(60000);

const removeFsObjectsCollection = async () =>
    mongoose.connection.collections[config.mongo.fsObjectsCollectionName].deleteMany({});
const removeStateCollection = async () =>
    mongoose.connection.collections[config.mongo.statesCollectionName].deleteMany({});
const removeUploadCollection = async () =>
    mongoose.connection.collections[config.mongo.uploadsCollectionName].deleteMany({});

describe('Api Tests:', () => {
    let app: Express.Application;

    beforeAll(async () => {
        await mongoose.connect(config.mongo.uri);
        await removeFsObjectsCollection();
        await removeStateCollection();
        await removeUploadCollection();
        app = Server.createExpressApp();
    });

    afterEach(async () => {
        await removeFsObjectsCollection();
        await removeStateCollection();
        await removeUploadCollection();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    describe('Create file', () => {
        it('should fail to create file', async () => {
            await request(app)
                .post('/api/fs/file')
                .send({
                    userId: 'abc',
                    fsObjectId: 'abc',
                    name: 'abc',
                    type: 'abc',
                    size: 123,
                    parent: 'abc',
                    permission: 123,
                })
                .expect(400);
        });

        it('should create a file', async () => {
            await request(app)
                .post('/api/fs/file')
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
            await request(app).post('/api/fs/folder').send({}).expect(400);
        });

        it('should create a folder', async () => {
            await request(app)
                .post('/api/fs/folder')
                .send({
                    parent: null,
                    name: 'abc',
                })
                .expect(200);
        });
    });

    describe('Create shortcut', () => {
        it('should fail to create a shortcut', async () => {
            await request(app).post('/api/fs/shortcut').send({}).expect(400);
        });

        it('should create a shortcut', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/fs/file')
                .send({
                    parent: null,
                    name: 'abc',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            await request(app)
                .post('/api/fs/shortcut')
                .send({
                    parent: null,
                    name: 'abc',
                    ref: createdFile._id,
                })
                .expect(200);
        });
    });

    describe('Share fsObject', () => {
        it('should fail to share a FsObject', async () => {
            await request(app)
                .post('/api/fs/5d7e4d4e4f7c8e8d4f7c8e8d/share')
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'write',
                })
                .expect(404);
        });

        it('should share a FsObject', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/fs/file')
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
                .post(`/api/fs/${createdFile._id}/share`)
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'read',
                })
                .expect(200);
        });
    });

    describe('Aggregate fsObjects and states', () => {
        it('should get aggregated FsObject and State', async () => {
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

            const { body: result } = await request(app)
                .get('/api/states/fsObjects')
                .query({
                    name: 'file12',
                })
                .expect(200);

            expect(result.length).toBe(1);
        });
    });

    describe('Aggregate states and fsObjects', () => {
        it('should get aggregated State and FsObject', async () => {
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

            const { body: result } = await request(app).get('/api/states/fsObjects').query({ root: true }).expect(200);
            expect(result.length).toBe(1);
        });
    });

    describe('Get fsObject hierarchy', () => {
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

            const { body: result } = await request(app).get(`/api/fs/${file.fsObjectId}/hierarchy`).expect(200);
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

            const { body: hierarchy } = await request(app).get(`/api/fs/${file.fsObjectId}/hierarchy`).expect(200);
            expect(hierarchy.length).toBe(0);
        });
    });

    describe('Update state', () => {
        it('should update a state', async () => {
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

            expect(createdFile.favorite).toBe(false);

            await request(app).patch(`/api/states/${createdFile.stateId}`).send({ favorite: true }).expect(200);

            const { body: result } = await request(app)
                .get('/api/states/fsObjects')
                .query({
                    name: 'file1',
                })
                .expect(200);
            expect(result[0].favorite).toBe(true);
        });
    });

    describe('Update file', () => {
        it('should update a file', async () => {
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

            await request(app).patch(`/api/fs/file/${createdFile.fsObjectId}`).send({ name: 'file2' }).expect(200);

            const { body: result } = await request(app)
                .get('/api/states/fsObjects')
                .query({
                    fsObjectId: createdFile.fsObjectId,
                })
                .expect(200);
            expect(result[0].name).toBe('file2');
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

            await request(app)
                .patch(`/api/fs/folder/${createdFolder.fsObjectId}`)
                .send({ name: 'folder2' })
                .expect(200);

            await request(app)
                .get('/api/states/fsObjects')
                .query({
                    name: createdFolder.name,
                })
                .expect(200);
        });
    });

    describe('Update shortcut', () => {
        it('should update a shortcut', async () => {
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

            const { body: createdShortcut } = await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/shortcut')
                .send({
                    parent: null,
                    name: 'shortcut1',
                    ref: createdFile.fsObjectId,
                })
                .expect(200);

            expect(createdShortcut.name).toBe('shortcut1');

            await request(app)
                .patch(`/api/fs/shortcut/${createdShortcut.fsObjectId}`)
                .send({ name: 'shortcut2' })
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/states/fsObjects')
                .query({
                    type: 'shortcut',
                })
                .expect(200);

            expect(result[0].name).toBe('shortcut2');
        });
    });

    describe('Unshare fsObject', () => {
        it('should unshare a fsObject', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/fs/file')
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
                .post(`/api/fs/${createdFile._id}/share`)
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'read',
                })
                .expect(200);
            expect(sharedFile);

            await request(app)
                .delete(`/api/fs/${createdFile._id}/share`)
                .send({
                    userId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                })
                .expect(200);
        });
    });

    describe('Delete file', () => {
        it('should delete a file', async () => {
            const { body: file } = await request(app)
                .post('/api/fs/file')
                .send({
                    parent: null,
                    name: 'file',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            await request(app).delete(`/api/fs/${file._id}/file`).expect(200);
        });
        it('should fail deleting a file', async () => {
            await request(app).delete('/api/fs/5d7e4d4e4f7c8e8d4f72sa/file').expect(400);
        });
    });

    describe('Delete folder', () => {
        it('should delete a folder', async () => {
            const { body: createdFolder } = await request(app)
                .post('/api/fs/folder')
                .send({
                    parent: null,
                    name: 'folder',
                })
                .expect(200);
            await request(app).delete(`/api/fs/${createdFolder._id}/folder`).expect(200);
        });
        it('should fail deleting a folder', async () => {
            await request(app).delete('/api/fs/5d7e4d4e4f7c8e8d4f72sb/folder').expect(400);
        });
    });

    describe('Delete shortcut', () => {
        it('should delete a shortcut', async () => {
            const { body: file } = await request(app)
                .post('/api/fs/file')
                .send({
                    parent: null,
                    name: 'file',
                    key: '123',
                    bucket: '123',
                    size: 123,
                    source: 'drive',
                })
                .expect(200);

            const { body: shortcut } = await request(app)
                .post('/api/fs/shortcut')
                .send({
                    parent: null,
                    name: 'shortcut',
                    ref: file._id,
                })
                .expect(200);

            await request(app).delete(`/api/fs/${shortcut._id}/shortcut`).expect(200);
        });

        it('should fail deleting a shortcut', async () => {
            await request(app).delete('/api/fs/5d7e4d4e4f7c8e8d4f72sd/shortcut').expect(400);
        });
    });
});
