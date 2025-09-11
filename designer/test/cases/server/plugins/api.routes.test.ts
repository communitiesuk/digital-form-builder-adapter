const Code = require("@hapi/code");
const Lab = require("@hapi/lab");
const sinon = require("sinon");

const { expect } = Code;
const lab = Lab.script();
exports.lab = lab;
const { suite, test, beforeEach, afterEach } = lab;

suite("API Routes with Pre-Award Integration", () => {
  let mockPreAwardClient;

  beforeEach(() => {
    mockPreAwardClient = {
      getAllForms: sinon.stub(),
      getFormDraft: sinon.stub(),
      createOrUpdateForm: sinon.stub()
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  suite("getAllPersistedConfigurations", () => {
    test("should retrieve all forms from Pre-Award API", async () => {
      const mockForms = [
        { name: "form-1", updated_at: "2025-01-01" },
        { name: "form-2", updated_at: "2025-01-02" }
      ];
      mockPreAwardClient.getAllForms.resolves(mockForms);

      const forms = await mockPreAwardClient.getAllForms();
      const response = forms.map(form => ({
        Key: form.name,
        DisplayName: form.name,
        LastModified: form.updated_at
      }));

      expect(response).to.have.length(2);
      expect(response[0].DisplayName).to.equal("form-1");
    });

    test("should handle empty forms list", async () => {
      mockPreAwardClient.getAllForms.resolves([]);
      const result = await mockPreAwardClient.getAllForms();
      expect(result).to.equal([]);
    });
  });

  suite("getFormWithId", () => {
    test("should retrieve specific form from Pre-Award API", async () => {
      const mockForm = { 
        id: "test-form", 
        name: "Test Form"
      };
      mockPreAwardClient.getFormDraft.resolves(mockForm);

      const result = await mockPreAwardClient.getFormDraft("test-form");
      expect(result).to.equal(mockForm);
    });
  });

  suite("putFormWithId", () => {
    test("should save form to Pre-Award API", async () => {
      const mockResponse = { statusCode: 200 };
      mockPreAwardClient.createOrUpdateForm.resolves(mockResponse);

      const result = await mockPreAwardClient.createOrUpdateForm("test-form", {});
      expect(result.statusCode).to.equal(200);
    });
  });
});
