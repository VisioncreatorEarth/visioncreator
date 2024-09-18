import { configureWunderGraphServer } from "@wundergraph/sdk/server";
import { createClient } from "@supabase/supabase-js";
import { Nango } from "@nangohq/node";
import * as postmark from "postmark";

class MyContext {
  supabase: ReturnType<typeof createClient>;
  nango: Nango;
  postmark: postmark.ServerClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;
    const nangoHost = process.env.NANGO_HOST;
    const nangoSecretKey = process.env.NANGO_SECRET_KEY;
    const postmarkServerToken = process.env.POSTMARK_SERVER_TOKEN;

    if (
      !supabaseUrl ||
      !supabaseKey ||
      !nangoHost ||
      !nangoSecretKey ||
      !postmarkServerToken
    ) {
      throw new Error(
        "Supabase URL, Key, Nango Host, Secret Key, Postmark Server Token must be provided."
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.nango = new Nango({
      host: nangoHost,
      secretKey: nangoSecretKey,
    });
    this.postmark = new postmark.ServerClient(postmarkServerToken);
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
    // mailNotification: {
    //   // You can add a verifier here if needed
    // },
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
