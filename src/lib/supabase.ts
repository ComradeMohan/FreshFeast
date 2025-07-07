import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kgmkqgexhhsvvzpackak.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnbWtxZ2V4aGhzdnZ6cGFja2FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODU4MjAsImV4cCI6MjA2NzQ2MTgyMH0.XOhO5zYa7A_-Ok23RxKIvvvgGYKR5GoIX7-haEkJMtI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
