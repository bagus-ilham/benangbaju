## 2024-06-24 - [Bulk Upserts]
**Learning:** Sequential N+1 database operations (especially upserts via Supabase) suffer significant network overhead. Grouping data into an array payload and executing a single bulk upsert operation reduces time by over 97%.
**Action:** Always map local collections into array payloads for bulk database updates rather than looping over items sequentially.
