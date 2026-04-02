-- Allow guests (anon) to insert/select chat messages
CREATE POLICY "everyone can read chat" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "everyone can insert chat" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "everyone can update their chat read status" ON chat_messages FOR UPDATE USING (true);

-- Allow guests to insert service requests
CREATE POLICY "everyone can read service requests" ON service_requests FOR SELECT USING (true);
CREATE POLICY "everyone can insert service requests" ON service_requests FOR INSERT WITH CHECK (true);

-- Allow guests to update rooms (like checking out or extending stay, handled via chat generally but sometimes directly)
CREATE POLICY "everyone can read rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "everyone can update rooms" ON rooms FOR UPDATE USING (true);
