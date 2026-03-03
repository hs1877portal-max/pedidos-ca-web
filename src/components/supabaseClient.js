import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://shdiokjxfmnixsbkbylq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZGlva2p4Zm1uaXhzYmtieWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NDM4MTMsImV4cCI6MjA4ODExOTgxM30.lc6Zg5U3GhhcfnwXDx7lMetrGByEhBSMkLF_-X7VNi8';

export const supabase = createClient(supabaseUrl, supabaseKey);