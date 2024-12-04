Webhooks
Webhooks allow you to build or set up integrations that subscribe to certain Polar events. When one of those events is triggered, we'll send an HTTP POST payload to the webhook's configured URL.

Our implementation follow the Standard Webhooks specification.

Out-of-the-box, we also support to send notifications suitable for Discord or Slack. This is the purpose of the Format parameter.

Configuring a Webhook
Head over to your organization's settings page and click on the "Add Endpoint" button to create a new webhook.

Add Webhook Endpoint

URL
In the dialog that appears, enter the URL to which the webhook events should be sent.

Add URL

Format
For standard, custom integrations, leave this parameter on Raw. This will send a payload in a JSON format as described in the Events section.

If you wish to send notifications to a Discord or Slack channel, you can select the corresponding format here. Polar will then adapt the payload so properly formatted messages are sent to your channel.

Select format

tip
If you paste a Discord or Slack webhook URL, the format will be automatically selected.

Secret
In order to verify that requests are legitimate webhook payload coming from Polar, we cryptographically sign the requests using a secret key. You can set your own or generate a random one.

Add Secret

Events
Finally, select the events you want to be notified about. You can read more about the available events in the Events section.

Webhook Delivery
Once a webhook is configured, you will have access to a delivery overview page. This page shows you all the webhook events that have been sent to the configured URL. You can easily see the status of each delivery and the data which was sent.

Delivery

Retries
If we hit an error while trying to reach your endpoint, whether it is a temporary network error or a bug, we'll retry to send the event up to 10 times with an exponential backoff.

Timeouts
We expect your endpoint to answer under 20 seconds. Past this delay, the delivery will error and we'll enter the retry cycle described above. We recommend you to avoid too long processing while receiving the webhook. The good practice if you have long logic to run is to queue the event and respond to the webhook immediately. Your logic is then run in a background by a worker.

Verify signature
Requests sent to your webhook endpoint will include a signature so you can verify that the request is truly coming from Polar.

Our Python and JavaScript SDK provide a function to validate and parse the webhook event.

Python example

from flask import Flask, request
from polar_sdk.webhooks import validate_event, WebhookVerificationError

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    try:
        event = validate_event(
            payload=request.data,
            headers=request.headers,
            secret='<YOUR_WEBHOOK_SECRET>',
        )

        # Process the event

        return "", 202
    except WebhookVerificationError as e:
        return "", 403
Node.js example

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
For other languages, as we follow the Standard Webhooks specification, you can use one of their libraries to verify the signature: https://github.com/standard-webhooks/standard-webhooks/tree/main/libraries

warning
When using the Standard Webhooks libraries, they expect your secret to be encoded in Base64 first.

For a more in-depth implementation example, look at the Polar NextJS Webhooks example.


checkout.created
Sent when a new checkout is created.

Discord & Slack support: Basic

Raw format payload

{
  "type": "checkout.created",
  "data": {
    "created_at": "2024-12-03T00:00:00.000Z",
    "modified_at": "2024-12-03T00:00:00.000Z",
    "id": "00000000-0000-0000-0000-000000000000",
    "custom_field_data": {},
    "payment_processor": "stripe",
    "status": "open",
    "client_secret": "string",
    "url": "string",
    "expires_at": "2024-12-03T00:00:00.000Z",
    "success_url": "string",
    "embed_origin": "string",
    "amount": 0,
    "tax_amount": 0,
    "currency": "string",
    "subtotal_amount": 0,
    "total_amount": 0,
    "product_id": "00000000-0000-0000-0000-000000000000",
    "product_price_id": "00000000-0000-0000-0000-000000000000",
    "discount_id": "00000000-0000-0000-0000-000000000000",
    "allow_discount_codes": false,
    "is_discount_applicable": false,
    "is_free_product_price": false,
    "is_payment_required": false,
    "is_payment_setup_required": false,
    "is_payment_form_required": false,
    "customer_id": "00000000-0000-0000-0000-000000000000",
    "customer_name": "string",
    "customer_email": "string",
    "customer_ip_address": "string",
    "customer_billing_address": {
      "line1": "string",
      "line2": "string",
      "postal_code": "string",
      "city": "string",
      "state": "string",
      "country": "string"
    },
    "customer_tax_id": "string",
    "payment_processor_metadata": {},
    "metadata": {},
    "product": {
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "name": "string",
      "description": "string",
      "is_recurring": false,
      "is_archived": false,
      "organization_id": "00000000-0000-0000-0000-000000000000",
      "prices": [
        {
          "created_at": "2024-12-03T00:00:00.000Z",
          "modified_at": "2024-12-03T00:00:00.000Z",
          "id": "00000000-0000-0000-0000-000000000000",
          "amount_type": "fixed",
          "is_archived": false,
          "product_id": "00000000-0000-0000-0000-000000000000",
          "price_currency": "string",
          "price_amount": 0,
          "type": "recurring",
          "recurring_interval": "month"
        }
      ],
      "benefits": [
        {
          "created_at": "2024-12-03T00:00:00.000Z",
          "modified_at": "2024-12-03T00:00:00.000Z",
          "id": "00000000-0000-0000-0000-000000000000",
          "type": "custom",
          "description": "string",
          "selectable": false,
          "deletable": false,
          "organization_id": "00000000-0000-0000-0000-000000000000"
        }
      ],
      "medias": [
        {
          "id": "00000000-0000-0000-0000-000000000000",
          "organization_id": "00000000-0000-0000-0000-000000000000",
          "name": "string",
          "path": "string",
          "mime_type": "string",
          "size": 0,
          "storage_version": "string",
          "checksum_etag": "string",
          "checksum_sha256_base64": "string",
          "checksum_sha256_hex": "string",
          "last_modified_at": "2024-12-03T00:00:00.000Z",
          "version": "string",
          "service": "product_media",
          "is_uploaded": false,
          "created_at": "2024-12-03T00:00:00.000Z",
          "size_readable": "string",
          "public_url": "string"
        }
      ]
    },
    "product_price": {
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "amount_type": "fixed",
      "is_archived": false,
      "product_id": "00000000-0000-0000-0000-000000000000",
      "price_currency": "string",
      "price_amount": 0,
      "type": "recurring",
      "recurring_interval": "month"
    },
    "discount": {
      "duration": "once",
      "type": "fixed",
      "amount": 0,
      "currency": "string",
      "id": "00000000-0000-0000-0000-000000000000",
      "name": "string",
      "code": "string"
    },
    "subscription_id": "00000000-0000-0000-0000-000000000000",
    "attached_custom_fields": [
      {
        "custom_field_id": "00000000-0000-0000-0000-000000000000",
        "custom_field": {
          "created_at": "2024-12-03T00:00:00.000Z",
          "modified_at": "2024-12-03T00:00:00.000Z",
          "id": "00000000-0000-0000-0000-000000000000",
          "metadata": {},
          "type": "text",
          "slug": "string",
          "name": "string",
          "organization_id": "00000000-0000-0000-0000-000000000000",
          "properties": {
            "form_label": "string",
            "form_help_text": "string",
            "form_placeholder": "string",
            "textarea": false,
            "min_length": 0,
            "max_length": 0
          }
        },
        "order": 0,
        "required": false
      }
    ]
  }
}

