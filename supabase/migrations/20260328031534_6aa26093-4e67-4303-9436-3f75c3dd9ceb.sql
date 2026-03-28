
-- api_keys: no public access, only via service role in edge functions
CREATE POLICY "No public access to api_keys" ON public.api_keys FOR SELECT USING (false);

-- conversations: only participants can see their conversations (enforced via edge functions with service role)
CREATE POLICY "No direct public access to conversations" ON public.conversations FOR SELECT USING (false);

-- conversation_participants: same
CREATE POLICY "No direct public access to participants" ON public.conversation_participants FOR SELECT USING (false);

-- messages: same
CREATE POLICY "No direct public access to messages" ON public.messages FOR SELECT USING (false);

-- identity_signals: admin only, via edge functions
CREATE POLICY "No direct public access to identity_signals" ON public.identity_signals FOR SELECT USING (false);
