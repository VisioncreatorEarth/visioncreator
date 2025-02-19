/*
HOW THIS NOTIFICATION SYSTEM WORKS:

1. Core Concepts:
   - Users can subscribe/unsubscribe/resubscribe to proposals at any time
   - Notifications are only generated for events during active subscription periods
   - Each subscription tracks when it started
   - System handles resubscription by creating new recipient records

2. Tables Structure:
   - notification_contexts: Links notifications to proposals
   - notifications: Stores message notifications
   - notification_recipients: Tracks active subscriptions and notifications
*/

-- Create notification contexts table
CREATE TABLE notification_contexts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id UUID NOT NULL REFERENCES proposals(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    context_id UUID NOT NULL REFERENCES notification_contexts(id),
    message_id UUID REFERENCES messages(id),
    sender_id UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create notification recipients table with subscription tracking
CREATE TABLE notification_recipients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID REFERENCES notifications(id),
    context_id UUID NOT NULL REFERENCES notification_contexts(id),
    recipient_id UUID NOT NULL REFERENCES profiles(id),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add a unique constraint only for subscription records (where notification_id is null)
CREATE UNIQUE INDEX idx_unique_subscription ON notification_recipients (context_id, recipient_id) 
WHERE notification_id IS NULL;

-- Add indexes
CREATE INDEX idx_notification_contexts_proposal ON notification_contexts(proposal_id);
CREATE INDEX idx_notifications_context ON notifications(context_id);
CREATE INDEX idx_notifications_message ON notifications(message_id);
CREATE INDEX idx_notifications_sender ON notifications(sender_id);
CREATE INDEX idx_notifications_created ON notifications(created_at);
CREATE INDEX idx_notification_recipients_recipient ON notification_recipients(recipient_id);
CREATE INDEX idx_notification_recipients_notification ON notification_recipients(notification_id);
CREATE INDEX idx_notification_recipients_context ON notification_recipients(context_id);
CREATE INDEX idx_notification_recipients_read_status ON notification_recipients(recipient_id, is_read);
CREATE INDEX idx_notification_recipients_subscription ON notification_recipients(recipient_id, subscribed_at);

-- Add triggers for updated_at
CREATE TRIGGER notification_contexts_updated_at
    BEFORE UPDATE ON notification_contexts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE notification_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;

-- Single admin policy for service role
CREATE POLICY "Admin policy" ON notification_contexts FOR ALL TO service_role USING (true);
CREATE POLICY "Admin policy" ON notifications FOR ALL TO service_role USING (true);
CREATE POLICY "Admin policy" ON notification_recipients FOR ALL TO service_role USING (true);

-- Function to create notification context for a proposal
CREATE OR REPLACE FUNCTION create_proposal_notification_context()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification context for the new proposal
    INSERT INTO notification_contexts (proposal_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new messages in proposals
CREATE OR REPLACE FUNCTION handle_proposal_message()
RETURNS TRIGGER AS $$
DECLARE
    v_context_id UUID;
    v_notification_id UUID;
BEGIN
    -- Only handle messages in proposal contexts
    IF NEW.context_type = 'proposal' THEN
        -- Get or create notification context
        SELECT id INTO v_context_id
        FROM notification_contexts
        WHERE proposal_id = NEW.context_id;

        IF v_context_id IS NULL THEN
            INSERT INTO notification_contexts (proposal_id)
            VALUES (NEW.context_id)
            RETURNING id INTO v_context_id;
        END IF;

        -- Create notification
        INSERT INTO notifications (
            context_id,
            message_id,
            sender_id
        ) VALUES (
            v_context_id,
            NEW.id,
            NEW.sender_id
        )
        RETURNING id INTO v_notification_id;

        -- Add notification for subscribed users
        -- This creates a new notification_recipient record for this specific notification
        INSERT INTO notification_recipients (notification_id, context_id, recipient_id, subscribed_at)
        SELECT DISTINCT v_notification_id, v_context_id, nr.recipient_id, nr.subscribed_at
        FROM notification_recipients nr
        WHERE nr.context_id = v_context_id
        AND nr.recipient_id != NEW.sender_id  -- Don't notify the sender
        AND nr.subscribed_at <= NEW.created_at  -- Only notify if subscribed before message
        AND nr.notification_id IS NULL;  -- Only get the subscription records, not notification records
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER create_proposal_notification_context_trigger
    AFTER INSERT ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION create_proposal_notification_context();

CREATE TRIGGER handle_proposal_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_proposal_message();

-- Grant access to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role; 