checkout.updated
Sent when a checkout is updated.

Discord & Slack support: Basic

Raw format payload

{
  "type": "checkout.updated",
  "data": {
    "created_at": "2024-12-03T00:00:00.000Z",
    "modified_at": "2024-12-03T00:00:00.000Z",
    "id": "00000000-0000-0000-0000-000000000000",
    "custom_field_data": {},
    "payment_processor": "stripe",
    "status": "open",
    "client_secret": "string",
    "url": "string",
    "expires_at": "2024-12-03T00:00:00.000Z",
    "success_url": "string",
    "embed_origin": "string",
    "amount": 0,
    "tax_amount": 0,
    "currency": "string",
    "subtotal_amount": 0,
    "total_amount": 0,
    "product_id": "00000000-0000-0000-0000-000000000000",
    "product_price_id": "00000000-0000-0000-0000-000000000000",
    "discount_id": "00000000-0000-0000-0000-000000000000",
    "allow_discount_codes": false,
    "is_discount_applicable": false,
    "is_free_product_price": false,
    "is_payment_required": false,
    "is_payment_setup_required": false,
    "is_payment_form_required": false,
    "customer_id": "00000000-0000-0000-0000-000000000000",
    "customer_name": "string",
    "customer_email": "string",
    "customer_ip_address": "string",
    "customer_billing_address": {
      "line1": "string",
      "line2": "string",
      "postal_code": "string",
      "city": "string",
      "state": "string",
      "country": "string"
    },
    "customer_tax_id": "string",
    "payment_processor_metadata": {},
    "metadata": {},
    "product": {
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "name": "string",
      "description": "string",
      "is_recurring": false,
      "is_archived": false,
      "organization_id": "00000000-0000-0000-0000-000000000000",
      "prices": [
        {
          "created_at": "2024-12-03T00:00:00.000Z",
          "modified_at": "2024-12-03T00:00:00.000Z",
          "id": "00000000-0000-0000-0000-000000000000",
          "amount_type": "fixed",
          "is_archived": false,
          "product_id": "00000000-0000-0000-0000-000000000000",
          "price_currency": "string",
          "price_amount": 0,
          "type": "recurring",
          "recurring_interval": "month"
        }
      ],
      "benefits": [
        {
          "created_at": "2024-12-03T00:00:00.000Z",
          "modified_at": "2024-12-03T00:00:00.000Z",
          "id": "00000000-0000-0000-0000-000000000000",
          "type": "custom",
          "description": "string",
          "selectable": false,
          "deletable": false,
          "organization_id": "00000000-0000-0000-0000-000000000000"
        }
      ],
      "medias": [
        {
          "id": "00000000-0000-0000-0000-000000000000",
          "organization_id": "00000000-0000-0000-0000-000000000000",
          "name": "string",
          "path": "string",
          "mime_type": "string",
          "size": 0,
          "storage_version": "string",
          "checksum_etag": "string",
          "checksum_sha256_base64": "string",
          "checksum_sha256_hex": "string",
          "last_modified_at": "2024-12-03T00:00:00.000Z",
          "version": "string",
          "service": "product_media",
          "is_uploaded": false,
          "created_at": "2024-12-03T00:00:00.000Z",
          "size_readable": "string",
          "public_url": "string"
        }
      ]
    },
    "product_price": {
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "amount_type": "fixed",
      "is_archived": false,
      "product_id": "00000000-0000-0000-0000-000000000000",
      "price_currency": "string",
      "price_amount": 0,
      "type": "recurring",
      "recurring_interval": "month"
    },
    "discount": {
      "duration": "once",
      "type": "fixed",
      "amount": 0,
      "currency": "string",
      "id": "00000000-0000-0000-0000-000000000000",
      "name": "string",
      "code": "string"
    },
    "subscription_id": "00000000-0000-0000-0000-000000000000",
    "attached_custom_fields": [
      {
        "custom_field_id": "00000000-0000-0000-0000-000000000000",
        "custom_field": {
          "created_at": "2024-12-03T00:00:00.000Z",
          "modified_at": "2024-12-03T00:00:00.000Z",
          "id": "00000000-0000-0000-0000-000000000000",
          "metadata": {},
          "type": "text",
          "slug": "string",
          "name": "string",
          "organization_id": "00000000-0000-0000-0000-000000000000",
          "properties": {
            "form_label": "string",
            "form_help_text": "string",
            "form_placeholder": "string",
            "textarea": false,
            "min_length": 0,
            "max_length": 0
          }
        },
        "order": 0,
        "required": false
      }
    ]
  }
}


