-- Create mails table
CREATE TABLE public.mails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_email TEXT NOT NULL,
    from_name TEXT,
    to_recipients JSONB NOT NULL,
    cc_recipients JSONB,
    bcc_recipients JSONB,
    subject TEXT,
    text_body TEXT,
    html_body TEXT,
    received_at TIMESTAMP WITH TIME ZONE,
    message_id TEXT UNIQUE,
    attachments JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_mails_from_email ON public.mails(from_email);
CREATE INDEX idx_mails_received_at ON public.mails(received_at);

-- Enable Row Level Security
ALTER TABLE public.mails ENABLE ROW LEVEL SECURITY;
