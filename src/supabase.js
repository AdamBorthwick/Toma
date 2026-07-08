import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://vgwzhymgntxlbsbanmvj.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_iE4SrxxdBGItPtQHJ8KoZQ_pQQXqunf'

export const supabase = createClient(url, key)
