
-- Create a security definer function to check if a user is a recipient of a message
-- This breaks the infinite recursion between messages and message_recipients RLS policies
CREATE OR REPLACE FUNCTION public.is_message_recipient(_message_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.message_recipients
    WHERE message_id = _message_id AND recipient_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_message_sender(_message_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.messages
    WHERE id = _message_id AND sender_id = _user_id
  )
$$;

-- Fix messages SELECT policies using the security definer function
DROP POLICY IF EXISTS "Users can read messages sent to them" ON public.messages;
CREATE POLICY "Users can read messages sent to them"
ON public.messages
FOR SELECT
USING (public.is_message_recipient(id, auth.uid()));

-- Fix message_recipients SELECT policies using the security definer function
DROP POLICY IF EXISTS "Senders can read recipient records" ON public.message_recipients;
CREATE POLICY "Senders can read recipient records"
ON public.message_recipients
FOR SELECT
USING (public.is_message_sender(message_id, auth.uid()));

-- Fix message_recipients INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert recipients" ON public.message_recipients;
CREATE POLICY "Authenticated users can insert recipients"
ON public.message_recipients
FOR INSERT
WITH CHECK (public.is_message_sender(message_id, auth.uid()));

-- Fix message_attachments SELECT policy
DROP POLICY IF EXISTS "Users can read attachments for accessible messages" ON public.message_attachments;
CREATE POLICY "Users can read attachments for accessible messages"
ON public.message_attachments
FOR SELECT
USING (
  public.is_message_sender(message_id, auth.uid())
  OR
  public.is_message_recipient(message_id, auth.uid())
);

-- Fix message_attachments INSERT policy
DROP POLICY IF EXISTS "Message sender can add attachments" ON public.message_attachments;
CREATE POLICY "Message sender can add attachments"
ON public.message_attachments
FOR INSERT
WITH CHECK (public.is_message_sender(message_id, auth.uid()));