order.created
Sent when a new order is created.

Discord & Slack support: Full

Raw format payload

{
  "type": "order.created",
  "data": {
    "created_at": "2024-12-03T00:00:00.000Z",
    "modified_at": "2024-12-03T00:00:00.000Z",
    "id": "00000000-0000-0000-0000-000000000000",
    "metadata": {},
    "custom_field_data": {},
    "amount": 0,
    "tax_amount": 0,
    "currency": "string",
    "billing_reason": "purchase",
    "billing_address": {
      "line1": "string",
      "line2": "string",
      "postal_code": "string",
      "city": "string",
      "state": "string",
      "country": "string"
    },
    "user_id": "00000000-0000-0000-0000-000000000000",
    "product_id": "00000000-0000-0000-0000-000000000000",
    "product_price_id": "00000000-0000-0000-0000-000000000000",
    "discount_id": "00000000-0000-0000-0000-000000000000",
    "subscription_id": "00000000-0000-0000-0000-000000000000",
    "checkout_id": "00000000-0000-0000-0000-000000000000",
    "user": {
      "id": "00000000-0000-0000-0000-000000000000",
      "email": "string",
      "public_name": "string",
      "github_username": "string",
      "avatar_url": "string"
    },
    "product": {
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "name": "string",
      "description": "string",
      "is_recurring": false,
      "is_archived": false,
      "organization_id": "00000000-0000-0000-0000-000000000000"
    },
    "product_price": {
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "amount_type": "fixed",
      "is_archived": false,
      "product_id": "00000000-0000-0000-0000-000000000000",
      "price_currency": "string",
      "price_amount": 0,
      "type": "recurring",
      "recurring_interval": "month"
    },
    "discount": {
      "duration": "once",
      "type": "fixed",
      "amount": 0,
      "currency": "string",
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "metadata": {},
      "name": "string",
      "code": "string",
      "starts_at": "2024-12-03T00:00:00.000Z",
      "ends_at": "2024-12-03T00:00:00.000Z",
      "max_redemptions": 0,
      "redemptions_count": 0,
      "organization_id": "00000000-0000-0000-0000-000000000000"
    },
    "subscription": {
      "metadata": {},
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "amount": 0,
      "currency": "string",
      "recurring_interval": "month",
      "status": "incomplete",
      "current_period_start": "2024-12-03T00:00:00.000Z",
      "current_period_end": "2024-12-03T00:00:00.000Z",
      "cancel_at_period_end": false,
      "started_at": "2024-12-03T00:00:00.000Z",
      "ended_at": "2024-12-03T00:00:00.000Z",
      "user_id": "00000000-0000-0000-0000-000000000000",
      "product_id": "00000000-0000-0000-0000-000000000000",
      "price_id": "00000000-0000-0000-0000-000000000000",
      "discount_id": "00000000-0000-0000-0000-000000000000",
      "checkout_id": "00000000-0000-0000-0000-000000000000"
    }
  }
}



subscription.active
Sent when a subscription becomes active, whether because it's a new paid subscription or because payment was recovered.

Discord & Slack support: Full

Raw format payload

