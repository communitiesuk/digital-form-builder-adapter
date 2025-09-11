const Code = require("@hapi/code");
const Lab = require("@hapi/lab");
const sinon = require("sinon");

const { expect } = Code;
const lab = Lab.script();
exports.lab = lab;
const { suite, test, beforeEach, afterEach } = lab;

class MockPreAwardApiClient {
  public baseUrl: string;
  public wreck: any;

  constructor(baseUrl: string, wreckClient: any) {
    this.baseUrl = baseUrl;
    this.wreck = wreckClient;
  }

  async createOrUpdateForm(formData: any): Promise<any> {
    const url = `${this.baseUrl}/forms`;
    return await this.wreck.post(url, {
      payload: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" }
    });
  }

  async getAllForms(): Promise<any[]> {
    const url = `${this.baseUrl}/forms`;
    const response = await this.wreck.get(url);
    return JSON.parse((response.payload).toString());
  }

  async getFormDraft(formId: string): Promise<any> {
    const url = `${this.baseUrl}/forms/${formId}`;
    const response = await this.wreck.get(url);
    return JSON.parse((response.payload).toString());
  }
}

suite("PreAwardApiClient", () => {
  let client;
  let wreckStub;

  beforeEach(() => {
    wreckStub = {
      post: sinon.stub(),
      get: sinon.stub(),
    };
    client = new MockPreAwardApiClient("https://test-api.com", wreckStub);
  });

  afterEach(() => {
    sinon.restore();
  });

  suite("createOrUpdateForm", () => {
    test("should successfully create a new form", async () => {
      const mockResponse = { statusCode: 201 };
      wreckStub.post.resolves(mockResponse);

      const formData = { 
        name: "Test Form", 
        form_json: { pages: [] }
      };
      const result = await client.createOrUpdateForm(formData);

      expect(wreckStub.post.calledOnce).to.be.true();
      expect(result).to.equal(mockResponse);
    });

    test("should handle network errors", async () => {
      const networkError = new Error("Network timeout");
      wreckStub.post.rejects(networkError);

      try {
        await client.createOrUpdateForm({ name: "test-id", form_json: {} });
        expect.fail("Should have thrown a network error");
      } catch (err: any) {
        expect(err.message).to.equal("Network timeout");
      }
    });
  });

  suite("getAllForms", () => {
    test("should successfully retrieve all forms", async () => {
      const mockForms = [
        { id: "form-1", name: "Application Form" },
        { id: "form-2", name: "Feedback Form" }
      ];
      const mockBuffer = Buffer.from(JSON.stringify(mockForms));
      wreckStub.get.resolves({ payload: mockBuffer });

      const result = await client.getAllForms();

      expect(result).to.equal(mockForms);
      expect(result.length).to.equal(2);
    });

    test("should handle empty forms list", async () => {
      const mockBuffer = Buffer.from(JSON.stringify([]));
      wreckStub.get.resolves({ payload: mockBuffer });

      const result = await client.getAllForms();

      expect(result).to.equal([]);
    });
  });

  suite("getFormDraft", () => {
    test("should successfully retrieve a specific form", async () => {
      const mockForm = { 
        id: "test-form", 
        name: "Test Form",
        configuration: { pages: [] }
      };
      const mockBuffer = Buffer.from(JSON.stringify(mockForm));
      wreckStub.get.resolves({ payload: mockBuffer });

      const result = await client.getFormDraft("test-form");

      expect(result).to.equal(mockForm);
    });

    test("should handle form not found", async () => {
      const notFoundError = new Error("Form not found");
      (notFoundError as any).statusCode = 404;
      wreckStub.get.rejects(notFoundError);

      try {
        await client.getFormDraft("non-existent-form");
        expect.fail("Should have thrown a not found error");
      } catch (err: any) {
        expect(err.message).to.equal("Form not found");
      }
    });
  });
});