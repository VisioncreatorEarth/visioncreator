import {
  configureWunderGraphApplication,
  cors,
  EnvironmentVariable,
  introspect,
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
          userInfoEndpoint:
            process.env.NODE_ENV === "production"
              ? new EnvironmentVariable("NEXT_PUBLIC_WG_AUTH_INFO")
              : "http://127.0.0.1:3000/auth/userinfo",
        },
      ],
    },
  },
  cors: {
    ...cors.allowAll,
    allowedOrigins:
      process.env.NODE_ENV === "production"
        ? [new EnvironmentVariable("NEXT_PUBLIC_WG_ALLOW_CORS")]
        : ["http://127.0.0.1:3000"],
  },
  options: {
    publicNodeUrl:
      process.env.NODE_ENV === "production"
        ? new EnvironmentVariable("NEXT_PUBLIC_WG_API")
        : "http://127.0.0.1:9991",
  },
  authorization: {
    roles: ["admin", "authenticated"],
  },
});
