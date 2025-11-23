import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ylrmtthlinhgilxzxowy.supabase.co';

const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlscm10dGhsaW5oZ2lseHp4b3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTc5NTQsImV4cCI6MjA3OTQ3Mzk1NH0.a5JgmDkWM0WvRui9mOppHHZMGUC7tG0ApovrJzSlmZ4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
