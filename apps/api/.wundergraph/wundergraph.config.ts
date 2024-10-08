import {
  configureWunderGraphApplication,
  cors,
  templates,
  EnvironmentVariable,
} from "@wundergraph/sdk";
import server from "./wundergraph.server";
import operations from "./wundergraph.operations";
import { getEnvironment } from "./environments.config";

const env = getEnvironment();

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
          userInfoEndpoint: new EnvironmentVariable(
            "WG_AUTH_USER_INFO_ENDPOINT",
            `${env.domain}/auth/userinfo`
          ),
        },
      ],
    },
  },
  cors: {
    ...cors.allowAll,
    allowedOrigins: env.allowedOrigins,
  },
  options: {
    publicNodeUrl: env.apiDomain,
    defaultHttpProxyUrl: env.apiDomain,
  },
  authorization: {
    roles: ["admin", "authenticated"],
  },
  security: {
    enableGraphQLEndpoint: false,
  },
});