{
  "type": "subscription.active",
  "data": {
    "created_at": "2024-12-03T00:00:00.000Z",
    "modified_at": "2024-12-03T00:00:00.000Z",
    "id": "00000000-0000-0000-0000-000000000000",
    "amount": 0,
    "currency": "string",
    "recurring_interval": "month",
    "status": "incomplete",
    "current_period_start": "2024-12-03T00:00:00.000Z",
    "current_period_end": "2024-12-03T00:00:00.000Z",
    "cancel_at_period_end": false,
    "started_at": "2024-12-03T00:00:00.000Z",
    "ended_at": "2024-12-03T00:00:00.000Z",
    "user_id": "00000000-0000-0000-0000-000000000000",
    "product_id": "00000000-0000-0000-0000-000000000000",
    "price_id": "00000000-0000-0000-0000-000000000000",
    "discount_id": "00000000-0000-0000-0000-000000000000",
    "checkout_id": "00000000-0000-0000-0000-000000000000",
    "metadata": {},
    "custom_field_data": {},
    "user": {
      "email": "string",
      "public_name": "string",
      "github_username": "string",
      "avatar_url": "string"
    },
    "product": {
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "name": "string",
      "description": "string",
      "is_recurring": false,
      "is_archived": false,
      "organization_id": "00000000-0000-0000-0000-000000000000",
      "metadata": {},
      "prices": [
        {
          "created_at": "2024-12-03T00:00:00.000Z",
          "modified_at": "2024-12-03T00:00:00.000Z",
          "id": "00000000-0000-0000-0000-000000000000",
          "amount_type": "fixed",
          "is_archived": false,
          "product_id": "00000000-0000-0000-0000-000000000000",
          "price_currency": "string",
          "price_amount": 0,
          "type": "recurring",
          "recurring_interval": "month"
        }
      ],
      "benefits": [
        {
          "created_at": "2024-12-03T00:00:00.000Z",
          "modified_at": "2024-12-03T00:00:00.000Z",
          "id": "00000000-0000-0000-0000-000000000000",
          "type": "articles",
          "description": "string",
          "selectable": false,
          "deletable": false,
          "organization_id": "00000000-0000-0000-0000-000000000000",
          "properties": {
            "paid_articles": false
          }
        }
      ],
      "medias": [
        {
          "id": "00000000-0000-0000-0000-000000000000",
          "organization_id": "00000000-0000-0000-0000-000000000000",
          "name": "string",
          "path": "string",
          "mime_type": "string",
          "size": 0,
          "storage_version": "string",
          "checksum_etag": "string",
          "checksum_sha256_base64": "string",
          "checksum_sha256_hex": "string",
          "last_modified_at": "2024-12-03T00:00:00.000Z",
          "version": "string",
          "service": "product_media",
          "is_uploaded": false,
          "created_at": "2024-12-03T00:00:00.000Z",
          "size_readable": "string",
          "public_url": "string"
        }
      ],
      "attached_custom_fields": [
        {
          "custom_field_id": "00000000-0000-0000-0000-000000000000",
          "custom_field": {
            "created_at": "2024-12-03T00:00:00.000Z",
            "modified_at": "2024-12-03T00:00:00.000Z",
            "id": "00000000-0000-0000-0000-000000000000",
            "metadata": {},
            "type": "text",
            "slug": "string",
            "name": "string",
            "organization_id": "00000000-0000-0000-0000-000000000000",
            "properties": {
              "form_label": "string",
              "form_help_text": "string",
              "form_placeholder": "string",
              "textarea": false,
              "min_length": 0,
              "max_length": 0
            }
          },
          "order": 0,
          "required": false
        }
      ]
    },
    "price": {
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "amount_type": "fixed",
      "is_archived": false,
      "product_id": "00000000-0000-0000-0000-000000000000",
      "price_currency": "string",
      "price_amount": 0,
      "type": "recurring",
      "recurring_interval": "month"
    },
    "discount": {
      "duration": "once",
      "type": "fixed",
      "amount": 0,
      "currency": "string",
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "metadata": {},
      "name": "string",
      "code": "string",
      "starts_at": "2024-12-03T00:00:00.000Z",
      "ends_at": "2024-12-03T00:00:00.000Z",
      "max_redemptions": 0,
      "redemptions_count": 0,
      "organization_id": "00000000-0000-0000-0000-000000000000"
    }
  }
}


subscription.canceled
Sent when a subscription is canceled by the user. They might still have access until the end of the current period.

Discord & Slack support: Full

Raw format payload

