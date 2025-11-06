# OneBox Email System Documentation

## System Overview

OneBox is a unified email management system that allows users to connect multiple email accounts through OAuth and manage them in a single interface. The system uses Nylas for email integration and Supabase for authentication and data storage.

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 with App Router
- **Backend**: Serverless functions via Next.js API routes
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Email Integration**: Nylas API (v3)
- **Styling**: Tailwind CSS

### Core Components

1. **Authentication System**
   - Supabase Auth for user management
   - Custom OAuth flow for email account connection
   - JWT-based session management

2. **Database Schema**
   ```sql
   -- Users table
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     auth_id UUID UNIQUE,  -- Links to Supabase Auth
     email TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Email Accounts table
   CREATE TABLE email_accounts (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES users(id),
     grant_id TEXT UNIQUE,  -- Nylas grant ID
     email TEXT,
     provider TEXT,
     grant_status TEXT,
     is_primary BOOLEAN DEFAULT false,
     settings JSONB,
     connected_at TIMESTAMPTZ,
     last_sync TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. **Row Level Security (RLS)**
   - Users can only access their own data
   - Service role bypass for admin operations
   - Secure multi-tenant data access

## Authentication Flow

1. **User Registration/Login**
   - User signs up/in through Supabase Auth
   - JWT token is generated and stored
   - User record is created in users table

2. **Email Account Connection**
   ```mermaid
   sequenceDiagram
     participant User
     participant App
     participant Nylas
     participant Supabase
     
     User->>App: Initiate email connection
     App->>Nylas: Request OAuth URL
     Nylas->>User: Present OAuth consent
     User->>Nylas: Grant access
     Nylas->>App: Callback with code
     App->>Nylas: Exchange code for token
     App->>Supabase: Store grant details
     App->>User: Redirect to dashboard
   ```

3. **Authorization States**
   - Connected: Valid grant with active sync
   - Invalid: Grant expired or revoked
   - Pending: Connection in progress

## API Routes

### Authentication
- `/api/auth/callback` - OAuth callback handler
- `/api/auth/[...supabase]` - Supabase auth routes

### Data Flow
1. User initiates email connection
2. State parameter includes:
   ```typescript
   {
     userId: string;  // Supabase auth.uid()
     provider: string; // Email provider (google, outlook, etc)
   }
   ```
3. Callback processes:
   - Validates callback parameters
   - Exchanges code for Nylas grant
   - Creates/updates user record
   - Creates email account record
   - Associates grant with user

## Security Features

1. **Row Level Security Policies**
   ```sql
   -- Users table policies
   CREATE POLICY "Users can view own data" ON users
     FOR SELECT USING (auth.uid() = auth_id);

   CREATE POLICY "Users can update own data" ON users
     FOR UPDATE 
     USING (auth.uid() = auth_id)
     WITH CHECK (auth.uid() = auth_id);

   -- Email accounts table policies
   CREATE POLICY "Users can view own email accounts" ON email_accounts
     FOR ALL USING (
       user_id IN (
         SELECT id FROM users WHERE auth_id = auth.uid()
       )
     );
   ```

2. **Service Role Access**
   - Bypass RLS for administrative operations
   - Secure API routes for system operations

## Environment Configuration

Required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NYLAS_API_KEY=your_nylas_api_key
NEXT_PUBLIC_NYLAS_CLIENT_ID=your_nylas_client_id
NEXT_PUBLIC_CALLBACK_URI=your_callback_uri
```

## Current Features

1. **Authentication**
   - User signup/login via Supabase
   - Multiple email account connections
   - OAuth flow with state management

2. **Account Management**
   - Connect multiple email accounts
   - Primary account designation
   - Provider-specific settings storage

3. **Security**
   - Row-level security
   - JWT authentication
   - Secure token handling

## Implementation Details

### OAuth Flow Implementation

```typescript
// State generation
const state = Buffer.from(JSON.stringify({
  userId: user.id,
  provider: provider
})).toString('base64')

// Callback handling
const stateData = JSON.parse(
  Buffer.from(state, 'base64').toString()
)
```

### Database Operations

1. **User Creation**
```typescript
const { error: userError } = await supabaseAdmin
  .from('users')
  .upsert({
    auth_id: stateData.userId,
    email: tokenData.email
  }, {
    onConflict: 'auth_id'
  })
```

2. **Email Account Creation**
```typescript
const accountData = {
  user_id: userData.id,
  grant_id: tokenData.grant_id,
  email: tokenData.email,
  provider: stateData.provider,
  grant_status: 'valid',
  is_primary: isPrimary,
  settings: {
    scope: tokenData.scope,
    provider_type: tokenData.provider
  }
}
```

## Error Handling

1. **OAuth Errors**
   - Missing parameters
   - Invalid state
   - Token exchange failures
   - Database conflicts

2. **Response Handling**
   - Detailed error logging
   - User-friendly error messages
   - Graceful failure recovery

## Next Steps

1. **Dashboard Implementation**
   - Email list view
   - Account switching
   - Settings management

2. **Email Operations**
   - Fetch and display emails
   - Send new emails
   - Handle attachments
   - Search functionality

3. **Sync Management**
   - Background sync
   - Real-time updates
   - Webhook integration

## Development Guidelines

1. **Code Organization**
   - Route handlers in `/app/api`
   - Components in `/components`
   - Database operations in `/lib`
   - Types in `/types`

2. **Best Practices**
   - Use TypeScript for type safety
   - Implement error boundaries
   - Follow Next.js patterns
   - Maintain RLS policies

## Troubleshooting

Common issues and solutions:

1. **OAuth Connection Failures**
   - Check environment variables
   - Verify callback URL configuration
   - Validate state parameter
   - Check service role permissions

2. **Database Issues**
   - Verify RLS policies
   - Check foreign key constraints
   - Validate unique constraints
   - Monitor grant status

---

This documentation will be updated as new features are implemented and the system evolves.