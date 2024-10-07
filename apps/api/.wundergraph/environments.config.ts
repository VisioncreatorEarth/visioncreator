import { EnvironmentVariable } from "@wundergraph/sdk";

type Environment = {
  name: string;
  domain: string;
  apiDomain: string;
  allowedOrigins: string[];
};

const environments: Record<string, Environment> = {
  production: {
    name: "production",
    domain: "https://visioncreator.earth",
    apiDomain: "https://api-visioncreator-earth.fly.dev",
    allowedOrigins: ["https://visioncreator.earth"],
  },
  next: {
    name: "next",
    domain: "https://next.visioncreator.earth",
    apiDomain: "https://api-next-visioncreator-earth.fly.dev",
    allowedOrigins: ["https://next.visioncreator.earth"],
  },
  development: {
    name: "development",
    domain: "http://127.0.0.1:3000",
    apiDomain: "http://127.0.0.1:9991",
    allowedOrigins: [
      "http://127.0.0.1:3000",
      new EnvironmentVariable("WG_ALLOWED_ORIGIN"),
    ],
  },
};

export const getEnvironment = (): Environment => {
  const envName = process.env.ENV || "development";
  return environments[envName] || environments.development;
};
