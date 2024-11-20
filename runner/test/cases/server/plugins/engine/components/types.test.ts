import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
const lab = Lab.script();
exports.lab = lab;
const { expect } = Code;
const { suite, describe, it } = lab;
import sinon from "sinon";
import { FreeTextFieldViewModel, ClientSideFileUploadFieldViewModel, AdapterDataType } from "./types";
import { S3Object } from "../../../services/S3UploadService";

suite("ViewModel Types", () => {
  describe("FreeTextFieldViewModel", () => {
    it("should create a FreeTextFieldViewModel with optional properties", () => {
      const viewModel: FreeTextFieldViewModel = {
        maxlength: 100,
        isCharacterOrWordCount: true,
        maxWords: 50,
        id: "freeTextField",
        name: "freeTextField",
        type: "text",
        title: "Free Text Field",
      };

      expect(viewModel.maxlength).to.equal(100);
      expect(viewModel.isCharacterOrWordCount).to.be.true();
      expect(viewModel.maxWords).to.equal(50);
      expect(viewModel.id).to.equal("freeTextField");
      expect(viewModel.name).to.equal("freeTextField");
      expect(viewModel.type).to.equal("text");
      expect(viewModel.title).to.equal("Free Text Field");
    });
  });

  describe("ClientSideFileUploadFieldViewModel", () => {
    it("should create a ClientSideFileUploadFieldViewModel with required properties", () => {
      const s3Object: S3Object = {
        bucket: "my-bucket",
        key: "file-key",
        location: "file-location",
      };

      const viewModel: ClientSideFileUploadFieldViewModel = {
        dropzoneConfig: {},
        existingFiles: [s3Object],
        pageAndForm: "page1-form1",
        id: "fileUploadField",
        name: "fileUploadField",
        type: "file",
        title: "File Upload Field",
      };

      expect(viewModel.dropzoneConfig).to.be.an.object();
      expect(viewModel.existingFiles).to.be.an.array();
      expect(viewModel.existingFiles[0]).to.equal(s3Object);
      expect(viewModel.pageAndForm).to.equal("page1-form1");
      expect(viewModel.id).to.equal("fileUploadField");
      expect(viewModel.name).to.equal("fileUploadField");
      expect(viewModel.type).to.equal("file");
      expect(viewModel.title).to.equal("File Upload Field");
    });
  });

  describe("AdapterDataType", () => {
    it("should create an AdapterDataType", () => {
      const dataType: AdapterDataType = "string"; // Assuming DataType is a string union type

      expect(dataType).to.equal("string");
    });
  });
});
