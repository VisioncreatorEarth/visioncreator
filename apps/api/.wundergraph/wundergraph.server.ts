import { configureWunderGraphServer } from "@wundergraph/sdk/server";
import { createClient } from "@supabase/supabase-js";
import { Nango } from "@nangohq/node";
import * as postmark from "postmark";
// import { Polar } from "@polar-sh/sdk";
import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from "openai";
import { UltravoxClient } from './clients/ultravox';
// import { SandboxClient } from './clients/sandbox';

class MyContext {
  supabase: ReturnType<typeof createClient>;
  nango: Nango;
  postmark: postmark.ServerClient;
  polar: Polar;
  anthropic: Anthropic;
  openai: OpenAI;
  ultravox: UltravoxClient;
  sandbox: SandboxClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;
    const nangoHost = process.env.NANGO_HOST;
    const nangoSecretKey = process.env.NANGO_SECRET_KEY;
    const postmarkServerToken = process.env.POSTMARK_SERVER_TOKEN;
    // const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    const openAIApiKey = process.env.OPENAI_API_KEY;
    const ultravoxApiKey = process.env.ULTRAVOX_API_KEY;

    if (
      !supabaseUrl ||
      !supabaseKey ||
      !nangoHost ||
      !nangoSecretKey ||
      !postmarkServerToken ||
      // !polarAccessToken ||
      !anthropicApiKey ||
      !openAIApiKey ||
      !ultravoxApiKey
    ) {
      throw new Error(
        "Missing required environment variables"
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.nango = new Nango({
      host: nangoHost,
      secretKey: nangoSecretKey,
    });
    this.postmark = new postmark.ServerClient(postmarkServerToken);
    // this.polar = new Polar({
    //   accessToken: polarAccessToken,
    //   server: "sandbox",
    // });
    this.ultravox = new UltravoxClient(ultravoxApiKey);
    // this.sandbox = new SandboxClient();
    this.anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    });
    this.openai = new OpenAI({
      apiKey: openAIApiKey
    });
  }
}

declare module "@wundergraph/sdk/server" {
  export interface CustomContext {
    request: MyContext;
  }
}

export default configureWunderGraphServer(() => ({
  hooks: {
    authentication: {
      mutatingPostAuthentication: async ({ user }) => {
        if (user.roles === null) {
          if (user.customClaims?.roles) {
            user.roles = Object.values(user.customClaims.roles);
          }
        }
        return {
          user,
          status: "ok",
        };
      },
    },

  },
  webhooks: {
  },
  context: {
    request: {
      create: async () => {
        return new MyContext();
      },
    },
  },
  logger: {
    level: "debug",
  },
}));