-- Create polar_subscriptions table to store subscription state
CREATE TABLE IF NOT EXISTS public.polar_subscriptions (
    id text PRIMARY KEY,
    user_id uuid NOT NULL,
    status text NOT NULL,
    started_at timestamp with time zone NOT NULL,
    ended_at timestamp with time zone,
    current_period_end timestamp with time zone NOT NULL,
    cancel_at_period_end boolean NOT NULL DEFAULT false,
    product_id text NOT NULL,
    product_name text NOT NULL,
    price_id text NOT NULL,
    amount numeric NOT NULL,
    currency text NOT NULL,
    recurring_interval text NOT NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create polar_orders table to store order state
CREATE TABLE IF NOT EXISTS public.polar_orders (
    id text PRIMARY KEY,
    user_id uuid NOT NULL,
    status text NOT NULL,
    amount numeric NOT NULL,
    currency text NOT NULL,
    product_id text NOT NULL,
    product_name text NOT NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_polar_subscriptions_user_id ON public.polar_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_polar_subscriptions_status ON public.polar_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_polar_orders_user_id ON public.polar_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_polar_orders_status ON public.polar_orders(status);

-- Function to update subscription state from webhook
CREATE OR REPLACE FUNCTION update_polar_subscription_from_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
DECLARE
    v_user_id UUID;
    v_subscription_id TEXT;
    v_subscription_data jsonb;
    v_product_id TEXT;
    v_product_name TEXT;
    v_price_id TEXT;
    v_status TEXT;
    v_amount NUMERIC;
    v_currency TEXT;
    v_recurring_interval TEXT;
BEGIN
    -- Extract data from webhook payload
    v_subscription_data := NEW.payload->'data';
    v_user_id := (v_subscription_data->'metadata'->>'userId')::UUID;
    v_subscription_id := v_subscription_data->>'id';
    v_product_id := v_subscription_data->>'product_id';
    v_product_name := (v_subscription_data->'product'->>'name');
    v_price_id := v_subscription_data->>'price_id';
    v_status := v_subscription_data->>'status';
    v_amount := (v_subscription_data->>'amount')::NUMERIC;
    v_currency := v_subscription_data->>'currency';
    v_recurring_interval := v_subscription_data->>'recurring_interval';

    IF NEW.event IN (
        'subscription.created',
        'subscription.updated',
        'subscription.canceled'
    ) THEN
        -- Insert or update subscription
        INSERT INTO public.polar_subscriptions (
            id,
            user_id,
            status,
            started_at,
            ended_at,
            current_period_end,
            cancel_at_period_end,
            product_id,
            product_name,
            price_id,
            amount,
            currency,
            recurring_interval,
            metadata,
            updated_at
        ) VALUES (
            v_subscription_id,
            v_user_id,
            v_status,
            (v_subscription_data->>'started_at')::timestamp with time zone,
            (v_subscription_data->>'ended_at')::timestamp with time zone,
            (v_subscription_data->>'current_period_end')::timestamp with time zone,
            (v_subscription_data->>'cancel_at_period_end')::boolean,
            v_product_id,
            v_product_name,
            v_price_id,
            v_amount,
            v_currency,
            v_recurring_interval,
            v_subscription_data->'metadata',
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            status = EXCLUDED.status,
            ended_at = EXCLUDED.ended_at,
            current_period_end = EXCLUDED.current_period_end,
            cancel_at_period_end = EXCLUDED.cancel_at_period_end,
            product_id = EXCLUDED.product_id,
            product_name = EXCLUDED.product_name,
            price_id = EXCLUDED.price_id,
            amount = EXCLUDED.amount,
            currency = EXCLUDED.currency,
            recurring_interval = EXCLUDED.recurring_interval,
            metadata = EXCLUDED.metadata,
            updated_at = CURRENT_TIMESTAMP;
    END IF;

    RETURN NEW;
END;
$function$;

-- Ensure the trigger is set up correctly
DROP TRIGGER IF EXISTS trigger_update_polar_subscription ON polar_webhooks;
CREATE TRIGGER trigger_update_polar_subscription
AFTER INSERT ON polar_webhooks
FOR EACH ROW
WHEN (NEW.event IN ('subscription.created', 'subscription.updated', 'subscription.canceled'))
EXECUTE FUNCTION update_polar_subscription_from_webhook();

-- Function to update order state from webhook
CREATE OR REPLACE FUNCTION update_polar_order_from_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
DECLARE
    v_user_id UUID;
    v_order_data jsonb;
BEGIN
    IF NEW.event IN ('order.created', 'order.completed', 'order.failed', 'order.canceled') THEN
        -- Extract data from webhook payload
        v_order_data := NEW.payload->'data';
        v_user_id := (v_order_data->'metadata'->>'userId')::UUID;

        -- Insert or update order
        INSERT INTO public.polar_orders (
            id,
            user_id,
            status,
            amount,
            currency,
            product_id,
            product_name,
            metadata,
            created_at,
            updated_at
        ) VALUES (
            v_order_data->>'id',
            v_user_id,
            v_order_data->>'status',
            (v_order_data->>'amount')::numeric,
            v_order_data->>'currency',
            v_order_data->'product'->>'id',
            v_order_data->'product'->>'name',
            v_order_data->'metadata',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            metadata = EXCLUDED.metadata,
            updated_at = CURRENT_TIMESTAMP;
    END IF;

    RETURN NEW;
END;
$function$;

-- Ensure the trigger is set up correctly for all order events
DROP TRIGGER IF EXISTS trigger_update_polar_order ON polar_webhooks;
CREATE TRIGGER trigger_update_polar_order
AFTER INSERT ON polar_webhooks
FOR EACH ROW
WHEN (NEW.event IN (
    'checkout.created',
    'checkout.updated',
    'order.created'
))
EXECUTE FUNCTION update_polar_order_from_webhook();

-- Set up RLS policies
ALTER TABLE public.polar_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polar_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow system to manage subscriptions"
    ON public.polar_subscriptions
    FOR ALL
    TO service_role
    USING (true);

CREATE POLICY "Allow system to manage orders"
    ON public.polar_orders
    FOR ALL
    TO service_role
    USING (true);

GRANT USAGE ON SCHEMA cron TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.polar_subscriptions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.polar_orders TO service_role;
