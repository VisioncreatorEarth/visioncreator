import {
  configureWunderGraphApplication,
  cors,
  EnvironmentVariable,
  templates,
} from "@wundergraph/sdk";
import server from "./wundergraph.server";
import operations from "./wundergraph.operations";

const isProduction = process.env.ENV === "Production";
const isNext = process.env.ENV === "Next";

const getConfig = () => {
  if (isProduction) {
    return {
      userInfoEndpoint: "https://visioncreator.earth/auth/userinfo",
      allowedOrigins: ["https://visioncreator.earth"],
      publicNodeUrl: "https://api-visioncreator-earth.fly.dev",
    };
  } else if (isNext) {
    return {
      userInfoEndpoint: "https://next.visioncreator.earth/auth/userinfo",
      allowedOrigins: ["https://next.visioncreator.earth"],
      publicNodeUrl: "https://api-next-visioncreator-earth.fly.dev",
    };
  } else {
    return {
      userInfoEndpoint: "http://127.0.0.1:3000/auth/userinfo",
      allowedOrigins: [
        "http://127.0.0.1:3000",
        new EnvironmentVariable("WG_ALLOWED_ORIGIN"),
      ],
      publicNodeUrl: "http://127.0.0.1:9991",
    };
  }
};

const config = getConfig();

configureWunderGraphApplication({
  apis: [],
  server,
  operations,
  generate: {
    codeGenerators: [
      {
        templates: [templates.typescript.client],
        path: "../../../packages/generated-wundergraph",
      },
    ],
  },
  authentication: {
    tokenBased: {
      providers: [
        {
          userInfoEndpoint: config.userInfoEndpoint,
        },
      ],
    },
  },
  cors: {
    ...cors.allowAll,
    allowedOrigins: config.allowedOrigins,
  },
  options: {
    publicNodeUrl: config.publicNodeUrl,
  },
  authorization: {
    roles: ["admin", "authenticated"],
  },
});
