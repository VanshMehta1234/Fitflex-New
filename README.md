# React Authentication App with Supabase

This is a production-ready React application with full authentication functionality powered by Supabase.

## Features

- User authentication (login, signup, logout)
- Password reset functionality
- Protected routes
- Session persistence across page reloads
- Role-based access control (admin and user roles)
- Different dashboards for different user roles
- Dashboard and home pages
- Responsive design

## Reset Password Functionality

The app includes a complete password reset flow:

1. User clicks "Forgot password?" on the login page
2. User enters their email and receives a reset password link
3. Clicking the link in the email takes them to the reset password page
4. The system verifies the reset token in the URL
5. User can enter a new password and confirm it
6. On successful password change, they are redirected to login page

The reset password process is secure and robust:
- Links expire after a period set by Supabase (typically 24 hours)
- The system handles expired tokens gracefully
- Users cannot reuse their old password
- Passwords require minimum 6 characters for security
- Password strength validation with visual feedback

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a Supabase account and project at https://supabase.com
4. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. Start the development server:
   ```
   npm start
   ```

## Supabase Setup

1. Create a new project in Supabase
2. Go to Authentication > Settings and enable Email provider
3. Configure your project URL (the URL where your app is hosted)
4. Set up the database by executing the SQL in `database-setup.sql` in the Supabase SQL Editor
5. Make sure the following tables and columns are created:
   - `profiles` table with the following columns:
     - id (uuid, primary key)
     - name (text)
     - profile_image (text)
     - role (text, default: 'user')
     - streak (integer, default: 0)
     - membershipType (text, default: 'Basic')
     - created_at (timestamp with time zone, default: now())
     - updated_at (timestamp with time zone, default: now())
6. Copy your project URL and anon key from Project Settings > API and add them to your `.env` file

## Toast Notifications

The app uses `react-hot-toast` for displaying toast notifications. These are shown for:
- Profile updates
- Login/logout
- Errors
- Image uploads
- Password reset emails and confirmations

## Troubleshooting

If profile updates are not working:
1. Check that your Supabase URL and Anon Key are correctly set in the `.env` file
2. Make sure the `profiles` table has been created in Supabase
3. Verify that Row Level Security policies are set up correctly as defined in `database-setup.sql`
4. Check the browser console for any errors
5. Ensure you are logged in (authenticated) before trying to update a profile
6. Run the `fix-profiles-table.sql` script in the Supabase SQL Editor to ensure all required columns exist

If password reset is not working:
1. Verify your Supabase project has Email auth enabled in Authentication > Providers
2. Make sure Site URL is correctly set in Authentication > URL Configuration
3. Check for any CORS issues - add your site URL to the allowed domains
4. Ensure your app URL is correctly set in the `.env` file
5. Check browser console for any error messages
6. Try clearing cache and cookies if the reset link doesn't work

## Fixing Database Issues

If you're experiencing issues with the profiles table, you can run the `fix-profiles-table.sql` script in the Supabase SQL Editor. This script:

1. Checks if the profiles table exists and creates it if it doesn't
2. Verifies all required columns exist and adds any missing ones
3. Ensures Row Level Security is enabled
4. Creates necessary RLS policies if they don't exist
5. Creates an index on the user_id column for faster queries

This script is designed to fix issues without modifying existing data.

## Project Structure

- `/src/components` - Reusable UI components
- `/src/context` - React context for authentication
- `/src/pages` - Main application pages
- `/src/styles` - CSS stylesheets
- `/src/supabase.ts` - Supabase client configuration

## Available Scripts

- `npm start` - Run the development server
- `npm build` - Build the app for production
- `npm test` - Run tests
- `npm eject` - Eject from create-react-app

## Deployment

To deploy the application:

1. Build the app with `npm run build`
2. Deploy the build folder to your hosting provider of choice
3. Ensure you've set up the environment variables on your hosting platform

## Technologies Used

- React
- TypeScript
- Supabase (Authentication & Database)
- React Router
