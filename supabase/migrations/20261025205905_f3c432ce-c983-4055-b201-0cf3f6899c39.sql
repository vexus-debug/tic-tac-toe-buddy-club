CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$ BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'blog-autopilot-hourly';
END $$;

SELECT cron.schedule(
  'blog-autopilot-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://clinexus.com.ng/api/public/blog-autopilot',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT cron_token FROM public.blog_autopilot WHERE id = 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
  $$
);