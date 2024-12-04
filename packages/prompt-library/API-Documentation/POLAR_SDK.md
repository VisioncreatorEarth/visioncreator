
@polar-sh/sdk
Developer-friendly & type-safe Typescript SDK specifically catered to leverage Polar API.

 
Warning

Starting version >v0.6.0, we changed our SDK generator. It's not backward compatible with previous versions.

Summary
Polar API: Polar HTTP and Webhooks API

Read the docs at https://docs.polar.sh/api

Table of Contents
@polar-sh/sdk
SDK Installation
Requirements
SDK Example Usage
Available Resources and Operations
Standalone functions
Pagination
Retries
Error Handling
Server Selection
Custom HTTP Client
Authentication
Debugging
Development
Maturity
Contributions
SDK Installation
The SDK can be installed with either npm, pnpm, bun or yarn package managers.

NPM
npm add @polar-sh/sdk
PNPM
pnpm add @polar-sh/sdk
Bun
bun add @polar-sh/sdk
Yarn
yarn add @polar-sh/sdk zod

# Note that Yarn does not install peer dependencies automatically. You will need
# to install zod as shown above.
Requirements
For supported JavaScript runtimes, please consult RUNTIMES.md.

SDK Example Usage
Example
import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env["POLAR_ACCESS_TOKEN"] ?? "",
});

async function run() {
  const result = await polar.users.benefits.list({});

  for await (const page of result) {
    // Handle the page
    console.log(page);
  }
}

run();
Webhook support
The SDK has built-in support to validate webhook events. Here is an example with Express.js:

import express, { Request, Response } from "express";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";

const app = express();

app.post("/webhook", express.raw({ type: "application/json" }), (req: Request, res: Response) => {
  try {
    const event = validateEvent(req.body, req.headers, process.env["POLAR_WEBHOOK_SECRET"] ?? "");

    // Process the event

    res.status(202).send('')
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      res.status(403).send('')
    }
    throw error
  }
});
Available Resources and Operations
Available methods
advertisements
list - List Campaigns
get - Get Campaign
articles
list - List Articles
create - Create Article
export - Export Articles
get - Get Article
update - Update Article
delete - Delete Article
receivers - Get Article Receivers Count
preview - Send Article Preview
send - Send Article
benefits
list - List Benefits
create - Create Benefit
get - Get Benefit
update - Update Benefit
delete - Delete Benefit
grants - List Benefit Grants
checkoutLinks
list - List Checkout Links
create - Create Checkout Link
get - Get Checkout Link
update - Update Checkout Link
delete - Delete Checkout Link
checkouts
create - Create Checkout ⚠️ Deprecated Use create instead.
get - Get Checkout ⚠️ Deprecated
checkouts.custom
list - List Checkout Sessions
create - Create Checkout Session
get - Get Checkout Session
update - Update Checkout Session
clientGet - Get Checkout Session from Client
clientUpdate - Update Checkout Session from Client
clientConfirm - Confirm Checkout Session from Client
customFields
list - List Custom Fields
create - Create Custom Field
get - Get Custom Field
update - Update Custom Field
delete - Delete Custom Field
discounts
list - List Discounts
create - Create Discount
get - Get Discount
update - Update Discount
delete - Delete Discount
externalOrganizations
list - List External Organizations
files
list - List Files
create - Create File
uploaded - Complete File Upload
update - Update File
delete - Delete File
licenseKeys
list - List License Keys
get - Get License Key
update - Update License Key
getActivation - Get Activation
metrics
get - Get Metrics
limits - Get Metrics Limits
oauth2
authorize - Authorize
token - Request Token
revoke - Revoke Token
introspect - Introspect Token
userinfo - Get User Info
oauth2.clients
list - List Clients
create - Create Client
get - Get Client
update - Update Client
delete - Delete Client
orders
list - List Orders
get - Get Order
invoice - Get Order Invoice
organizations
list - List Organizations
create - Create Organization
get - Get Organization
update - Update Organization
products
list - List Products
create - Create Product
get - Get Product
update - Update Product
updateBenefits - Update Product Benefits
repositories
list - List Repositories
get - Get Repository
update - Update Repository
subscriptions
list - List Subscriptions
export - Export Subscriptions
users
users.advertisements
list - List Advertisements
create - Create Advertisement
get - Get Advertisement
update - Update Advertisement
delete - Delete Advertisement
enable - Enable Advertisement
users.benefits
list - List Benefits
get - Get Benefit
users.downloadables
list - List Downloadables
get - Get Downloadable
users.licenseKeys
list - List License Keys
get - Get License Key
validate - Validate License Key
activate - Activate License Key
deactivate - Deactivate License Key
users.orders
list - List Orders
get - Get Order
invoice - Get Order Invoice
users.subscriptions
list - List Subscriptions
get - Get Subscription
update - Update Subscription
cancel - Cancel Subscription
Standalone functions
All the methods listed above are available as standalone functions. These functions are ideal for use in applications running in the browser, serverless runtimes or other environments where application bundle size is a primary concern. When using a bundler to build your application, all unused functionality will be either excluded from the final bundle or tree-shaken away.

To read more about standalone functions, check FUNCTIONS.md.

Available standalone functions
Pagination
Some of the endpoints in this SDK support pagination. To use pagination, you make your SDK calls as usual, but the returned response object will also be an async iterable that can be consumed using the for await...of syntax.

Here's an example of one such pagination call:

import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env["POLAR_ACCESS_TOKEN"] ?? "",
});

async function run() {
  const result = await polar.users.benefits.list({});

  for await (const page of result) {
    // Handle the page
    console.log(page);
  }
}

run();
Retries
Some of the endpoints in this SDK support retries. If you use the SDK without any configuration, it will fall back to the default retry strategy provided by the API. However, the default retry strategy can be overridden on a per-operation basis, or across the entire SDK.

To change the default retry strategy for a single API call, simply provide a retryConfig object to the call:

import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env["POLAR_ACCESS_TOKEN"] ?? "",
});

async function run() {
  const result = await polar.users.benefits.list({}, {
    retries: {
      strategy: "backoff",
      backoff: {
        initialInterval: 1,
        maxInterval: 50,
        exponent: 1.1,
        maxElapsedTime: 100,
      },
      retryConnectionErrors: false,
    },
  });

  for await (const page of result) {
    // Handle the page
    console.log(page);
  }
}

run();
If you'd like to override the default retry strategy for all operations that support retries, you can provide a retryConfig at SDK initialization:

import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  retryConfig: {
    strategy: "backoff",
    backoff: {
      initialInterval: 1,
      maxInterval: 50,
      exponent: 1.1,
      maxElapsedTime: 100,
    },
    retryConnectionErrors: false,
  },
  accessToken: process.env["POLAR_ACCESS_TOKEN"] ?? "",
});

async function run() {
  const result = await polar.users.benefits.list({});

  for await (const page of result) {
    // Handle the page
    console.log(page);
  }
}

run();
Error Handling
All SDK methods return a response object or throw an error. By default, an API error will throw a errors.SDKError.

If a HTTP request fails, an operation my also throw an error from the models/errors/httpclienterrors.ts module:

HTTP Client Error	Description
RequestAbortedError	HTTP request was aborted by the client
RequestTimeoutError	HTTP request timed out due to an AbortSignal signal
ConnectionError	HTTP client was unable to make a request to a server
InvalidRequestError	Any input used to create a request is invalid
UnexpectedClientError	Unrecognised or unexpected error
In addition, when custom error responses are specified for an operation, the SDK may throw their associated Error type. You can refer to respective Errors tables in SDK docs for more details on possible error types for each operation. For example, the list method may throw the following errors:

