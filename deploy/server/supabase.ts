import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create Supabase admin client with service role key
// This should only be used server-side as it has admin privileges
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// User management functions
export const createUser = async (email: string, password: string, userData: any) => {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: userData,
    email_confirm: true
  });
  
  if (error) throw error;
  return data;
};

export const deleteUser = async (userId: string) => {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw error;
  return true;
};

export const updateUserRole = async (userId: string, role: string) => {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { user_metadata: { role } }
  );
  
  if (error) throw error;
  return true;
};

// Database helpers
export const getTable = (table: string) => supabaseAdmin.from(table);

export const getById = async (table: string, id: number | string) => {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const getByField = async (table: string, field: string, value: any) => {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('*')
    .eq(field, value)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
  return data || null;
};

export const getAll = async (table: string) => {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('*');
  
  if (error) throw error;
  return data || [];
};

export const insert = async (table: string, data: any) => {
  const { data: result, error } = await supabaseAdmin
    .from(table)
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return result;
};

export const update = async (table: string, id: number | string, data: any) => {
  const { data: result, error } = await supabaseAdmin
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return result;
};

export const remove = async (table: string, id: number | string) => {
  const { error } = await supabaseAdmin
    .from(table)
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

export const query = async (table: string, queryFn: (query: any) => any) => {
  const baseQuery = supabaseAdmin.from(table).select('*');
  const { data, error } = await queryFn(baseQuery);
  
  if (error) throw error;
  return data || [];
};