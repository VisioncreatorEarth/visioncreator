-- Function to handle Polar webhook events and update capabilities
CREATE OR REPLACE FUNCTION handle_polar_webhook_event()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
DECLARE
    v_user_id UUID;
    v_product_id TEXT;
    v_current_period_end TIMESTAMPTZ;
    v_tier tier_level;
    v_minutes_used INT;
    v_tier_config JSONB;
BEGIN
    -- Extract user ID from metadata
    v_user_id := (NEW.payload->'data'->'metadata'->>'userId')::UUID;
    
    -- Only process if we have a valid user ID
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'No valid user ID found in webhook payload';
        RETURN NEW;
    END IF;

    -- Get current minutes used if any active tier exists
    SELECT (config->>'minutesUsed')::int 
    INTO v_minutes_used 
    FROM capabilities 
    WHERE user_id = v_user_id 
    AND type = 'TIER'::capability_type 
    AND active = true;

    -- If no active tier found, set to 0
    IF v_minutes_used IS NULL THEN
        v_minutes_used := 0;
    END IF;

    -- Handle different event types
    IF NEW.event IN ('subscription.active', 'subscription.created', 'subscription.updated') THEN
        BEGIN
            v_product_id := NEW.payload->'data'->'product'->>'id';
            v_current_period_end := (NEW.payload->'data'->>'current_period_end')::TIMESTAMPTZ;
            
            -- Determine tier based on product
            v_tier := CASE 
                WHEN v_product_id = 'ef8f64f5-e644-4066-b339-a45e63a64f14' THEN 'HOMINIO'::tier_level
                WHEN v_product_id = '3ae7ed1f-4d0f-4f02-8712-4419514a6a82' THEN 'VISIONCREATOR'::tier_level
                ELSE 'FREE'::tier_level
            END;

            -- Build tier config based on tier
            v_tier_config := jsonb_build_object(
                'tier', v_tier,
                'minutesLimit', CASE 
                    WHEN v_tier = 'HOMINIO' THEN 60
                    WHEN v_tier = 'VISIONCREATOR' THEN 240
                    ELSE 5
                END,
                'minutesUsed', v_minutes_used,
                'lastResetAt', NOW(),
                'isOneTime', CASE 
                    WHEN v_tier = 'FREE' THEN true
                    ELSE false
                END,
                'subscriptionEnd', v_current_period_end
            );

            -- Deactivate any existing tier capabilities
            UPDATE capabilities
            SET active = false
            WHERE user_id = v_user_id 
            AND type = 'TIER'::capability_type
            AND active = true;

            -- Insert new capability with subscription period
            INSERT INTO capabilities (
                user_id,
                type,
                name,
                description,
                config,
                granted_at,
                granted_by,
                active
            ) VALUES (
                v_user_id,
                'TIER'::capability_type,
                v_tier::TEXT || ' Tier',
                CASE 
                    WHEN v_tier = 'FREE' THEN 'Free tier with 5 minutes'
                    WHEN v_tier = 'HOMINIO' THEN 'Hominio tier with 60 minutes per month'
                    ELSE 'VisionCreator tier with 240 minutes per month'
                END,
                v_tier_config,
                NOW(),
                v_user_id,
                true
            );
        END;

    ELSIF NEW.event = 'order.created' THEN
        BEGIN
            -- Reset minutes for the specific user's active tier
            UPDATE capabilities
            SET config = jsonb_set(
                jsonb_set(
                    config,
                    '{minutesUsed}',
                    '0'::jsonb
                ),
                '{lastResetAt}',
                to_jsonb(NOW())
            )
            WHERE user_id = v_user_id 
            AND type = 'TIER'::capability_type
            AND active = true;
        END;

    ELSIF NEW.event IN ('subscription.canceled', 'subscription.revoked') THEN
        BEGIN
            v_current_period_end := (NEW.payload->'data'->>'current_period_end')::TIMESTAMPTZ;
            
            IF NEW.event = 'subscription.revoked' THEN
                -- Immediate transition to free tier
                UPDATE capabilities
                SET active = false
                WHERE user_id = v_user_id 
                AND type = 'TIER'::capability_type
                AND active = true;

                -- Create free tier immediately
                INSERT INTO capabilities (
                    user_id,
                    type,
                    name,
                    description,
                    config,
                    granted_at,
                    granted_by,
                    active
                ) VALUES (
                    v_user_id,
                    'TIER'::capability_type,
                    'FREE Tier',
                    'Free tier with 5 minutes',
                    jsonb_build_object(
                        'tier', 'FREE',
                        'minutesLimit', 5,
                        'minutesUsed', 0,
                        'lastResetAt', NOW(),
                        'isOneTime', true,
                        'subscriptionEnd', NULL
                    ),
                    NOW(),
                    v_user_id,
                    true
                );
            ELSE
                -- For cancellation, update existing capabilities to expire at period end
                UPDATE capabilities
                SET config = jsonb_set(
                    jsonb_set(
                        config,
                        '{subscriptionEnd}',
                        to_jsonb(v_current_period_end)
                    ),
                    '{autoReset}',
                    'false'::jsonb
                )
                WHERE user_id = v_user_id 
                AND type = 'TIER'::capability_type
                AND active = true;

                -- Schedule transition to free tier
                INSERT INTO cron.job (schedule, command)
                VALUES (
                    v_current_period_end,
                    format(
                        $$
                        UPDATE capabilities
                        SET active = false
                        WHERE user_id = '%s'
                        AND type = 'TIER'::capability_type
                        AND active = true;

                        INSERT INTO capabilities (
                            user_id,
                            type,
                            name,
                            description,
                            config,
                            granted_at,
                            granted_by,
                            active
                        ) VALUES (
                            '%s',
                            'TIER'::capability_type,
                            'FREE Tier',
                            'Free tier with 5 minutes',
                            '{"tier": "FREE", "minutesLimit": 5, "minutesUsed": 0, "lastResetAt": NOW(), "isOneTime": true, "subscriptionEnd": null}'::jsonb,
                            NOW(),
                            '%s',
                            true
                        );
                        $$,
                        v_user_id,
                        v_user_id,
                        v_user_id
                    )
                );
            END IF;
        END;
    END IF;

    RETURN NEW;
END;
$function$;

-- Create trigger for webhook events
DROP TRIGGER IF EXISTS trigger_polar_webhook_event ON polar_webhooks;
CREATE TRIGGER trigger_polar_webhook_event
    AFTER INSERT ON polar_webhooks
    FOR EACH ROW
    EXECUTE FUNCTION handle_polar_webhook_event();