{
  "type": "subscription.canceled",
  "data": {
    "created_at": "2024-12-03T00:00:00.000Z",
    "modified_at": "2024-12-03T00:00:00.000Z",
    "id": "00000000-0000-0000-0000-000000000000",
    "amount": 0,
    "currency": "string",
    "recurring_interval": "month",
    "status": "incomplete",
    "current_period_start": "2024-12-03T00:00:00.000Z",
    "current_period_end": "2024-12-03T00:00:00.000Z",
    "cancel_at_period_end": false,
    "started_at": "2024-12-03T00:00:00.000Z",
    "ended_at": "2024-12-03T00:00:00.000Z",
    "user_id": "00000000-0000-0000-0000-000000000000",
    "product_id": "00000000-0000-0000-0000-000000000000",
    "price_id": "00000000-0000-0000-0000-000000000000",
    "discount_id": "00000000-0000-0000-0000-000000000000",
    "checkout_id": "00000000-0000-0000-0000-000000000000",
    "metadata": {},
    "custom_field_data": {},
    "user": {
      "email": "string",
      "public_name": "string",
      "github_username": "string",
      "avatar_url": "string"
    },
    "product": {
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "name": "string",
      "description": "string",
      "is_recurring": false,
      "is_archived": false,
      "organization_id": "00000000-0000-0000-0000-000000000000",
      "metadata": {},
      "prices": [
        {
          "created_at": "2024-12-03T00:00:00.000Z",
          "modified_at": "2024-12-03T00:00:00.000Z",
          "id": "00000000-0000-0000-0000-000000000000",
          "amount_type": "fixed",
          "is_archived": false,
          "product_id": "00000000-0000-0000-0000-000000000000",
          "price_currency": "string",
          "price_amount": 0,
          "type": "recurring",
          "recurring_interval": "month"
        }
      ],
      "benefits": [
        {
          "created_at": "2024-12-03T00:00:00.000Z",
          "modified_at": "2024-12-03T00:00:00.000Z",
          "id": "00000000-0000-0000-0000-000000000000",
          "type": "articles",
          "description": "string",
          "selectable": false,
          "deletable": false,
          "organization_id": "00000000-0000-0000-0000-000000000000",
          "properties": {
            "paid_articles": false
          }
        }
      ],
      "medias": [
        {
          "id": "00000000-0000-0000-0000-000000000000",
          "organization_id": "00000000-0000-0000-0000-000000000000",
          "name": "string",
          "path": "string",
          "mime_type": "string",
          "size": 0,
          "storage_version": "string",
          "checksum_etag": "string",
          "checksum_sha256_base64": "string",
          "checksum_sha256_hex": "string",
          "last_modified_at": "2024-12-03T00:00:00.000Z",
          "version": "string",
          "service": "product_media",
          "is_uploaded": false,
          "created_at": "2024-12-03T00:00:00.000Z",
          "size_readable": "string",
          "public_url": "string"
        }
      ],
      "attached_custom_fields": [
        {
          "custom_field_id": "00000000-0000-0000-0000-000000000000",
          "custom_field": {
            "created_at": "2024-12-03T00:00:00.000Z",
            "modified_at": "2024-12-03T00:00:00.000Z",
            "id": "00000000-0000-0000-0000-000000000000",
            "metadata": {},
            "type": "text",
            "slug": "string",
            "name": "string",
            "organization_id": "00000000-0000-0000-0000-000000000000",
            "properties": {
              "form_label": "string",
              "form_help_text": "string",
              "form_placeholder": "string",
              "textarea": false,
              "min_length": 0,
              "max_length": 0
            }
          },
          "order": 0,
          "required": false
        }
      ]
    },
    "price": {
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "amount_type": "fixed",
      "is_archived": false,
      "product_id": "00000000-0000-0000-0000-000000000000",
      "price_currency": "string",
      "price_amount": 0,
      "type": "recurring",
      "recurring_interval": "month"
    },
    "discount": {
      "duration": "once",
      "type": "fixed",
      "amount": 0,
      "currency": "string",
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "metadata": {},
      "name": "string",
      "code": "string",
      "starts_at": "2024-12-03T00:00:00.000Z",
      "ends_at": "2024-12-03T00:00:00.000Z",
      "max_redemptions": 0,
      "redemptions_count": 0,
      "organization_id": "00000000-0000-0000-0000-000000000000"
    }
  }
}


subscription.created
Sent when a new subscription is created.

Discord & Slack support: Full

Raw format payload

