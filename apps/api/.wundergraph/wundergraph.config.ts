import {
  configureWunderGraphApplication,
  cors,
  templates,
} from "@wundergraph/sdk";
import server from "./wundergraph.server";
import operations from "./wundergraph.operations";
import { domainConfig } from "./domain.config";

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
          userInfoEndpoint: domainConfig.userInfoEndpoint,
        },
      ],
    },
  },
  cors: {
    ...cors.allowAll,
    allowedOrigins: domainConfig.allowedOrigins,
  },
  options: {
    publicNodeUrl: domainConfig.publicNodeUrl,
  },
  authorization: {
    roles: ["admin", "authenticated"],
  },
});
