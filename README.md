# Welcome to Visioncreator

## Launch Development Environment
```
npm i
npm run dev
```
npm run dev will launch all apps and packages in our turbo monorepo. The supacreator package is our supabase postgres service. It has an external dependency to docker, which needs to be installed on the system in order for 'npx supabase start' to be able to launch the supabase services.

Now the following services are running:
- Frontend: http://127.0.0.1:3000
- API: http://127.0.0.1:9991
- Maizzle Email Template Preview: http://127.0.0.1:3001
- Supabase API Url: http://127.0.0.1:54321
- Supabase Studio: http://127.0.0.1:54323
- Inbucket (Email Inbox Simulation): http://127.0.0.1:54324
- Nango: https://127.0.0.1:3003


## After inital launch set env vars

After initial launch, when supabase is running, copy and past the env vars from our launched supacreator#package terminal.
To display the values again run 'npx supabase status' inside of our supacreator package.

Set them in apps/app:

```
PUBLIC_BASE_URL="http://127.0.0.1:3000"
PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
PUBLIC_SUPABASE_ANON_KEY="copy-me-from-supacreator-package-terminal"
SECRET_SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
SECRET_SUPABASE_SERVICE_ROLE="copy-me-from-supacreator-package-terminal"
```

Set them in apps/api:

```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE="copy-me-from-supacreator-package-terminal"
NANGO_SECRET_KEY="copy-from-nango-dev-dashboard"
NANGO_HOST=https://127.0.0.1:3003
```

Also go to the nango dashboard 127.0.0.1:3003 and setup your listmonk (listmonk-vc) and coda (codavc) credentials.

After setting up all ENV var, restart again with npm run dev.

## Supabase CLI

Link remote project

````
npx supabase link --project-ref "project_id"
`````

Pull schema from remote

```
npx supabase db pull --schema auth, storage
```

Local Diff of schema writing a local migration file

```
npx supabase db diff -f migration_xyz
```

Local migration of schema
```
npx supabase migration up
```


## Deployment to production

### Nango 3rd-Party API Gateway
1. Signup to Nango Cloud.
2. Switch the Environment to Prod
3. Add the Listmonk Integration, then add a new connection with your user credentials.
- Integration Unique Key: listmonk
- Connection ID: listmonk-vc
- Domain: listmonk.domain.earth
- username
- password

### Postgres DB
1. Log into Supabase and create a new Database
2. Save your Postgres DB Master Password in a Password Manager of your Choice
3. Generate Supabase Access Token:
If you haven't already, generate a Supabase access token:
- Go to https://app.supabase.com/
- Click on your profile icon > Account
- Go to Access Tokens and generate a new token
4. Setup GitHub Secrets:
In your GitHub repository, go to Settings > Secrets and Variables > Actions, and add the following secrets:
- `SUPABASE_ACCESS_TOKEN`: Your Supabase access token
- `SUPABASE_PROJECT_ID`: Your Supabase project ID
- `SUPABASE_DB_PASSWORD`: Your Supabase database password
5. Push to main branch and migrations are automagically applied.

```
5. Push your updates to the main branch and supabase production gets automatically migrated

### API
1. The api gets deployed via fly.io. To deploy the api, go into your apps/api/ folder and deploy in the terminal via 'flyctl deploy'

2. Set the following environment variables:
  - WG_SECURE_COOKIE_HASH_KEY (https://docs.wundergraph.com/docs/self-hosted/security)
  - WG_SECURE_COOKIE_BLOCK_KEY (https://docs.wundergraph.com/docs/self-hosted/security)
  - WG_CSRF_TOKEN_SECRET (https://docs.wundergraph.com/docs/self-hosted/security)
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE
  - SECRET_GOCARDLESS_ACCESS_TOKEN
  - NANGO_SECRET_KEY
  - NANGO_HOST

### Frontend
1. Go to vercel and deploy the svelte frontend apps/app.
2. Connect your domain.
3. Leave the Build and Output Settings as default.
4. Set the following environment variables:
- PUBLIC_SUPABASE_ANON_KEY
- PUBLIC_SUPABASE_URL
- SECRET_SUPABASE_JWT_SECRET
- SECRET_SUPABASE_SERVICE_ROLE
- PUBLIC_BASE_URL (https://{domain the app is deployed to})
- SECRET_LISTMONK_PASSWORD
- SECRET_LISTMONK_USER
- SECRET_ANTHROPIC_API_KEY
- SECRET_GOCARDLESS_ACCESS_TOKEN