{
  "type": "subscription.created",
  "data": {
    "created_at": "2024-12-03T00:00:00.000Z",
    "modified_at": "2024-12-03T00:00:00.000Z",
    "id": "00000000-0000-0000-0000-000000000000",
    "amount": 0,
    "currency": "string",
    "recurring_interval": "month",
    "status": "incomplete",
    "current_period_start": "2024-12-03T00:00:00.000Z",
    "current_period_end": "2024-12-03T00:00:00.000Z",
    "cancel_at_period_end": false,
    "started_at": "2024-12-03T00:00:00.000Z",
    "ended_at": "2024-12-03T00:00:00.000Z",
    "user_id": "00000000-0000-0000-0000-000000000000",
    "product_id": "00000000-0000-0000-0000-000000000000",
    "price_id": "00000000-0000-0000-0000-000000000000",
    "discount_id": "00000000-0000-0000-0000-000000000000",
    "checkout_id": "00000000-0000-0000-0000-000000000000",
    "metadata": {},
    "custom_field_data": {},
    "user": {
      "email": "string",
      "public_name": "string",
      "github_username": "string",
      "avatar_url": "string"
    },
    "product": {
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "name": "string",
      "description": "string",
      "is_recurring": false,
      "is_archived": false,
      "organization_id": "00000000-0000-0000-0000-000000000000",
      "metadata": {},
      "prices": [
        {
          "created_at": "2024-12-03T00:00:00.000Z",
          "modified_at": "2024-12-03T00:00:00.000Z",
          "id": "00000000-0000-0000-0000-000000000000",
          "amount_type": "fixed",
          "is_archived": false,
          "product_id": "00000000-0000-0000-0000-000000000000",
          "price_currency": "string",
          "price_amount": 0,
          "type": "recurring",
          "recurring_interval": "month"
        }
      ],
      "benefits": [
        {
          "created_at": "2024-12-03T00:00:00.000Z",
          "modified_at": "2024-12-03T00:00:00.000Z",
          "id": "00000000-0000-0000-0000-000000000000",
          "type": "articles",
          "description": "string",
          "selectable": false,
          "deletable": false,
          "organization_id": "00000000-0000-0000-0000-000000000000",
          "properties": {
            "paid_articles": false
          }
        }
      ],
      "medias": [
        {
          "id": "00000000-0000-0000-0000-000000000000",
          "organization_id": "00000000-0000-0000-0000-000000000000",
          "name": "string",
          "path": "string",
          "mime_type": "string",
          "size": 0,
          "storage_version": "string",
          "checksum_etag": "string",
          "checksum_sha256_base64": "string",
          "checksum_sha256_hex": "string",
          "last_modified_at": "2024-12-03T00:00:00.000Z",
          "version": "string",
          "service": "product_media",
          "is_uploaded": false,
          "created_at": "2024-12-03T00:00:00.000Z",
          "size_readable": "string",
          "public_url": "string"
        }
      ],
      "attached_custom_fields": [
        {
          "custom_field_id": "00000000-0000-0000-0000-000000000000",
          "custom_field": {
            "created_at": "2024-12-03T00:00:00.000Z",
            "modified_at": "2024-12-03T00:00:00.000Z",
            "id": "00000000-0000-0000-0000-000000000000",
            "metadata": {},
            "type": "text",
            "slug": "string",
            "name": "string",
            "organization_id": "00000000-0000-0000-0000-000000000000",
            "properties": {
              "form_label": "string",
              "form_help_text": "string",
              "form_placeholder": "string",
              "textarea": false,
              "min_length": 0,
              "max_length": 0
            }
          },
          "order": 0,
          "required": false
        }
      ]
    },
    "price": {
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "amount_type": "fixed",
      "is_archived": false,
      "product_id": "00000000-0000-0000-0000-000000000000",
      "price_currency": "string",
      "price_amount": 0,
      "type": "recurring",
      "recurring_interval": "month"
    },
    "discount": {
      "duration": "once",
      "type": "fixed",
      "amount": 0,
      "currency": "string",
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "metadata": {},
      "name": "string",
      "code": "string",
      "starts_at": "2024-12-03T00:00:00.000Z",
      "ends_at": "2024-12-03T00:00:00.000Z",
      "max_redemptions": 0,
      "redemptions_count": 0,
      "organization_id": "00000000-0000-0000-0000-000000000000"
    }
  }
}


subscription.revoked
Sent when a subscription is revoked, the user looses access immediately. Happens when the subscription is canceled, or payment is past due.

Discord & Slack support: Full

Raw format payload

{
  "type": "subscription.revoked",
  "data": {
    "created_at": "2024-12-03T00:00:00.000Z",
    "modified_at": "2024-12-03T00:00:00.000Z",
    "id": "00000000-0000-0000-0000-000000000000",
    "amount": 0,
    "currency": "string",
    "recurring_interval": "month",
    "status": "incomplete",
    "current_period_start": "2024-12-03T00:00:00.000Z",
    "current_period_end": "2024-12-03T00:00:00.000Z",
    "cancel_at_period_end": false,
    "started_at": "2024-12-03T00:00:00.000Z",
    "ended_at": "2024-12-03T00:00:00.000Z",
    "user_id": "00000000-0000-0000-0000-000000000000",
    "product_id": "00000000-0000-0000-0000-000000000000",
    "price_id": "00000000-0000-0000-0000-000000000000",
    "discount_id": "00000000-0000-0000-0000-000000000000",
    "checkout_id": "00000000-0000-0000-0000-000000000000",
    "metadata": {},
    "custom_field_data": {},
    "user": {
      "email": "string",
      "public_name": "string",
      "github_username": "string",
      "avatar_url": "string"
    },
    "product": {
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "name": "string",
      "description": "string",
      "is_recurring": false,
      "is_archived": false,
      "organization_id": "00000000-0000-0000-0000-000000000000",
      "metadata": {},
      "prices": [
        {
          "created_at": "2024-12-03T00:00:00.000Z",
          "modified_at": "2024-12-03T00:00:00.000Z",
          "id": "00000000-0000-0000-0000-000000000000",
          "amount_type": "fixed",
          "is_archived": false,
          "product_id": "00000000-0000-0000-0000-000000000000",
          "price_currency": "string",
          "price_amount": 0,
          "type": "recurring",
          "recurring_interval": "month"
        }
      ],
      "benefits": [
        {
          "created_at": "2024-12-03T00:00:00.000Z",
          "modified_at": "2024-12-03T00:00:00.000Z",
          "id": "00000000-0000-0000-0000-000000000000",
          "type": "articles",
          "description": "string",
          "selectable": false,
          "deletable": false,
          "organization_id": "00000000-0000-0000-0000-000000000000",
          "properties": {
            "paid_articles": false
          }
        }
      ],
      "medias": [
        {
          "id": "00000000-0000-0000-0000-000000000000",
          "organization_id": "00000000-0000-0000-0000-000000000000",
          "name": "string",
          "path": "string",
          "mime_type": "string",
          "size": 0,
          "storage_version": "string",
          "checksum_etag": "string",
          "checksum_sha256_base64": "string",
          "checksum_sha256_hex": "string",
          "last_modified_at": "2024-12-03T00:00:00.000Z",
          "version": "string",
          "service": "product_media",
          "is_uploaded": false,
          "created_at": "2024-12-03T00:00:00.000Z",
          "size_readable": "string",
          "public_url": "string"
        }
      ],
      "attached_custom_fields": [
        {
          "custom_field_id": "00000000-0000-0000-0000-000000000000",
          "custom_field": {
            "created_at": "2024-12-03T00:00:00.000Z",
            "modified_at": "2024-12-03T00:00:00.000Z",
            "id": "00000000-0000-0000-0000-000000000000",
            "metadata": {},
            "type": "text",
            "slug": "string",
            "name": "string",
            "organization_id": "00000000-0000-0000-0000-000000000000",
            "properties": {
              "form_label": "string",
              "form_help_text": "string",
              "form_placeholder": "string",
              "textarea": false,
              "min_length": 0,
              "max_length": 0
            }
          },
          "order": 0,
          "required": false
        }
      ]
    },
    "price": {
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "amount_type": "fixed",
      "is_archived": false,
      "product_id": "00000000-0000-0000-0000-000000000000",
      "price_currency": "string",
      "price_amount": 0,
      "type": "recurring",
      "recurring_interval": "month"
    },
    "discount": {
      "duration": "once",
      "type": "fixed",
      "amount": 0,
      "currency": "string",
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "metadata": {},
      "name": "string",
      "code": "string",
      "starts_at": "2024-12-03T00:00:00.000Z",
      "ends_at": "2024-12-03T00:00:00.000Z",
      "max_redemptions": 0,
      "redemptions_count": 0,
      "organization_id": "00000000-0000-0000-0000-000000000000"
    }
  }
}


