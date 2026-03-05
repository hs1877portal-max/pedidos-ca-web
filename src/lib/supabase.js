import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase (usa variables de entorno para mayor seguridad)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://shdiokjxfmnixsbkbylq.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZGlva2p4Zm1uaXhzYmtieWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NDM4MTMsImV4cCI6MjA4ODExOTgxM30.lc6Zg5U3GhhcfnwXDx7lMetrGByEhBSMkLF_-X7VNi8'

// Crea y exporta el cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseKey)