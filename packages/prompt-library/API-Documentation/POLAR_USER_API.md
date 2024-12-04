users
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