import {
  configureWunderGraphApplication,
  cors,
  EnvironmentVariable,
  templates,
} from "@wundergraph/sdk";
import server from "./wundergraph.server";
import operations from "./wundergraph.operations";

const isPreview =
  process.env.VERCEL_ENV === "preview" ||
  new EnvironmentVariable("VERCEL_ENV", "").toString() === "preview";
console.log("VERCEL_ENV:", process.env.VERCEL_ENV);
console.log("isPreview:", isPreview);

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
          userInfoEndpoint: isPreview
            ? "https://next.visioncreator.earth/auth/userinfo"
            : "http://127.0.0.1:3000/auth/userinfo",
        },
      ],
    },
  },
  cors: {
    ...cors.allowAll,
    allowedOrigins: isPreview
      ? ["https://next.visioncreator.earth"]
      : ["http://127.0.0.1:3000", new EnvironmentVariable("WG_ALLOWED_ORIGIN")],
  },
  options: {
    publicNodeUrl: isPreview
      ? "https://api-next-visioncreator-earth.fly.dev"
      : "http://127.0.0.1:9991",
  },
  authorization: {
    roles: ["admin", "authenticated"],
  },
});
