import { EnvironmentVariable } from "@wundergraph/sdk";

type Environment = {
  name: string;
  domain: EnvironmentVariable;
  apiDomain: EnvironmentVariable;
  allowedOrigins: EnvironmentVariable[];
};

const environments: Record<string, Environment> = {
  Production: {
    name: "Production",
    domain: new EnvironmentVariable(
      "WG_PUBLIC_URL",
      "https://visioncreator.earth"
    ),
    apiDomain: new EnvironmentVariable(
      "WG_PUBLIC_NODE_URL",
      "https://api-visioncreator-earth.fly.dev"
    ),
    allowedOrigins: [
      new EnvironmentVariable(
        "WG_ALLOWED_ORIGIN",
        "https://visioncreator.earth"
      ),
    ],
  },
  Next: {
    name: "Next",
    domain: new EnvironmentVariable(
      "WG_PUBLIC_URL",
      "https://next.visioncreator.earth"
    ),
    apiDomain: new EnvironmentVariable(
      "WG_PUBLIC_NODE_URL",
      "https://api-next-visioncreator-earth.fly.dev"
    ),
    allowedOrigins: [
      new EnvironmentVariable(
        "WG_ALLOWED_ORIGIN",
        "https://next.visioncreator.earth"
      ),
    ],
  },
  Development: {
    name: "Development",
    domain: new EnvironmentVariable("WG_PUBLIC_URL", "http://localhost:3000"),
    apiDomain: new EnvironmentVariable(
      "WG_PUBLIC_NODE_URL",
      "http://localhost:9991"
    ),
    allowedOrigins: [
      new EnvironmentVariable("WG_ALLOWED_ORIGIN", "http://localhost:3000"),
    ],
  },
};

export const getEnvironment = (): Environment => {
  const envName = new EnvironmentVariable("ENV", "Development").toString();
  return environments[envName] || environments.Development;
};
