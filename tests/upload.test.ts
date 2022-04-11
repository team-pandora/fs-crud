import * as mongoose from 'mongoose';
import * as request from 'supertest';
import config from '../src/config';
import Server from '../src/express/server';

jest.setTimeout(30000);

const removeUploadCollection = async () =>
    mongoose.connection.collections[config.mongo.uploadsCollectionName].deleteMany({});

describe('upload tests', () => {
    let app: Express.Application;

    beforeAll(async () => {
        await mongoose.connect(config.mongo.uri);
        await removeUploadCollection();
        app = Server.createExpressApp();
    });

    afterEach(async () => {
        await removeUploadCollection();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    describe('/api/uploads', () => {
        const upload1 = {
            name: 'upload1',
            parent: '5d7e4d4e4f7c8e8d4f7c8e8d',
            uploadedBytes: 123,
            key: 'ab',
            bucket: 'ab',
            size: 123,
            source: 'drive',
        };

        const upload2 = {
            name: 'upload2',
            parent: '5d7e4d4e4f7c8e8d4f7c8e8d',
            uploadedBytes: 321,
            key: 'abcd',
            bucket: 'abcd',
            size: 123,
            source: 'dropbox',
        };

        describe('POST', () => {
            it('should create new upload', () => {
                return request(app)
                    .post('/api/uploads')
                    .send({
                        name: 'upload',
                        parent: '5d7e4d4e4f7c8e8d4f7c8e8d',
                        uploadedBytes: 123,
                        key: 'abcd',
                        bucket: 'abc',
                        size: 123,
                        source: 'drive',
                    })
                    .expect(200);
            });

            it('should fail creating new upload,', () => {
                return request(app)
                    .post('/api/uploads')
                    .send({
                        name: 'upload',
                        parent: 'abc',
                        uploadedBytes: 123,
                        size: 123,
                    })
                    .expect(400);
            });
        });

        describe('GET', () => {
            it('should get filtered uploads', async () => {
                await request(app)
                    .post('/api/uploads')
                    .send({ ...upload1 })
                    .expect(200);

                return request(app).get(`/api/uploads?name=${upload1.name}`).expect(200);
            });

            it('should get all uploads', async () => {
                await request(app)
                    .post('/api/uploads')
                    .send({ ...upload1 })
                    .expect(200);

                await request(app)
                    .post('/api/uploads')
                    .send({ ...upload2 });

                const { body: result } = await request(app).get('/api/uploads').expect(200);

                expect(result).toHaveLength(2);
                expect(result).toEqual([
                    {
                        ...upload1,
                        __v: expect.any(Number),
                        _id: expect.any(String),
                        createdAt: expect.anything(),
                        updatedAt: expect.anything(),
                    },
                    {
                        ...upload2,
                        __v: expect.any(Number),
                        _id: expect.any(String),
                        createdAt: expect.anything(),
                        updatedAt: expect.anything(),
                    },
                ]);
            });

            it('should get an empty array, when there are no files', async () => {
                const { body: result } = await request(app).get('/api/uploads');
                expect(result).toHaveLength(0);
            });

            it('should get an empty array, if filtered upload cant be found', async () => {
                await request(app)
                    .post('/api/uploads')
                    .send({ ...upload2 })
                    .expect(200);

                const { body: result } = await request(app).get(`/api/uploads?name=${upload1.name}`);
                expect(result).toHaveLength(0);
            });
        });

        describe('PATCH', () => {
            it('should successfully update an upload', async () => {
                await request(app)
                    .post('/api/uploads')
                    .send({ ...upload1 })
                    .expect(200);

                const { body: result } = await request(app).get('/api/uploads').expect(200);
                expect(result).toHaveLength(1);
                const uploadId = result[0]._id;

                await request(app).patch(`/api/uploads/${uploadId}`).send({ name: 'upload123' }).expect(200);
                const { body: result2 } = await request(app).get(`/api/uploads?id=${uploadId}`).expect(200);

                expect(result2).toHaveLength(1);
                expect(result2[0].name).toEqual('upload123');
            });

            it('should fail updating an upload', async () => {
                await request(app)
                    .post('/api/uploads')
                    .send({ ...upload1 })
                    .expect(200);

                const { body: result } = await request(app).get('/api/uploads').expect(200);
                expect(result).toHaveLength(1);
                const uploadId = result[0]._id;

                await request(app).patch(`/api/uploads/${uploadId}`).send({ name: 12345 }).expect(400);
            });
        });

        describe('DELETE', () => {
            it('should delete an upload', async () => {
                await request(app)
                    .post('/api/uploads')
                    .send({ ...upload2 })
                    .expect(200);

                const { body: result } = await request(app).get('/api/uploads').expect(200);
                expect(result).toHaveLength(1);

                await request(app).delete(`/api/uploads/${result[0]._id}`).expect(200);
            });

            it('should fail deleting an upload', async () => {
                await request(app)
                    .post('/api/uploads')
                    .send({ ...upload2 })
                    .expect(200);

                const { body: result } = await request(app).get('/api/uploads').expect(200);
                expect(result).toHaveLength(1);

                await request(app).delete(`/api/uploads/62529e358e6444d81c96603f`).expect(404);
            });
        });
    });
});
