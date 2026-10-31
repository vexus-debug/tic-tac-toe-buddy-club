
-- Messages table (append-only audit trail)
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  content text NOT NULL,
  is_broadcast boolean NOT NULL DEFAULT false,
  broadcast_role text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Recipients table
CREATE TABLE public.message_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL,
  read boolean NOT NULL DEFAULT false,
  read_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;

-- Attachments table (record references only)
CREATE TABLE public.message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  entity_type text NOT NULL, -- 'patient', 'invoice', 'treatment', 'lab_case'
  entity_id uuid NOT NULL,
  entity_label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- Index for fast lookups
CREATE INDEX idx_message_recipients_recipient ON public.message_recipients(recipient_id);
CREATE INDEX idx_message_recipients_message ON public.message_recipients(message_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- RLS: Messages - sender can read their own sent messages
CREATE POLICY "Users can read messages they sent"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id);

-- RLS: Messages - recipients can read messages sent to them
CREATE POLICY "Users can read messages sent to them"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.message_recipients mr
    WHERE mr.message_id = id AND mr.recipient_id = auth.uid()
  )
);

-- RLS: Messages - authenticated users can insert (role validation in app)
CREATE POLICY "Authenticated users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- RLS: Recipients - users can read their own recipient records
CREATE POLICY "Users can read own recipient records"
ON public.message_recipients FOR SELECT
USING (recipient_id = auth.uid());

-- RLS: Recipients - sender can read recipient records for their messages
CREATE POLICY "Senders can read recipient records"
ON public.message_recipients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_id AND m.sender_id = auth.uid()
  )
);

-- RLS: Recipients - authenticated users can insert
CREATE POLICY "Authenticated users can insert recipients"
ON public.message_recipients FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_id AND m.sender_id = auth.uid()
  )
);

-- RLS: Recipients - users can update own read status
CREATE POLICY "Users can update own read status"
ON public.message_recipients FOR UPDATE
USING (recipient_id = auth.uid());

-- RLS: Attachments - readable by sender and recipients
CREATE POLICY "Users can read attachments for accessible messages"
ON public.message_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_id AND m.sender_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.message_recipients mr
    WHERE mr.message_id = message_id AND mr.recipient_id = auth.uid()
  )
);

-- RLS: Attachments - sender can insert
CREATE POLICY "Message sender can add attachments"
ON public.message_attachments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_id AND m.sender_id = auth.uid()
  )
);

-- Enable realtime for message_recipients (for notification sounds)
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_recipients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
