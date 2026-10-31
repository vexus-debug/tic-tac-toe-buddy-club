
SELECT cron.schedule(
  'daily-automation-7am',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://agkmbgxtmvhsyftcrplp.supabase.co/functions/v1/daily-automation',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFna21iZ3h0bXZoc3lmdGNycGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMTYyOTUsImV4cCI6MjA4NjY5MjI5NX0.PVo0dGIWaYP3SGG4SPTzPGVPrAgUqi4u4LkW_pONzrI"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);
