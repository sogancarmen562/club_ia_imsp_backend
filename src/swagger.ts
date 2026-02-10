import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Backend club IA API 1",
      version: "1.0.0",
      description: "Documentation of backend club IA API",
      contact: {
        email: "sogancarmen1@gmail.com",
      },
    },
    // components: {
    //   securitySchemes: {
    //     BearerAuth : {
    //       type: "http",
    //       scheme: "bearer",
    //       bearerFormat: "JWT",
    //     },
    //   },
    // },
    // security: [
    //   {
    //     BearerAuth: [],
    //   },
    // ],
    servers: [
    {
      url: "https://sogancarmen.pro",
      description: "Production server"
    },
    {
      url: `http://localhost:${process.env.PORT || 5000}`,
      description: "Local development server"
    }
  ]

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
