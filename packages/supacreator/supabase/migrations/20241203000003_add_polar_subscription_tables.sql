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
    v_subscription_data jsonb;
BEGIN
    -- Extract data from webhook payload
    v_subscription_data := NEW.payload->'data';
    v_user_id := (v_subscription_data->'metadata'->>'userId')::UUID;

    IF NEW.event IN (
        'subscription.created',
        'subscription.active',
        'subscription.updated',
        'subscription.canceled',
        'subscription.revoked',
        'subscription.paused',
        'subscription.resumed',
        'subscription.expired'
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
            amount,
            currency,
            recurring_interval,
            metadata,
            updated_at
        ) VALUES (
            v_subscription_data->>'id',
            v_user_id,
            v_subscription_data->>'status',
            (v_subscription_data->>'started_at')::timestamp with time zone,
            (v_subscription_data->>'ended_at')::timestamp with time zone,
            (v_subscription_data->>'current_period_end')::timestamp with time zone,
            (v_subscription_data->>'cancel_at_period_end')::boolean,
            v_subscription_data->'product'->>'id',
            v_subscription_data->'product'->>'name',
            (v_subscription_data->>'amount')::numeric,
            v_subscription_data->>'currency',
            v_subscription_data->>'recurring_interval',
            v_subscription_data->'metadata',
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            ended_at = EXCLUDED.ended_at,
            current_period_end = EXCLUDED.current_period_end,
            cancel_at_period_end = EXCLUDED.cancel_at_period_end,
            metadata = EXCLUDED.metadata,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$function$;

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

-- Create triggers for webhook events
DROP TRIGGER IF EXISTS trigger_polar_webhook_subscription ON polar_webhooks;
CREATE TRIGGER trigger_polar_webhook_subscription
    AFTER INSERT ON polar_webhooks
    FOR EACH ROW
    EXECUTE FUNCTION update_polar_subscription_from_webhook();

DROP TRIGGER IF EXISTS trigger_polar_webhook_order ON polar_webhooks;
CREATE TRIGGER trigger_polar_webhook_order
    AFTER INSERT ON polar_webhooks
    FOR EACH ROW
    EXECUTE FUNCTION update_polar_order_from_webhook();

-- Set up RLS policies
ALTER TABLE public.polar_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polar_orders ENABLE ROW LEVEL SECURITY;

-- Subscription policies
CREATE POLICY "Allow users to read own subscriptions"
    ON public.polar_subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Allow system to manage subscriptions"
    ON public.polar_subscriptions
    FOR ALL
    TO service_role
    USING (true);

-- Order policies
CREATE POLICY "Allow users to read own orders"
    ON public.polar_orders
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Allow system to manage orders"
    ON public.polar_orders
    FOR ALL
    TO service_role
    USING (true);
