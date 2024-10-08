import {
  configureWunderGraphApplication,
  cors,
  EnvironmentVariable,
  introspect,
  templates,
} from "@wundergraph/sdk";
import server from "./wundergraph.server";
import operations from "./wundergraph.operations";

const isProduction = process.env.NODE_ENV === "production";
const isNext = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

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
          userInfoEndpoint: isProduction
            ? "https://visioncreator.earth/auth/userinfo"
            : isNext
            ? "https://next.visioncreator.earth/auth/userinfo"
            : "http://127.0.0.1:3000/auth/userinfo",
        },
      ],
    },
  },
  cors: {
    ...cors.allowAll,
    allowedOrigins: isProduction
      ? ["https://visioncreator.earth"]
      : isNext
      ? ["https://next.visioncreator.earth"]
      : ["http://127.0.0.1:3000", new EnvironmentVariable("WG_ALLOWED_ORIGIN")],
  },
  options: {
    publicNodeUrl: isProduction
      ? "https://api-visioncreator-earth.fly.dev"
      : isNext
      ? "https://api-next-visioncreator-earth.fly.dev"
      : "http://127.0.0.1:9991",
  },
  authorization: {
    roles: ["admin", "authenticated"],
  },
});
