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
            process.env.ENV === "Next"
              ? "https://next.visioncreator.earth/auth/userinfo"
              : "http://127.0.0.1:3000/auth/userinfo",
        },
      ],
    },
  },
  cors: {
    ...cors.allowAll,
    allowedOrigins:
      process.env.ENV === "Next"
        ? ["https://next.visioncreator.earth"]
        : [
            "http://127.0.0.1:3000",
            new EnvironmentVariable("WG_ALLOWED_ORIGIN"),
          ],
  },
  options: {
    publicNodeUrl:
      process.env.ENV === "Next"
        ? "https://api-next-visioncreator-earth.fly.dev"
        : "http://127.0.0.1:9991",
  },
  authorization: {
    roles: ["admin", "authenticated"],
  },
});