Error Type	Status Code	Content Type
errors.HTTPValidationError	422	application/json
errors.SDKError	4XX, 5XX	*/*
import { Polar } from "@polar-sh/sdk";
import {
  HTTPValidationError,
  SDKValidationError,
} from "@polar-sh/sdk/models/errors";

const polar = new Polar({
  accessToken: process.env["POLAR_ACCESS_TOKEN"] ?? "",
});

async function run() {
  let result;
  try {
    result = await polar.users.benefits.list({});

    for await (const page of result) {
      // Handle the page
      console.log(page);
    }
  } catch (err) {
    switch (true) {
      case (err instanceof SDKValidationError): {
        // Validation errors can be pretty-printed
        console.error(err.pretty());
        // Raw value may also be inspected
        console.error(err.rawValue);
        return;
      }
      case (err instanceof HTTPValidationError): {
        // Handle err.data$: HTTPValidationErrorData
        console.error(err);
        return;
      }
      default: {
        throw err;
      }
    }
  }
}

run();
Validation errors can also occur when either method arguments or data returned from the server do not match the expected format. The SDKValidationError that is thrown as a result will capture the raw value that failed validation in an attribute called rawValue. Additionally, a pretty() method is available on this error that can be used to log a nicely formatted string since validation errors can list many issues and the plain error string may be difficult read when debugging.

Server Selection
Select Server by Name
You can override the default server globally by passing a server name to the server: keyof typeof ServerList optional parameter when initializing the SDK client instance. The selected server will then be used as the default on the operations that use it. This table lists the names associated with the available servers:

Name	Server
production	https://api.polar.sh
sandbox	https://sandbox-api.polar.sh
Example
import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  server: "sandbox",
  accessToken: process.env["POLAR_ACCESS_TOKEN"] ?? "",
});

async function run() {
  const result = await polar.users.benefits.list({});

  for await (const page of result) {
    // Handle the page
    console.log(page);
  }
}

run();
Override Server URL Per-Client
The default server can also be overridden globally by passing a URL to the serverURL: string optional parameter when initializing the SDK client instance. For example:

import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  serverURL: "https://api.polar.sh",
  accessToken: process.env["POLAR_ACCESS_TOKEN"] ?? "",
});

async function run() {
  const result = await polar.users.benefits.list({});

  for await (const page of result) {
    // Handle the page
    console.log(page);
  }
}

run();
Custom HTTP Client
The TypeScript SDK makes API calls using an HTTPClient that wraps the native Fetch API. This client is a thin wrapper around fetch and provides the ability to attach hooks around the request lifecycle that can be used to modify the request or handle errors and response.

The HTTPClient constructor takes an optional fetcher argument that can be used to integrate a third-party HTTP client or when writing tests to mock out the HTTP client and feed in fixtures.

The following example shows how to use the "beforeRequest" hook to to add a custom header and a timeout to requests and how to use the "requestError" hook to log errors:

import { Polar } from "@polar-sh/sdk";
import { HTTPClient } from "@polar-sh/sdk/lib/http";

const httpClient = new HTTPClient({
  // fetcher takes a function that has the same signature as native `fetch`.
  fetcher: (request) => {
    return fetch(request);
  }
});

httpClient.addHook("beforeRequest", (request) => {
  const nextRequest = new Request(request, {
    signal: request.signal || AbortSignal.timeout(5000)
  });

  nextRequest.headers.set("x-custom-header", "custom value");

  return nextRequest;
});

httpClient.addHook("requestError", (error, request) => {
  console.group("Request Error");
  console.log("Reason:", `${error}`);
  console.log("Endpoint:", `${request.method} ${request.url}`);
  console.groupEnd();
});

const sdk = new Polar({ httpClient });
Authentication
Per-Client Security Schemes
This SDK supports the following security scheme globally:

Name	Type	Scheme	Environment Variable
accessToken	http	HTTP Bearer	POLAR_ACCESS_TOKEN
To authenticate with the API the accessToken parameter must be set when initializing the SDK client instance. For example:

import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env["POLAR_ACCESS_TOKEN"] ?? "",
});

async function run() {
  const result = await polar.users.benefits.list({});

  for await (const page of result) {
    // Handle the page
    console.log(page);
  }
}

run();
Debugging
You can setup your SDK to emit debug logs for SDK requests and responses.

You can pass a logger that matches console's interface as an SDK option.

Warning

Beware that debug logging will reveal secrets, like API tokens in headers, in log messages printed to a console or files. It's recommended to use this feature only during local development and not in production.

import { Polar } from "@polar-sh/sdk";

const sdk = new Polar({ debugLogger: console });
You can also enable a default debug logger by setting an environment variable POLAR_DEBUG to true.

Development
Maturity
This SDK is in beta, and there may be breaking changes between versions without a major version update. Therefore, we recommend pinning usage to a specific package version. This way, you can install the same version each time without breaking changes unless you are intentionally looking for the latest version.

Contributions
While we value open-source contributions to this SDK, this library is generated programmatically. Any manual changes added to internal files will be overwritten on the next generation. We look forward to hearing your feedback. Feel free to open a PR or an issue with a proof of concept and we'll do our best to include it in a future release.

SDK Created by Speakeasy
About
Polar SDK for Node.js and browsers

Resources
 Readme
 Activity
 Custom properties
Stars
 27 stars
Watchers
 2 watching
Forks
 2 forks
Report repository
Releases 28
typescript - v0.17.4 - 2024-12-02 10:40:51
Latest
2 days ago
+ 27 releases
Packages
No packages published
Contributors
2
@speakeasybot
speakeasybot Speakeasy Bot
@frankie567
frankie567 François Voron
Languages
TypeScript
100.0%
Footer
© 2024 GitHub, Inc.
Footer navigation


users API
List Orders
get
/v1/users/orders/
List my orders.
Authentication
Methods
OpenID Connect
Personal Access Token
Subjects
User
Scopes
user:orders:read
Parameters
organization_id
query Parameter
uuid4
|
uuid4[]
|
null
Optional
Filter by organization ID.
product_id
query Parameter
uuid4
|
uuid4[]
|
null
Optional
Filter by product ID.
product_price_type
query Parameter
"one_time" | "recurring"
|
"one_time" | "recurring"[]
|
null
Optional
Filter by product price type. recurring will return orders corresponding to subscriptions creations or renewals. one_time will return orders corresponding to one-time purchases.
subscription_id
query Parameter
uuid4
|
uuid4[]
|
null
Optional
Filter by subscription ID.
query
query Parameter
string
|
null
Optional
Search by product or organization name.
page
query Parameter
integer
Default: 1
Optional
Page number, defaults to 1.
limit
query Parameter
integer
Default: 10
Optional
Size of a page, defaults to 10. Maximum is 100.
sorting
query Parameter
"created_at" | "-created_at" | "amount" | "-amount" | "organization" | "-organization" | "product" | "-product" | "subscription" | "-subscription"[]
|
null
Default: -created_at
Optional
Sorting criterion. Several criteria can be used simultaneously and will be applied in order. Add a minus sign - before the criteria name to sort by descending order.
Responses
200
422


users
Get Order
get
/v1/users/orders/{id}
Get an order by ID.
Authentication
Methods
OpenID Connect
Personal Access Token
Subjects
User
Scopes
user:orders:read
Parameters
id
path Parameter
uuid4
Required
The order ID.
Responses
200
404
422


users
Get Order Invoice
get
/v1/users/orders/{id}/invoice
Get an order's invoice data.
Authentication
Methods
OpenID Connect
Personal Access Token
Subjects
User
Scopes
user:orders:read
Parameters
id
path Parameter
uuid4
Required
The order ID.
Responses
200
404
422


users
List Subscriptions
get
/v1/users/subscriptions/
List my subscriptions.
Authentication
Methods
OpenID Connect
Personal Access Token
Subjects
User
Scopes
user:subscriptions:read
Parameters
organization_id
query Parameter
uuid4
|
uuid4[]
|
null
Optional
Filter by organization ID.
product_id
query Parameter
uuid4
|
uuid4[]
|
null
Optional
Filter by product ID.
active
query Parameter
boolean
|
null
Optional
Filter by active or cancelled subscription.
query
query Parameter
string
|
null
Optional
Search by product or organization name.
page
query Parameter
integer
Default: 1
Optional
Page number, defaults to 1.
limit
query Parameter
integer
Default: 10
Optional
Size of a page, defaults to 10. Maximum is 100.
sorting
query Parameter
"started_at" | "-started_at" | "amount" | "-amount" | "status" | "-status" | "organization" | "-organization" | "product" | "-product"[]
|
null
Default: -started_at
Optional
Sorting criterion. Several criteria can be used simultaneously and will be applied in order. Add a minus sign - before the criteria name to sort by descending order.
Responses
200
422


users
Get Subscription
get
/v1/users/subscriptions/{id}
Get a subscription by ID.
Authentication
Methods
OpenID Connect
Personal Access Token
Subjects
User
Scopes
user:subscriptions:read
Parameters
id
path Parameter
uuid4
Required
The subscription ID.
Responses
200
404
422


users
Cancel Subscription
delete
/v1/users/subscriptions/{id}
Cancel a subscription.
Authentication
Methods
OpenID Connect
Personal Access Token
Subjects
User
Scopes
user:subscriptions:write
Parameters
id
path Parameter
uuid4
Required
The subscription ID.
Responses
200
403
404
422


users
Update Subscription
patch
/v1/users/subscriptions/{id}
Update a subscription.
Authentication
Methods
OpenID Connect
Personal Access Token
Subjects
User
Scopes
user:subscriptions:write
Parameters
id
path Parameter
uuid4
Required
The subscription ID.
Request Body
product_price_id
uuid4
Required
Responses
200
404
422