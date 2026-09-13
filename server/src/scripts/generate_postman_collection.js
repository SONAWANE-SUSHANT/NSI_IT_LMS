const fs = require("fs");
const path = require("path");

const openapiPath = path.resolve(__dirname, "../../../openapi/openapi.json");
const openapi = JSON.parse(fs.readFileSync(openapiPath, "utf-8"));

// Postman collection root structure
const collection = {
  info: {
    _postman_id: "a1b2c3d4-e5f6-7890-abcd-nsiitlms0001",
    name: "NSI-IT-LMS API Collection",
    description:
      "Complete Postman collection automatically generated from the official OpenAPI 3.0.3 specification for NSI IT LMS (Nityashree Infosystems Learning Management System).\n\n### How to authenticate:\n1. Open the 'Authentication -> User Login' request.\n2. Submit with valid credentials (e.g. admin@nsiit.com / Admin@123).\n3. The test script automatically saves the returned JWT token into the `{{token}}` collection variable.\n4. All other requests inherit Bearer Token authorization automatically.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  auth: {
    type: "bearer",
    bearer: [
      {
        key: "token",
        value: "{{token}}",
        type: "string",
      },
    ],
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5000", type: "string" },
    { key: "token", value: "", type: "string" },
    { key: "userId", value: "1", type: "string" },
    { key: "courseId", value: "1", type: "string" },
    { key: "moduleId", value: "1", type: "string" },
    { key: "lectureId", value: "1", type: "string" },
    { key: "noteId", value: "1", type: "string" },
    { key: "batchId", value: "1", type: "string" },
    { key: "instructorId", value: "2", type: "string" },
    { key: "studentId", value: "3", type: "string" },
    { key: "quizId", value: "1", type: "string" },
    { key: "questionId", value: "1", type: "string" },
    { key: "optionId", value: "1", type: "string" },
    { key: "attemptId", value: "1", type: "string" },
    { key: "notificationId", value: "1", type: "string" },
    { key: "announcementId", value: "1", type: "string" },
    { key: "reviewId", value: "1", type: "string" },
    { key: "deviceId", value: "dev_123", type: "string" },
  ],
  item: [],
};

// Map tag names to folders
const folderMap = {};
openapi.tags.forEach((tag) => {
  folderMap[tag.name] = {
    name: tag.name,
    description: tag.description,
    item: [],
  };
});

