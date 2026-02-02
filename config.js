// ============================================
// SUPABASE CONFIGURATION
// ============================================
// Replace these with your actual Supabase project credentials
// Find them at: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api

const SUPABASE_URL = 'https://wypcfezoybezswbvmkbq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5cGNmZXpveWJlenN3YnZta2JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDM0OTksImV4cCI6MjA4NTYxOTQ5OX0.A8WuGuYeygSe2G-fQEEck8_Xns2Vg9Oib8aOba5lxCw';

// ============================================
// DO NOT EDIT BELOW THIS LINE
// ============================================

// Validate configuration
if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
  console.warn('⚠️ Supabase not configured! Please update config.js with your credentials.');
  console.warn('📖 See README.md for setup instructions.');
}
