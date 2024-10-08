import {
  configureWunderGraphApplication,
  cors,
  EnvironmentVariable,
  templates,
} from "@wundergraph/sdk";
import server from "./wundergraph.server";
import operations from "./wundergraph.operations";

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
          userInfoEndpoint: process.env.WG_USER_INFO_ENDPOINT
            ? process.env.WG_USER_INFO_ENDPOINT
            : new EnvironmentVariable("WG_USER_INFO_ENDPOINT"),
        },
      ],
    },
  },
  cors: {
    ...cors.allowAll,
    allowedOrigins: [
      process.env.WG_ALLOWED_ORIGIN
        ? process.env.WG_ALLOWED_ORIGIN
        : new EnvironmentVariable("WG_ALLOWED_ORIGIN"),
    ],
  },
  options: {
    publicNodeUrl: process.env.WG_PUBLIC_NODE_URL
      ? process.env.WG_PUBLIC_NODE_URL
      : new EnvironmentVariable("WG_PUBLIC_NODE_URL"),
  },
  authorization: {
    roles: ["admin", "authenticated"],
  },
});
