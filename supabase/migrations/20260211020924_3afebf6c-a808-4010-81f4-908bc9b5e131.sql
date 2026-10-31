
-- Fix broken RLS policy on messages table: mr.message_id = mr.id should be mr.message_id = messages.id
DROP POLICY IF EXISTS "Users can read messages sent to them" ON public.messages;
CREATE POLICY "Users can read messages sent to them"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.message_recipients mr
    WHERE mr.message_id = messages.id AND mr.recipient_id = auth.uid()
  )
);

-- Fix broken RLS policy on message_attachments: same issue with mr.message_id = mr.id
DROP POLICY IF EXISTS "Users can read attachments for accessible messages" ON public.message_attachments;
CREATE POLICY "Users can read attachments for accessible messages"
ON public.message_attachments
FOR SELECT
USING (
  (EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_attachments.message_id AND m.sender_id = auth.uid()
  ))
  OR
  (EXISTS (
    SELECT 1 FROM public.message_recipients mr
    WHERE mr.message_id = message_attachments.message_id AND mr.recipient_id = auth.uid()
  ))
);

-- Allow all authenticated users to read profiles (needed for messaging to show names)
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Authenticated users can read profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Allow all authenticated users to read user_roles (needed for messaging role display)
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read all roles"
ON public.user_roles
FOR SELECT
USING (true);
