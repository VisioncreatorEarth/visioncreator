import { EnvironmentVariable } from "@wundergraph/sdk";

type Environment = {
  name: string;
  domain: string;
  apiDomain: string;
  allowedOrigins: string[];
};

const environments: Record<string, Environment> = {
  Production: {
    name: "Production",
    domain: "https://visioncreator.earth",
    apiDomain: "https://api-visioncreator-earth.fly.dev",
    allowedOrigins: ["https://visioncreator.earth"],
  },
  Next: {
    name: "Next",
    domain: "https://next.visioncreator.earth",
    apiDomain: "https://api-next-visioncreator-earth.fly.dev",
    allowedOrigins: ["https://next.visioncreator.earth"],
  },
  Development: {
    name: "Development",
    domain: "http://127.0.0.1:3000",
    apiDomain: "http://127.0.0.1:9991",
    allowedOrigins: ["http://127.0.0.1:3000"],
  },
};

export const getEnvironment = (): Environment => {
  const envName = new EnvironmentVariable("ENV", "Development").toString();
  return environments[envName] || environments.Development;
};
