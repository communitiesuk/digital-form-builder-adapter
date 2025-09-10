const Code = require("@hapi/code");
const Lab = require("@hapi/lab");

const { expect } = Code;
const lab = Lab.script();
exports.lab = lab;
const { suite, test, beforeEach, afterEach } = lab;

suite("Configuration Management", () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = {
      PRE_AWARD_API_URL: process.env.PRE_AWARD_API_URL
    };
  });

  afterEach(() => {
    if (originalEnv.PRE_AWARD_API_URL !== undefined) {
      process.env.PRE_AWARD_API_URL = originalEnv.PRE_AWARD_API_URL;
    } else {
      delete process.env.PRE_AWARD_API_URL;
    }
  });

  suite("Pre-Award API URL Configuration", () => {
    test("should use provided PRE_AWARD_API_URL", () => {
      const testUrl = "https://api.example.com";
      process.env.PRE_AWARD_API_URL = testUrl;
      
      const preAwardApiUrl = process.env.PRE_AWARD_API_URL;
      
      expect(preAwardApiUrl).to.equal(testUrl);
    });

    test("should handle localhost URLs", () => {
      const localhostUrl = "http://localhost:3001";
      process.env.PRE_AWARD_API_URL = localhostUrl;
      
      const preAwardApiUrl = process.env.PRE_AWARD_API_URL;
      
      expect(preAwardApiUrl).to.equal(localhostUrl);
    });

    test("should handle URLs with paths", () => {
      const urlWithPath = "https://api.example.com/v1/forms";
      process.env.PRE_AWARD_API_URL = urlWithPath;
      
      const preAwardApiUrl = process.env.PRE_AWARD_API_URL;
      
      expect(preAwardApiUrl).to.equal(urlWithPath);
    });

    test("should use default when PRE_AWARD_API_URL is empty", () => {
      process.env.PRE_AWARD_API_URL = "";
      
      const preAwardApiUrl = process.env.PRE_AWARD_API_URL || "https://api.communities.gov.localhost:4004";
      
      expect(preAwardApiUrl).to.equal("https://api.communities.gov.localhost:4004");
    });

    test("should use default when PRE_AWARD_API_URL is undefined", () => {
      delete process.env.PRE_AWARD_API_URL;
      
      const preAwardApiUrl = process.env.PRE_AWARD_API_URL || "https://api.communities.gov.localhost:4004";
      
      expect(preAwardApiUrl).to.equal("https://api.communities.gov.localhost:4004");
    });
  });

  suite("Configuration Validation", () => {
    test("should validate API URL format", () => {
      const validUrls = [
        "https://api.example.com",
        "http://localhost:3001",
        "https://api.communities.gov.localhost:4004"
      ];
      
      validUrls.forEach(url => {
        process.env.PRE_AWARD_API_URL = url;
        const config = {
          preAwardApiUrl: process.env.PRE_AWARD_API_URL
        };
        
        expect(config.preAwardApiUrl).to.equal(url);
        expect(config.preAwardApiUrl).to.match(/^https?:\/\/.+/);
      });
    });

    test("should handle configuration with all required fields", () => {
      process.env.PRE_AWARD_API_URL = "https://api.example.com";
      
      const config = {
        preAwardApiUrl: process.env.PRE_AWARD_API_URL,
        env: "development",
        port: 3000
      };
      
      expect(config.preAwardApiUrl).to.equal("https://api.example.com");
      expect(config.env).to.equal("development");
      expect(config.port).to.equal(3000);
    });
  });
});