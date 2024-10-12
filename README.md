# Welcome to Visioncreator
## Prerequisites

Before getting started, ensure you have the following installed and set up:

- Docker
- Node.js
- npm
- Nango (hosted)
- Postmark (hosted)
- Supabase (hosted)
- Listmonk (self-hosted)

## Launch Development Environment
```
npm i
npm run dev
```
npm run dev will launch all apps and packages in our turbo monorepo. The supacreator package is our supabase postgres service. It has an external dependency to docker, which needs to be installed on the system in order for 'npx supabase start' to be able to launch the supabase services.

Now the following services are running:
- Frontend: http://127.0.0.1:3000
- API: http://127.0.0.1:9991
- Maizzle Email Template Preview: http://127.0.0.1:3002
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
NANGO_HOST=https://app.nango.dev
POSTMARK_SERVER_TOKEN="copy-from-postmark-dashboard"
POSTMARK_WEBHOOK_USERNAME="set-inbound-webhook-in-postmark-dashboard"
POSTMARK_WEBHOOK_PASSWORD="set-inbound-webhook-in-postmark-dashboard"
POSTMARK_INBOUND_MAIL="copy-from-postmark-dashboard"
```

Also go to the nango dashboard 127.0.0.1:3003 and setup your listmonk (listmonk-vc) and coda (codavc) credentials.

After setting up all ENV var, restart again with npm run dev.

## Generate Maizzle Templates

Go into packages/maizzle and run npm run dev, this generates your email templates, which you can copy and past into listmonk and supabase.

## Supabase CLI

Link remote project

````
npx supabase link --project-ref "project_id"
`````

Pull schema from remote

```
npx supabase db pull --schema auth, storage
```

Local Diff of schema writing a local migration file (needed when updating schema via Supabase Dashboard UI)

```
npx supabase db diff -f migration_xyz
```

Local migration of schema

```
npx supabase migration up
```

Reset Database (be carful with --linked as this resets the remote production db)
```
npx supabase db reset (without argument local db, with --linked remote production db)
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

3. Seed your database before first push manually (ATTENTION: only do this the first time, otherwise you loose data)
In your local environment:
```
cd packages/supacreator/supabase
npx supabase link --project-ref "project_id"
npx supabase db reset --linked
```

4. Generate Supabase Access Token:
If you haven't already, generate a Supabase access token:
- Go to https://app.supabase.com/
- Click on your profile icon > Account
- Go to Access Tokens and generate a new token

5. Setup GitHub Secrets:
In your GitHub repository, go to Settings > Secrets and Variables > Actions, and add the following secrets:
- `SUPABASE_ACCESS_TOKEN`: Your Supabase access token
- `SUPABASE_PROJECT_ID`: Your Supabase project ID
- `SUPABASE_DB_PASSWORD`: Your Supabase database password

for db backup dumps to digital ocean
- `SUPABASE_DB_HOST`: get from your postgres connection string
- `SUPABASE_DB_NAME`: get from your postgres connection string
- `SUPABASE_DB_USER`: get from your postgres connection string

6. Push your updates to the main branch and supabase production gets automatically migrated

7. Setup Mail
- Goto https://supabase.com/dashboard/project/projectid/auth/url-configuration and set:
  - Site URL: https://domain.earth
  - Redirect URL: https://domain.earth/me
- Setup Email Tempaltes - Goto https://supabase.com/dashboard/project/projectid/auth/templates
  - Generate the maizzle email templates inside of packages/maizzle and copy and paste them into the Supabase UI.
  - Confirm Signup -> Visionletter SignUp
  - Magic Link -> Magic Signin
- Setup Custom SMTP Mail Provider with Postmark: Goto https://supabase.com/dashboard/project/projectid/settings/auth#auth-config-smtp-form
  - Host: smtp.postmarkapp.com
  - Port: 587
  - Minimum interval: 30
  - username and password credentials from postmark dashboard
- Add custom supabase domain
  - Goto https://supabase.com/dashboard/project/projectid/settings/general and configure custom domain

### API
1. Store the following environment variables in your github repository secrets:
- `FLY_API_TOKEN`,
- `SUPABASE_URL`,
- `SUPABASE_SERVICE_ROLE`,
- `NANGO_SECRET_KEY`,
- `NANGO_HOST`
- `POSTMARK_SERVER_TOKEN`="copy-from-postmark-dashboard"
- `POSTMARK_WEBHOOK_USERNAME`="set-inbound-webhook-in-postmark-dashboard"
- `POSTMARK_WEBHOOK_PASSWORD`="set-inbound-webhook-in-postmark-dashboard"
- `POSTMARK_INBOUND_MAIL`="copy-from-postmark-dashboard"
- `NEXT_PUBLIC_WG_API`="fly.io wundergraph api domain f.e. https://app-name-xyz.fly.dev"
- `NEXT_PUBLIC_WG_ALLOW_CORS`="frontend app domain f.e. https://xyz.com (vercel hosted)"
- `NEXT_PUBLIC_WG_AUTH_INFO`="frontend app domain https://xyz.com/auth/userinfo"

### Frontend
1. Go to vercel, connect your repo and deploy the svelte frontend apps/app.
2. Connect in the Vercel UI your repo and deploy the project, while setting the following vars:
- PUBLIC_SUPABASE_ANON_KEY
- PUBLIC_SUPABASE_URL
- SECRET_SUPABASE_JWT_SECRET
- SECRET_SUPABASE_SERVICE_ROLE
- SECRET_LISTMONK_PASSWORD
- SECRET_LISTMONK_USER
- NEXT_PUBLIC_WG_API="fly.io wundergraph api domain f.e. https://app-name-xyz.fly.dev"

3. Connect your domain.
