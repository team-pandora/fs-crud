import * as mongoose from 'mongoose';
import * as request from 'supertest';
import config from '../src/config';
import Server from '../src/express/server';

jest.setTimeout(30000);

const removeFsObjectsCollection = async () =>
    mongoose.connection.collections[config.mongo.fsObjectsCollectionName].deleteMany({});

describe('fsObjects tests', () => {
    let app: Express.Application;

    beforeAll(async () => {
        await mongoose.connect(config.mongo.uri);
        await removeFsObjectsCollection();
        app = Server.createExpressApp();
    });

    afterEach(async () => {
        await removeFsObjectsCollection();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    describe('/api/fs/file', () => {
        describe('POST', () => {
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

            describe('/api/fs/folder', () => {
                describe('POST', () => {
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
            });

            describe('/api/fs/shortcut', () => {
                describe('POST', () => {
                    it('should fail to create a shortcut', async () => {
                        await request(app).post('/api/fs/shortcut').send({}).expect(400);
                    });

                    it('should create a shortcut', async () => {
                        const createdFile = await request(app)
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
                                ref: createdFile.body._id,
                            })
                            .expect(200);
                    });
                });
            });
        });
    });
});
