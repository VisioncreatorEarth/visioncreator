import {
  configureWunderGraphApplication,
  cors,
  EnvironmentVariable,
  templates,
} from "@wundergraph/sdk";
import server from "./wundergraph.server";
import operations from "./wundergraph.operations";

const isPreview =
  new EnvironmentVariable("VERCEL_ENV", "development").toString() === "preview";

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
            "WG_USER_INFO_ENDPOINT",
            isPreview
              ? "https://next.visioncreator.earth/auth/userinfo"
              : "http://127.0.0.1:3000/auth/userinfo"
          ),
        },
      ],
    },
  },
  cors: {
    ...cors.allowAll,
    allowedOrigins: isPreview
      ? [
          new EnvironmentVariable(
            "WG_ALLOWED_ORIGIN",
            "https://next.visioncreator.earth"
          ),
        ]
      : ["http://127.0.0.1:3000", new EnvironmentVariable("WG_ALLOWED_ORIGIN")],
  },
  options: {
    publicNodeUrl: new EnvironmentVariable(
      "WG_PUBLIC_NODE_URL",
      isPreview
        ? "https://api-next-visioncreator-earth.fly.dev"
        : "http://127.0.0.1:9991"
    ),
  },
  authorization: {
    roles: ["admin", "authenticated"],
  },
});
