-- Buat scheduled job untuk cleanup rate limit logs setiap 5 menit
-- Memerlukan pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-rate-limit-logs',
  '*/5 * * * *',
  $$DELETE FROM public.rate_limit_logs WHERE created_at < (now() - interval '2 minutes')$$
);
