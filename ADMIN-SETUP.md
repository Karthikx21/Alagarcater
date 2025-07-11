# Admin User Management

This document explains how to manage the admin user for the Algar Catering application.

## Default Admin Credentials

The application uses a permanent admin user with the following credentials:

- **Username**: `algarcatering`
- **Password**: `Algar@2025!`

## Admin Management Scripts

### Create Admin User
```bash
npm run admin:create
```
This script creates the permanent admin user or updates the password if the user already exists.

### Reset Admin User
```bash
npm run admin:reset
```
This script removes all existing users and creates a fresh admin user with default credentials.

### Setup Admin User
```bash
npm run admin:setup
```
This script creates the admin user if it doesn't exist, or updates the password if it does.

## Manual Admin Creation

You can also run the scripts directly:

```bash
# Create admin user
node create-admin.js

# Reset admin user
node scripts/reset-admin.js

# Setup admin user
node scripts/create-default-user.js
```

## Database Seeding

The admin user is automatically created when you seed the database:

```bash
npm run db:seed
```

This will create the admin user along with sample menu items, customers, and orders.

## Security Notes

1. **Change the password**: After first login, consider changing the password to something more secure.
2. **Store credentials securely**: Keep the admin credentials in a secure location.
3. **Regular updates**: Periodically update the admin password for security.
4. **Environment variables**: Consider moving credentials to environment variables for production.

## Production Deployment

For production deployment, consider:

1. Setting up environment variables for admin credentials
2. Using a more secure password policy
3. Implementing password reset functionality
4. Adding multi-factor authentication

## Troubleshooting

If you're having trouble logging in:

1. Try resetting the admin user: `npm run admin:reset`
2. Check if the database is properly migrated: `npm run db:migrate`
3. Verify the user exists in the database
4. Check the server logs for authentication errors

## Database Schema

The admin user is stored in the `User` table with the following structure:

```sql
model User {
  id        String   @id @default(uuid())
  name      String?
  username  String   @unique
  password  String   // Hashed with bcrypt
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  sessions  Session[]
}
```

The password is hashed using bcrypt with a salt rounds of 12 for security.
