import * as mongoose from 'mongoose';
import * as request from 'supertest';
import config from '../src/config';
import Server from '../src/express/server';

jest.setTimeout(60000);

const removeFsObjectsCollection = async () =>
    mongoose.connection.collections[config.mongo.fsObjectsCollectionName].deleteMany({});
const removeStateCollection = async () =>
    mongoose.connection.collections[config.mongo.statesCollectionName].deleteMany({});
const removeQuotasCollection = async () =>
    mongoose.connection.collections[config.mongo.quotasCollectionName].deleteMany({});

describe('Clients tests:', () => {
    let app: Express.Application;

    beforeAll(async () => {
        await mongoose.connect(config.mongo.uri);
        await removeFsObjectsCollection();
        await removeStateCollection();
        await removeQuotasCollection();
        app = Server.createExpressApp();
    });

    afterEach(async () => {
        await removeFsObjectsCollection();
        await removeStateCollection();
        await removeQuotasCollection();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    describe('Create file', () => {
        it('should fail to create file', async () => {
            await request(app)
                .post('/api/clients/drive/fs/file')
                .send({
                    parent: '62655a5dd681ae7e5f9eafe0',
                    name: 'file',
                    bucket: '123',
                    size: 123,
                    public: true,
                })
                .expect(400);
        });

        it('should create a file', async () => {
            await request(app)
                .post('/api/clients/drive/fs/file')
                .send({
                    name: 'abc',
                    bucket: '123',
                    size: 123,
                })
                .expect(200);
        });
    });

    describe('Share file', () => {
        it('should fail to share a file', async () => {
            await request(app)
                .post('/api/clients/drive/fs/file/5d7e4d4e4f7c8e8d4f7c8e8d/share')
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'write',
                })
                .expect(404);
        });

        it('should share a file', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/clients/drive/fs/file')
                .send({
                    name: 'file',
                    bucket: '123',
                    size: 123,
                })
                .expect(200);

            await request(app)
                .post(`/api/clients/drive/fs/file/${createdFile._id}/share`)
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'read',
                })
                .expect(200);
        });
    });

    describe('Aggregate fsObjects and states', () => {
        it('should get aggregated State and FsObject with undefined fields', async () => {
            await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file3',
                    bucket: '123',
                    size: 123,
                    client: 'drive',
                })
                .expect(200);

            await request(app)
                .get('/api/clients/drive/fsObjects/states')
                .query({ permission: ['', ''] })
                .expect(400);
        });

        it('should get aggregated FsObject and State with undefined field', async () => {
            await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file12',
                    bucket: '123',
                    size: 123,
                    client: 'drive',
                })
                .expect(200);

            await request(app)
                .get('/api/clients/drive/fsObjects/states')
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
                    bucket: '123',
                    size: 123,
                    client: 'drive',
                })
                .expect(200);

            await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file2',
                    bucket: '123',
                    size: 123,
                    client: 'drive',
                })
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/clients/drive/states/fsObjects')
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
                    bucket: '123',
                    size: 123,
                    client: 'drive',
                })
                .expect(200);

            await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file1',
                    bucket: '123',
                    size: 123,
                    client: 'drive',
                })
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/clients/drive/states/fsObjects')
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
                    bucket: '123',
                    size: 123,
                    client: 'drive',
                })
                .expect(200);

            await request(app)
                .get('/api/clients/drive/fsObjects/states')
                .query({ permission: ['', ''] })
                .expect(400);
        });

        it('should get aggregated State and FsObject by asc sort filter', async () => {
            await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file3',
                    bucket: '123',
                    size: 123,
                    client: 'drive',
                })
                .expect(200);

            await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file2',
                    bucket: '123',
                    size: 123,
                    client: 'drive',
                })
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/clients/drive/fsObjects/states')
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
                    bucket: '123',
                    size: 123,
                    client: 'drive',
                })
                .expect(200);

            await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file2',
                    bucket: '123',
                    size: 123,
                    client: 'drive',
                })
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/clients/drive/fsObjects/states')
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
                    bucket: '123',
                    size: 123,
                    client: 'drive',
                })
                .expect(200);

            await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file2',
                    bucket: '123',
                    size: 123,
                    client: 'drive',
                })
                .expect(200);

            const { body: result } = await request(app)
                .get('/api/clients/drive/fsObjects/states')
                .query({ sortBy: 'name', sortOrder: 'desc', page: 1, pageSize: 2 })
                .expect(200);

            expect(result.length).toBe(2);
        });
    });

    describe('Update file', () => {
        it('should not update a file, file does not exist', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file1',
                    bucket: '123',
                    size: 123,
                    client: 'drive',
                })
                .expect(200);
            expect(createdFile.name).toBe('file1');

            await request(app)
                .patch(`/api/clients/drive/fs/file/62655a5dd681ae7e5f9eafe0`)
                .send({ name: 'file2' })
                .expect(404);
        });

        it('should update a file name', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/users/5d7e4d4e4f7c8e8d4f72sc8e8ss/fs/file')
                .send({
                    parent: null,
                    name: 'file1',
                    bucket: '123',
                    size: 123,
                    client: 'drive',
                })
                .expect(200);

            expect(createdFile.name).toBe('file1');

            const { body: updatedFile } = await request(app)
                .patch(`/api/clients/drive/fs/file/${createdFile.fsObjectId}`)
                .send({ name: 'file2' })
                .expect(200);

            expect(updatedFile.name).toBe('file2');
        });
    });

    describe('Update file permission', () => {
        it('should fail to update file permission, file not found', async () => {
            await request(app)
                .patch('/api/clients/drive/fs/file/628a3c28aecdb93d13956823/permission')
                .send({
                    sharedUserId: '5d7e4d4e4f7c8e8d4f72sc8e8ss',
                    updatePermission: 'read',
                })
                .expect(404);
        });
    });

    describe('Unshare file', () => {
        it('should unshare a file', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/clients/drive/fs/file')
                .send({
                    name: 'file',
                    bucket: '123',
                    size: 123,
                })
                .expect(200);

            const { body: sharedFile } = await request(app)
                .post(`/api/clients/drive/fs/file/${createdFile._id}/share`)
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                    sharedPermission: 'read',
                })
                .expect(200);
            expect(sharedFile);

            await request(app)
                .delete(`/api/clients/drive/fs/file/${createdFile._id}/share`)
                .send({
                    sharedUserId: 'd7e4d4e4f7c8e8d4f7c8e58f',
                })
                .expect(200);
        });
    });

    describe('Delete file', () => {
        it('should delete a file', async () => {
            const { body: createdFile } = await request(app)
                .post('/api/clients/drive/fs/file')
                .send({
                    name: 'file',
                    bucket: '123',
                    size: 123,
                })
                .expect(200);

            await request(app).delete(`/api/clients/drive/fs/file/${createdFile._id}`).expect(200);
        });

        it('should fail deleting a file', async () => {
            await request(app).delete('/api/clients/drive/fs/file/5d7e4d4e4f7c8e8d4f72sa').expect(400);
        });
    });
});
