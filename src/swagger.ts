import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Backend club IA API",
      version: "1.0.0",
      description: "Documentation of backend club IA API",
      contact: {
        email: "sogancarmen1@gmail.com",
      },
    },
    components: {
      securitySchemes: {
        BearerAuth : {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    servers: [
      {
        url: `http://localhost:${process.env.PORT}`,
      },
      // { url: "https://club-ia-imsp-backend.onrender.com" },
    ],
  },
  apis: [
    "./src/content/*.ts",
    "./src/authentification/*.ts",
    "./src/email/*.ts",
    "./src/newsletters/*.ts",
    "./src/users/*.ts",
    "./src/contactUs/*.ts"
  ],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

export { swaggerUi, swaggerDocs };