// Process each path and method
for (const [routePath, methods] of Object.entries(openapi.paths)) {
  for (const [method, op] of Object.entries(methods)) {
    const tagName = op.tags && op.tags.length > 0 ? op.tags[0] : "General";
    if (!folderMap[tagName]) {
      folderMap[tagName] = { name: tagName, item: [] };
    }

    // Convert OpenAPI path params {id} to Postman :id format and URL paths
    const pmPath = routePath.replace(/^\//, "").split("/").map((segment) => {
      if (segment.startsWith("{") && segment.endsWith("}")) {
        const paramName = segment.slice(1, -1);
        return `:${paramName}`;
      }
      return segment;
    });

    // Query parameters
    const queryParams = (op.parameters || [])
      .filter((p) => p.in === "query")
      .map((p) => ({
        key: p.name,
        value: p.schema?.default !== undefined ? String(p.schema.default) : "",
        description: p.description || "",
      }));

    // URL path variables
    const pathVariables = (op.parameters || [])
      .filter((p) => p.in === "path")
      .map((p) => {
        let defaultVar = "{{userId}}";
        if (p.name.toLowerCase().includes("course")) defaultVar = "{{courseId}}";
        else if (p.name.toLowerCase().includes("module")) defaultVar = "{{moduleId}}";
        else if (p.name.toLowerCase().includes("lecture") || p.name.toLowerCase().includes("session")) defaultVar = "{{lectureId}}";
        else if (p.name.toLowerCase().includes("note")) defaultVar = "{{noteId}}";
        else if (p.name.toLowerCase().includes("batch")) defaultVar = "{{batchId}}";
        else if (p.name.toLowerCase().includes("instructor")) defaultVar = "{{instructorId}}";
        else if (p.name.toLowerCase().includes("student")) defaultVar = "{{studentId}}";
        else if (p.name.toLowerCase().includes("quiz")) defaultVar = "{{quizId}}";
        else if (p.name.toLowerCase().includes("question")) defaultVar = "{{questionId}}";
        else if (p.name.toLowerCase().includes("option")) defaultVar = "{{optionId}}";
        else if (p.name.toLowerCase().includes("attempt")) defaultVar = "{{attemptId}}";
        else if (p.name.toLowerCase().includes("notification")) defaultVar = "{{notificationId}}";
        else if (p.name.toLowerCase().includes("announcement")) defaultVar = "{{announcementId}}";
        else if (p.name.toLowerCase().includes("review")) defaultVar = "{{reviewId}}";
        else if (p.name.toLowerCase().includes("device")) defaultVar = "{{deviceId}}";

        return {
          key: p.name,
          value: defaultVar,
          description: p.description || "",
        };
      });

    // Request Body
    let reqBody = undefined;
    if (op.requestBody && op.requestBody.content && op.requestBody.content["application/json"]) {
      const schema = op.requestBody.content["application/json"].schema;
      let exampleBody = {};

      if (schema && schema.properties) {
        for (const [propName, propDef] of Object.entries(schema.properties)) {
          if (propDef.example !== undefined) {
            exampleBody[propName] = propDef.example;
          } else if (propDef.type === "string") {
            exampleBody[propName] = propName.includes("email") ? "test@nsiit.com" : "string";
          } else if (propDef.type === "integer" || propDef.type === "number") {
            exampleBody[propName] = 1;
          } else if (propDef.type === "boolean") {
            exampleBody[propName] = true;
          } else if (propDef.type === "array") {
            exampleBody[propName] = [];
          } else {
            exampleBody[propName] = {};
          }
        }
      }

      reqBody = {
        mode: "raw",
        raw: JSON.stringify(exampleBody, null, 2),
        options: {
          raw: {
            language: "json",
          },
        },
      };
    }

    // Lightweight Postman Tests
    let event = undefined;
    if (routePath === "/api/auth/login" && method.toLowerCase() === "post") {
      event = [
        {
          listen: "test",
          script: {
            type: "text/javascript",
            exec: [
              "pm.test('Status code is 200', function () {",
              "    pm.response.to.have.status(200);",
              "});",
              "",
              "pm.test('Token received and saved to collection variable', function () {",
              "    var jsonData = pm.response.json();",
              "    pm.expect(jsonData.success).to.eql(true);",
              "    pm.expect(jsonData.data.token).to.be.a('string');",
              "    pm.collectionVariables.set('token', jsonData.data.token);",
              "    console.log('Saved token to {{token}}');",
              "});",
            ],
          },
        },
      ];
    } else {
      event = [
        {
          listen: "test",
          script: {
            type: "text/javascript",
            exec: [
              "pm.test('Status code is 2xx', function () {",
              "    pm.expect(pm.response.code).to.be.oneOf([200, 201, 204]);",
              "});",
              "",
              "pm.test('Response is valid JSON with success flag', function () {",
              "    var jsonData = pm.response.json();",
              "    pm.expect(jsonData).to.be.an('object');",
              "    pm.expect(jsonData).to.have.property('success');",
              "});",
            ],
          },
        },
      ];
    }

    const item = {
      name: op.summary || `${method.toUpperCase()} ${routePath}`,
      event,
      request: {
        method: method.toUpperCase(),
        header: [
          {
            key: "Accept",
            value: "application/json",
            type: "text",
          },
          ...(reqBody ? [{ key: "Content-Type", value: "application/json", type: "text" }] : []),
        ],
        body: reqBody,
        url: {
          raw: `{{baseUrl}}/${pmPath.join("/")}${queryParams.length > 0 ? "?" + queryParams.map((q) => `${q.key}=${q.value}`).join("&") : ""}`,
          host: ["{{baseUrl}}"],
          path: pmPath,
          query: queryParams,
          variable: pathVariables,
        },
        description: op.description || op.summary || "",
      },
      response: [],
    };

    folderMap[tagName].item.push(item);
  }
}

// Add folders with items to collection
for (const folder of Object.values(folderMap)) {
  if (folder.item.length > 0) {
    collection.item.push(folder);
  }
}

// Write collection file
const postmanDir = path.resolve(__dirname, "../../../postman");
if (!fs.existsSync(postmanDir)) {
  fs.mkdirSync(postmanDir, { recursive: true });
}

const outputPath = path.join(postmanDir, "NSI-IT-LMS.postman_collection.json");
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2), "utf-8");

let totalRequests = 0;
collection.item.forEach((f) => {
  totalRequests += f.item.length;
});

console.log(`Postman collection generated successfully!`);
console.log(`File: ${outputPath}`);
console.log(`Folders: ${collection.item.length}`);
console.log(`Total Requests: ${totalRequests}`);
