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
          userInfoEndpoint: new EnvironmentVariable("WG_USER_INFO_ENDPOINT"),
        },
      ],
    },
  },
  cors: {
    ...cors.allowAll,
    allowedOrigins: [new EnvironmentVariable("WG_ALLOWED_ORIGIN")],
  },
  options: {
    publicNodeUrl: new EnvironmentVariable("WG_PUBLIC_NODE_URL"),
  },
  authorization: {
    roles: ["admin", "authenticated"],
  },
});
