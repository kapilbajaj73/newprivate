import { supabaseAdmin } from './supabase';

// Execute migration for tables
async function createTables() {
  try {
    console.log('Creating tables if they don\'t exist...');
    
    // Create users table
    await supabaseAdmin.rpc('create_tables', {
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'serial', primary: true },
            { name: 'auth_id', type: 'text', unique: true },
            { name: 'username', type: 'text', notNull: true, unique: true },
            { name: 'password', type: 'text', notNull: true },
            { name: 'email', type: 'varchar(255)', notNull: true, unique: true },
            { name: 'full_name', type: 'text', notNull: true },
            { name: 'role', type: 'text', notNull: true, default: "'user'" },
            { name: 'room_id', type: 'integer' }
          ]
        },
        {
          name: 'rooms',
          columns: [
            { name: 'id', type: 'serial', primary: true },
            { name: 'name', type: 'text', notNull: true },
            { name: 'capacity', type: 'integer', notNull: true, default: '20' },
            { name: 'active', type: 'boolean', notNull: true, default: 'true' },
            { name: 'encrypted', type: 'boolean', notNull: true, default: 'true' },
            { name: 'isolated', type: 'boolean', notNull: true, default: 'true' }
          ]
        },
        {
          name: 'recordings',
          columns: [
            { name: 'id', type: 'serial', primary: true },
            { name: 'user_id', type: 'integer', notNull: true },
            { name: 'room_id', type: 'integer', notNull: true },
            { name: 'file_name', type: 'text', notNull: true },
            { name: 'duration', type: 'integer', notNull: true },
            { name: 'created_at', type: 'timestamp', notNull: true, default: 'now()' }
          ]
        }
      ]
    });
    
    // Add foreign key constraints 
    await supabaseAdmin.rpc('create_foreign_keys', {
      constraints: [
        {
          table: 'users',
          column: 'room_id',
          referenced_table: 'rooms',
          referenced_column: 'id',
          on_delete: 'SET NULL'
        },
        {
          table: 'recordings',
          column: 'user_id',
          referenced_table: 'users',
          referenced_column: 'id',
          on_delete: 'CASCADE'
        },
        {
          table: 'recordings',
          column: 'room_id',
          referenced_table: 'rooms',
          referenced_column: 'id',
          on_delete: 'CASCADE'
        }
      ]
    });
    
    console.log('Tables and relationships created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

// Create default admin user and rooms
async function createDefaultData() {
  try {
    console.log('Creating default data...');
    
    // Check if admin user exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .single();
    
    if (!existingAdmin) {
      // Create admin user in auth
      const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
        email: 'admin@onravoice.com',
        password: 'admin123',
        email_confirm: true,
        user_metadata: {
          username: 'admin',
          fullName: 'Admin User',
          role: 'admin'
        }
      });
      
      if (authUser?.user) {
        // Create admin user in database
        await supabaseAdmin.from('users').insert({
          auth_id: authUser.user.id,
          username: 'admin',
          password: 'admin123', // In production, this would be hashed
          email: 'admin@onravoice.com',
          full_name: 'Admin User',
          role: 'admin'
        });
        
        console.log('Created admin user');
      }
    }
    
    // Check if main room exists
    const { data: existingMainRoom } = await supabaseAdmin
      .from('rooms')
      .select('*')
      .eq('name', 'Main Conference Room')
      .single();
    
    if (!existingMainRoom) {
      // Create main room
      await supabaseAdmin.from('rooms').insert({
        name: 'Main Conference Room',
        capacity: 20,
        active: true,
        encrypted: true,
        isolated: true
      });
      
      console.log('Created main conference room');
    }
    
    // Check if training room exists
    const { data: existingTrainingRoom } = await supabaseAdmin
      .from('rooms')
      .select('*')
      .eq('name', 'Training Room')
      .single();
    
    if (!existingTrainingRoom) {
      // Create training room
      await supabaseAdmin.from('rooms').insert({
        name: 'Training Room',
        capacity: 10,
        active: false,
        encrypted: true,
        isolated: true
      });
      
      console.log('Created training room');
    }
    
    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', 'user')
      .single();
    
    if (!existingUser) {
      // Get main room id
      const { data: mainRoom } = await supabaseAdmin
        .from('rooms')
        .select('id')
        .eq('name', 'Main Conference Room')
        .single();
      
      // Create user in auth
      const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
        email: 'user@onravoice.com',
        password: 'User@123',
        email_confirm: true,
        user_metadata: {
          username: 'user',
          fullName: 'Demo User',
          role: 'user',
          roomId: mainRoom?.id
        }
      });
      
      if (authUser?.user && mainRoom) {
        // Create user in database
        await supabaseAdmin.from('users').insert({
          auth_id: authUser.user.id,
          username: 'user',
          password: 'User@123', // In production, this would be hashed
          email: 'user@onravoice.com',
          full_name: 'Demo User',
          role: 'user',
          room_id: mainRoom.id
        });
        
        console.log('Created demo user');
      }
    }
    
    console.log('Default data created successfully!');
  } catch (error) {
    console.error('Error creating default data:', error);
  }
}

// Run migration
async function migrate() {
  try {
    console.log('Starting migration to Supabase...');
    
    // First create tables and relations
    await createTables();
    
    // Then populate with default data
    await createDefaultData();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Execute migration
migrate();