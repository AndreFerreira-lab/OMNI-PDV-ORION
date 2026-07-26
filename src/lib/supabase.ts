import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dzwjdmmijqgudfldzmfl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6d2pkbW1panFndWRmbGR6bWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMzUwOTEsImV4cCI6MjEwMDYxMTA5MX0.bhHbTeSpLqVaEF3FaZUmpX-JqlwPOnEJrmNm_0iJjCg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
