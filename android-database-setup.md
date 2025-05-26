# Onra Voice Database Setup Guide

Onra Voice supports two operating modes:

1. **Standalone Mode (In-Memory Storage)**
   - Data stored locally in memory
   - Perfect for offline use
   - No server dependency
   - Data resets when app is restarted

2. **Server Mode (PostgreSQL Database)**
   - Data stored in PostgreSQL database
   - Persistent across app restarts
   - Shared data between multiple clients
   - Requires server connectivity

## Switching Between Modes

### In the Web Application

The web application includes a Storage Mode Toggle in the settings. You can:

1. Go to Settings
2. Find the "Storage Mode" card
3. Toggle between "In-Memory Storage" and "PostgreSQL Database"
4. Click "Reload Application" to apply changes

### In the Android APK

For the Android APK, you can configure the storage mode:

1. **Standalone Mode (Default)**: The APK is configured to use in-memory storage by default for offline use.

2. **Server Mode**: To use PostgreSQL database in the APK:
   - Open Developer Settings in the app
   - Toggle "Use Server Database"
   - Enter the database connection information
   - Restart the app

## Setting Up PostgreSQL Database

If you want to use the PostgreSQL database mode, follow these steps:

1. Make sure your PostgreSQL database is accessible from your deployment
2. Set the `DATABASE_URL` environment variable to your PostgreSQL connection string
3. Run the initialization script to create tables and initial data:
   ```bash
   npx tsx server/init-database.ts
   ```

## Default Credentials

Regardless of storage mode, the following default credentials are available:

- **Admin User:**
  - Username: `admin`
  - Password: `admin123`

- **Regular User:**
  - Username: `user`
  - Password: `User@123`

## Troubleshooting

If you encounter any issues:

1. **Switching Modes Not Working**: Clear browser cache and cookies, then restart the app
2. **Database Connection Errors**: Verify your DATABASE_URL environment variable is correct
3. **Missing Tables**: Run the initialization script mentioned above
4. **APK Not Connecting to Database**: Check network permissions and database URL

## Data Security

- In standalone mode, data is only stored in the device's memory
- In server mode, data is transmitted securely to your PostgreSQL database
- Always use proper security measures when deploying with a database