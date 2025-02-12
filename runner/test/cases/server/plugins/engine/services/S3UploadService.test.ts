import * as Lab from "@hapi/lab";
import * as Code from "@hapi/code";
import {S3UploadService} from "../../../../../../src/server/services";
import sinon from 'sinon';

const {expect} = Code;
const lab = Lab.script();
exports.lab = lab;
const {suite, test, beforeEach, afterEach} = lab;

suite('S3UploadService', () => {
    let sandbox, server, s3UploadService;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        server = {logger: {info: sandbox.stub(), error: sandbox.stub()}};
        s3UploadService = new S3UploadService(server);
    });

    afterEach(() => {
        sandbox.restore();
    });

    test('should have a file size limit of 5MB', () => {
        expect(s3UploadService.fileSizeLimit).to.equal(5 * 1024 * 1024);
    });

    test('should have a valid list of file types', () => {
        expect(s3UploadService.validFiletypes).to.include(['jpg', 'jpeg', 'png', 'pdf', 'txt', 'doc', 'docx', 'odt', 'csv', 'xls', 'xlsx', 'ods']);
    });

    test('should correctly identify file streams from payload', () => {
        const payload = {
            file1: {_data: Buffer.from('test'), hapi: {filename: 'test.jpg'}},
            file2: {_data: Buffer.from(''), hapi: {filename: 'empty.txt'}}
        };
        const result = s3UploadService.fileStreamsFromPayload(payload);
        expect(result.length).to.equal(1);
        expect(result[0][0]).to.equal('file1');
    });

    test('should normalize paths correctly', () => {
        const path = '/some/path/';
        const normalizedPath = s3UploadService.normalisePath(path);
        expect(normalizedPath).to.equal('some/path');
    });

    test('should handle file upload errors correctly', async () => {
        const mockFiles = [{
            hapi: {filename: 'test.jpg', headers: {'content-type': 'image/jpeg'}},
            _data: Buffer.from('test')
        }];
        const uploadStub = sandbox.stub(s3UploadService, 'uploadFilesS3').resolves([{error: 'Upload failed'}]);

        const result = await s3UploadService.uploadDocuments(mockFiles, 'test-prefix', {});
        expect(result.error).to.exist();
        expect(result.error).to.include('Upload failed');
        uploadStub.restore();
    });

    test('should return signed URL for file download', async () => {
        const key = 'test-file.jpg';
        const getSignedUrlStub = sandbox.stub(s3UploadService, 'getFileDownloadUrlS3').resolves('https://signed-url.com');
        const url = await s3UploadService.getFileDownloadUrlS3(key);
        expect(url).to.equal('https://signed-url.com');
        getSignedUrlStub.restore();
    });

    test('should return signed URL for file upload', async () => {
        const key = 'upload-file.jpg';
        const getSignedUploadUrlStub = sandbox.stub(s3UploadService, 'getPreSignedUrlS3').resolves('https://upload-url.com');
        const url = await s3UploadService.getPreSignedUrlS3(key);
        expect(url).to.equal('https://upload-url.com');
        getSignedUploadUrlStub.restore();
    });

    test('should delete a file from S3 successfully', async () => {
        const key = 'delete-file.jpg';
        const deleteStub = sandbox.stub(s3UploadService, 'deleteFileS3').resolves(true);
        const result = await s3UploadService.deleteFileS3(key);
        expect(result).to.be.true();
        deleteStub.restore();
    });

    test('should return false if file deletion fails', async () => {
        const key = 'delete-fail.jpg';
        const deleteStub = sandbox.stub(s3UploadService, 'deleteFileS3').resolves(false);
        const result = await s3UploadService.deleteFileS3(key);
        expect(result).to.be.false();
        deleteStub.restore();
    });
});