subscription.updated
Sent when a subscription is updated. This event fires for all changes to the subscription, including renewals.

If you want more specific events, you can listen to subscription.active, subscription.canceled, and subscription.revoked.

To listen specifically for renewals, you can listen to order.created events and check the billing_reason field.

Discord & Slack support: On cancellation and revocation. Renewals are skipped.

Raw format payload

{
  "type": "subscription.updated",
  "data": {
    "created_at": "2024-12-03T00:00:00.000Z",
    "modified_at": "2024-12-03T00:00:00.000Z",
    "id": "00000000-0000-0000-0000-000000000000",
    "amount": 0,
    "currency": "string",
    "recurring_interval": "month",
    "status": "incomplete",
    "current_period_start": "2024-12-03T00:00:00.000Z",
    "current_period_end": "2024-12-03T00:00:00.000Z",
    "cancel_at_period_end": false,
    "started_at": "2024-12-03T00:00:00.000Z",
    "ended_at": "2024-12-03T00:00:00.000Z",
    "user_id": "00000000-0000-0000-0000-000000000000",
    "product_id": "00000000-0000-0000-0000-000000000000",
    "price_id": "00000000-0000-0000-0000-000000000000",
    "discount_id": "00000000-0000-0000-0000-000000000000",
    "checkout_id": "00000000-0000-0000-0000-000000000000",
    "metadata": {},
    "custom_field_data": {},
    "user": {
      "email": "string",
      "public_name": "string",
      "github_username": "string",
      "avatar_url": "string"
    },
    "product": {
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "name": "string",
      "description": "string",
      "is_recurring": false,
      "is_archived": false,
      "organization_id": "00000000-0000-0000-0000-000000000000",
      "metadata": {},
      "prices": [
        {
          "created_at": "2024-12-03T00:00:00.000Z",
          "modified_at": "2024-12-03T00:00:00.000Z",
          "id": "00000000-0000-0000-0000-000000000000",
          "amount_type": "fixed",
          "is_archived": false,
          "product_id": "00000000-0000-0000-0000-000000000000",
          "price_currency": "string",
          "price_amount": 0,
          "type": "recurring",
          "recurring_interval": "month"
        }
      ],
      "benefits": [
        {
          "created_at": "2024-12-03T00:00:00.000Z",
          "modified_at": "2024-12-03T00:00:00.000Z",
          "id": "00000000-0000-0000-0000-000000000000",
          "type": "articles",
          "description": "string",
          "selectable": false,
          "deletable": false,
          "organization_id": "00000000-0000-0000-0000-000000000000",
          "properties": {
            "paid_articles": false
          }
        }
      ],
      "medias": [
        {
          "id": "00000000-0000-0000-0000-000000000000",
          "organization_id": "00000000-0000-0000-0000-000000000000",
          "name": "string",
          "path": "string",
          "mime_type": "string",
          "size": 0,
          "storage_version": "string",
          "checksum_etag": "string",
          "checksum_sha256_base64": "string",
          "checksum_sha256_hex": "string",
          "last_modified_at": "2024-12-03T00:00:00.000Z",
          "version": "string",
          "service": "product_media",
          "is_uploaded": false,
          "created_at": "2024-12-03T00:00:00.000Z",
          "size_readable": "string",
          "public_url": "string"
        }
      ],
      "attached_custom_fields": [
        {
          "custom_field_id": "00000000-0000-0000-0000-000000000000",
          "custom_field": {
            "created_at": "2024-12-03T00:00:00.000Z",
            "modified_at": "2024-12-03T00:00:00.000Z",
            "id": "00000000-0000-0000-0000-000000000000",
            "metadata": {},
            "type": "text",
            "slug": "string",
            "name": "string",
            "organization_id": "00000000-0000-0000-0000-000000000000",
            "properties": {
              "form_label": "string",
              "form_help_text": "string",
              "form_placeholder": "string",
              "textarea": false,
              "min_length": 0,
              "max_length": 0
            }
          },
          "order": 0,
          "required": false
        }
      ]
    },
    "price": {
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "amount_type": "fixed",
      "is_archived": false,
      "product_id": "00000000-0000-0000-0000-000000000000",
      "price_currency": "string",
      "price_amount": 0,
      "type": "recurring",
      "recurring_interval": "month"
    },
    "discount": {
      "duration": "once",
      "type": "fixed",
      "amount": 0,
      "currency": "string",
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "metadata": {},
      "name": "string",
      "code": "string",
      "starts_at": "2024-12-03T00:00:00.000Z",
      "ends_at": "2024-12-03T00:00:00.000Z",
      "max_redemptions": 0,
      "redemptions_count": 0,
      "organization_id": "00000000-0000-0000-0000-000000000000"
    }
  }
}


