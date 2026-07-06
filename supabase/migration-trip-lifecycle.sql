-- Run in Supabase SQL Editor if schema was already applied
create policy "Creator can delete trip" on trips for delete
  using (created_by = auth.uid());