benefit_grant.created
Sent when a new benefit grant is created.

Discord & Slack support: Basic

Raw format payload

{
  "type": "benefit_grant.created",
  "data": {
    "created_at": "2024-12-03T00:00:00.000Z",
    "modified_at": "2024-12-03T00:00:00.000Z",
    "id": "00000000-0000-0000-0000-000000000000",
    "granted_at": "2024-12-03T00:00:00.000Z",
    "is_granted": false,
    "revoked_at": "2024-12-03T00:00:00.000Z",
    "is_revoked": false,
    "subscription_id": "00000000-0000-0000-0000-000000000000",
    "order_id": "00000000-0000-0000-0000-000000000000",
    "user_id": "00000000-0000-0000-0000-000000000000",
    "benefit_id": "00000000-0000-0000-0000-000000000000",
    "properties": {
      "guild_id": "string",
      "role_id": "string",
      "account_id": "string"
    },
    "benefit": {
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "type": "articles",
      "description": "string",
      "selectable": false,
      "deletable": false,
      "organization_id": "00000000-0000-0000-0000-000000000000",
      "properties": {
        "paid_articles": false
      }
    },
    "previous_properties": {
      "guild_id": "string",
      "role_id": "string",
      "account_id": "string"
    }
  }
}


benefit_grant.revoked
Sent when a new benefit grant is revoked.

Discord & Slack support: Basic

Raw format payload

{
  "type": "benefit_grant.revoked",
  "data": {
    "created_at": "2024-12-03T00:00:00.000Z",
    "modified_at": "2024-12-03T00:00:00.000Z",
    "id": "00000000-0000-0000-0000-000000000000",
    "granted_at": "2024-12-03T00:00:00.000Z",
    "is_granted": false,
    "revoked_at": "2024-12-03T00:00:00.000Z",
    "is_revoked": false,
    "subscription_id": "00000000-0000-0000-0000-000000000000",
    "order_id": "00000000-0000-0000-0000-000000000000",
    "user_id": "00000000-0000-0000-0000-000000000000",
    "benefit_id": "00000000-0000-0000-0000-000000000000",
    "properties": {
      "guild_id": "string",
      "role_id": "string",
      "account_id": "string"
    },
    "benefit": {
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "type": "articles",
      "description": "string",
      "selectable": false,
      "deletable": false,
      "organization_id": "00000000-0000-0000-0000-000000000000",
      "properties": {
        "paid_articles": false
      }
    },
    "previous_properties": {
      "guild_id": "string",
      "role_id": "string",
      "account_id": "string"
    }
  }
}

benefit_grant.updated
Sent when a new benefit grant is updated.

Discord & Slack support: Basic

Raw format payload

{
  "type": "benefit_grant.updated",
  "data": {
    "created_at": "2024-12-03T00:00:00.000Z",
    "modified_at": "2024-12-03T00:00:00.000Z",
    "id": "00000000-0000-0000-0000-000000000000",
    "granted_at": "2024-12-03T00:00:00.000Z",
    "is_granted": false,
    "revoked_at": "2024-12-03T00:00:00.000Z",
    "is_revoked": false,
    "subscription_id": "00000000-0000-0000-0000-000000000000",
    "order_id": "00000000-0000-0000-0000-000000000000",
    "user_id": "00000000-0000-0000-0000-000000000000",
    "benefit_id": "00000000-0000-0000-0000-000000000000",
    "properties": {
      "guild_id": "string",
      "role_id": "string",
      "account_id": "string"
    },
    "benefit": {
      "created_at": "2024-12-03T00:00:00.000Z",
      "modified_at": "2024-12-03T00:00:00.000Z",
      "id": "00000000-0000-0000-0000-000000000000",
      "type": "articles",
      "description": "string",
      "selectable": false,
      "deletable": false,
      "organization_id": "00000000-0000-0000-0000-000000000000",
      "properties": {
        "paid_articles": false
      }
    },
    "previous_properties": {
      "guild_id": "string",
      "role_id": "string",
      "account_id": "string"
    }
  }
}