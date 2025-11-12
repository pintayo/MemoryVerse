# Sentry Error Tracking Guide

This document describes the comprehensive Sentry error tracking implemented in MemoryVerse.

## Overview

Sentry is now fully integrated with:
- ✅ **User Context** - Know which user experienced each error
- ✅ **Breadcrumbs** - See the trail of events leading to errors
- ✅ **Error Categories** - Errors tagged by type (auth, database, verse, AI, etc.)
- ✅ **Enhanced Context** - Extra data for debugging (verse IDs, operations, etc.)
- ✅ **Production-Only** - Silent in development, active in production

## What Gets Tracked

### 1. User Context

**When**: Automatically set on user login, cleared on logout

**What**:
- User ID
- Email address
- Full name (if available)

**Location**: `src/contexts/AuthContext.tsx`

```typescript
// Set on login
setSentryUser(userId, profile.email, profile.full_name);

// Cleared on logout
clearSentryUser();
```

**Benefit**: Know exactly which user experienced each error.

---

### 2. Breadcrumbs

Breadcrumbs create a trail of events leading up to an error.

#### Navigation Breadcrumbs
**When**: User navigates between screens

**Example**:
```
navigation: Navigated to HomeScreen
navigation: Navigated to UnderstandScreen (verseId: abc123)
```

#### Action Breadcrumbs
**When**: User performs actions

**Examples**:
```
user-action: Profile loaded (userId: xyz)
user-action: User signed out
user-action: Verse practiced
```

#### Database Breadcrumbs
**When**: Database operations occur

**Examples**:
```
database: SELECT verses (success: true, verseId: abc123)
database: UPDATE user_verse_progress (success: true)
database: SELECT verses (success: false, error: "Not found")
```

**Location**: `src/services/verseService.ts`

#### API Breadcrumbs
**When**: External API calls (AI providers)

**Examples**:
```
http: POST AI Context API (provider: anthropic, attempt: 1)
http: POST AI Context API (provider: perplexity, status: 429)
```

**Location**: `src/services/contextGenerator.ts`

---

### 3. Error Categories

Errors are automatically categorized with tags for easy filtering:

#### Authentication Errors
**Tag**: `error_type: authentication`

**Tracked in**:
- Login failures
- Session initialization errors
- Profile loading errors
- Sign out errors

**Examples**:
- Invalid credentials
- Token refresh failures
- Session expired

**Handler**: `errorHandlers.handleAuthError(error, 'login')`

---

#### Database Errors
**Tag**: `error_type: database`

**Tracked in**:
- Supabase query failures
- Row Level Security violations
- Connection errors

**Extra Context**:
- `operation` - SELECT, INSERT, UPDATE, DELETE
- `table` - Which table was accessed
- `query_params` - Query parameters used

**Handler**: `errorHandlers.handleDatabaseError(error, 'SELECT', 'verses')`

---

#### Verse Loading Errors
**Tag**: `error_type: verse`

**Tracked in**:
- Verse fetching failures
- Verse not found errors
- Context loading errors

**Extra Context**:
- `verse_id` - Which verse failed to load
- `feature` - Which feature triggered it

**Handler**: `errorHandlers.handleVerseError(error, verseId)`

---

#### Practice Session Errors
**Tag**: `error_type: practice`

**Tracked in**:
- Practice session creation failures
- Speech recognition errors
- XP calculation errors

**Extra Context**:
- `session_type` - 'read', 'recall', 'recite'
- `accuracy` - User's accuracy percentage

**Handler**: `errorHandlers.handlePracticeError(error, 'recall')`

---

#### AI Generation Errors
**Tag**: `error_type: ai`
**Level**: `warning` (less critical than other errors)

**Tracked in**:
- AI context generation failures
- API rate limiting
- API timeout errors

**Extra Context**:
- `provider` - 'anthropic', 'openai', 'perplexity'
- `verse_id` - Which verse context failed
- `attempt` - Retry attempt number

**Handler**: `errorHandlers.handleAIError(error, 'anthropic', verseId)`

---

#### API Errors (General)
**Tag**: `error_type: api`

**Tracked in**:
- External API failures
- Network errors
- Timeout errors

**Extra Context**:
- `endpoint` - API endpoint called
- `method` - HTTP method (GET, POST, etc.)
- `status_code` - HTTP status code

**Handler**: `errorHandlers.handleAPIError(error, '/api/verses', 'GET')`

---

### 4. Enhanced Exception Capture

All errors are captured with rich context:

```typescript
captureException(error, {
  tags: {
    error_type: 'authentication',
    action: 'login',
  },
  extra: {
    user_id: 'abc123',
    email: 'user@example.com',
  },
  level: 'error',
});
```

**Available Levels**:
- `fatal` - Critical errors that crash the app
- `error` - Errors that break functionality
- `warning` - Issues that don't break functionality
- `info` - Informational messages
- `debug` - Debug information

---

## Error Tracking Flow

### Example: Verse Loading Error

1. **User navigates to Understand screen**
   ```
   Breadcrumb: navigation -> UnderstandScreen (verseId: 123)
   ```

2. **App attempts to fetch verse from database**
   ```
   Breadcrumb: database -> SELECT verses (verseId: 123)
   ```

3. **Database query fails**
   ```
   Error captured with:
   - Tag: error_type = verse
   - Tag: feature = verse_loading
   - Extra: verse_id = 123
   - User: user@example.com (if logged in)
   - Breadcrumbs: All above events
   ```

4. **In Sentry, you see**:
   - Who: user@example.com
   - What: Database SELECT failed
   - Where: verseService.getVerseById
   - Why: Breadcrumb trail shows navigation → database query
   - Context: verse_id, user_id, timestamp

---

## Locations of Error Tracking

### Core Error Tracking
- **Logger**: `src/utils/logger.ts` - Sends errors to Sentry in production
- **Sentry Helper**: `src/utils/sentryHelper.ts` - Enhanced tracking utilities
- **App Wrapper**: `App.tsx` - Sentry initialization and error boundary

### Service Layer
- **Auth Context**: `src/contexts/AuthContext.tsx` - User context, auth errors
- **Verse Service**: `src/services/verseService.ts` - Database breadcrumbs, verse errors
- **Context Generator**: `src/services/contextGenerator.ts` - AI errors, API breadcrumbs
- **Profile Service**: `src/services/profileService.ts` - Profile loading errors
- **Auth Service**: `src/services/authService.ts` - Authentication errors

### Screen Layer
All screens use `logger.error()` which automatically sends to Sentry:
- `HomeScreen.tsx`
- `UnderstandScreen.tsx`
- `RecallScreen.tsx`
- `PrayScreen.tsx`
- `ProfileScreen.tsx`
- `LeaderboardScreen.tsx`
- `LoginScreen.tsx`
- `SignupScreen.tsx`

---

## Using Sentry Helpers

### Set User Context
```typescript
import { setSentryUser, clearSentryUser } from '../utils/sentryHelper';

// On login
setSentryUser(userId, email, username);

// On logout
clearSentryUser();
```

### Add Breadcrumbs
```typescript
import {
  addNavigationBreadcrumb,
  addActionBreadcrumb,
  addDatabaseBreadcrumb,
  addAPIBreadcrumb
} from '../utils/sentryHelper';

// Navigation
addNavigationBreadcrumb('HomeScreen', { source: 'login' });

// User action
addActionBreadcrumb('Verse favorited', { verseId: '123' });

// Database operation
addDatabaseBreadcrumb('UPDATE', 'profiles', true, { userId: '123' });

// API call
addAPIBreadcrumb('POST', 'https://api.example.com', 200, { body: {...} });
```

### Capture Errors with Context
```typescript
import { errorHandlers, captureException } from '../utils/sentryHelper';

// Use predefined handlers
try {
  await authService.login(email, password);
} catch (error) {
  errorHandlers.handleAuthError(error, 'login');
}

// Or capture with custom context
try {
  await doSomething();
} catch (error) {
  captureException(error, {
    tags: {
      feature: 'custom_feature',
      user_type: 'premium',
    },
    extra: {
      custom_data: 'value',
    },
    level: 'error',
  });
}
```

### Set Custom Tags
```typescript
import { setSentryTag, setSentryContext } from '../utils/sentryHelper';

// Set a tag
setSentryTag('app_version', '1.0.0');
setSentryTag('user_tier', 'premium');

// Set context
setSentryContext('device', {
  model: 'iPhone 14',
  os: 'iOS 17',
  memory: '6GB',
});
```

---

## Sentry Dashboard Usage

### Viewing Errors by Category

**Filter by error type**:
- `error_type:authentication` - All auth errors
- `error_type:database` - All database errors
- `error_type:verse` - All verse loading errors
- `error_type:practice` - All practice session errors
- `error_type:ai` - All AI generation errors

**Filter by feature**:
- `feature:verse_loading` - Verse loading issues
- `feature:practice_session` - Practice session issues

**Filter by user**:
- `user.email:user@example.com` - Errors for specific user
- `user.id:abc123` - Errors for specific user ID

### Understanding Error Context

Each error in Sentry shows:
1. **Error message** - What went wrong
2. **Stack trace** - Where it happened
3. **Breadcrumbs** - Events leading to error
4. **Tags** - error_type, feature, provider, etc.
5. **Context** - verse_id, operation, user data
6. **User** - Who experienced it

---

## Testing Sentry Integration

### In Development
Sentry is **disabled** in development (`__DEV__ = true`).
Errors are logged to console only.

### In Production
To test Sentry in a production build:

1. **Build production version**:
   ```bash
   eas build --platform ios --profile production
   # or
   eas build --platform android --profile production
   ```

2. **Trigger a test error**:
   ```typescript
   // Add temporarily to a screen
   throw new Error('Sentry test error');
   ```

3. **Check Sentry Dashboard**:
   - Go to https://sentry.io
   - Select your project
   - View recent issues
   - Verify error appears with full context

4. **Remove test error** before deploying

---

## Best Practices

### 1. Always Use Error Handlers
```typescript
// ✅ Good
try {
  await verseService.getVerseById(id);
} catch (error) {
  errorHandlers.handleVerseError(error, id);
}

// ❌ Bad
try {
  await verseService.getVerseById(id);
} catch (error) {
  console.log('Error:', error); // Lost in production!
}
```

### 2. Add Context to Errors
```typescript
// ✅ Good - Includes context
errorHandlers.handlePracticeError(error, sessionType);

// ❌ Bad - No context
logger.error('Error in practice:', error);
```

### 3. Use Appropriate Error Levels
```typescript
// Fatal - App crashes
captureException(error, { level: 'fatal' });

// Error - Feature broken
captureException(error, { level: 'error' });

// Warning - Degraded but functional
captureException(error, { level: 'warning' });
```

### 4. Add Breadcrumbs for Important Actions
```typescript
addActionBreadcrumb('Started practice session', {
  sessionType: 'recall',
  verseCount: 5
});
```

### 5. Set User Context Early
```typescript
// Set as soon as user is authenticated
setSentryUser(user.id, user.email, user.name);
```

---

## Privacy Considerations

### What Sentry Collects
- ✅ Error messages and stack traces
- ✅ User IDs and emails (for logged-in users)
- ✅ Screen names and navigation paths
- ✅ Verse IDs (not verse content)
- ✅ Timestamps and device info

### What Sentry Does NOT Collect
- ❌ Passwords or authentication tokens
- ❌ Full verse text content
- ❌ User's practice answers
- ❌ Prayer recordings
- ❌ Personal notes

### GDPR Compliance
- Users can request data deletion via Sentry
- User context is cleared on logout
- No PII in error messages
- All data encrypted in transit and at rest

---

## Performance Monitoring

Sentry also tracks performance:

```typescript
import { startTransaction } from '../utils/sentryHelper';

const transaction = startTransaction('Load verse', 'http.server');

try {
  // Your code
  await verseService.getVerseById(id);

  transaction?.finish();
} catch (error) {
  transaction?.setStatus('internal_error');
  transaction?.finish();
}
```

---

## Troubleshooting

### Errors Not Appearing in Sentry

1. **Check DSN is set**:
   ```bash
   echo $EXPO_PUBLIC_SENTRY_DSN
   ```

2. **Verify Sentry is enabled**:
   ```bash
   echo $EXPO_PUBLIC_SENTRY_ENABLED
   # Should be 'true'
   ```

3. **Check you're in production mode**:
   - Sentry is disabled in development (`__DEV__ = true`)
   - Build with `eas build --profile production`

4. **Check Sentry initialization**:
   - Look for `[App.tsx] Sentry initialized` in logs
   - Look for `[Sentry] User context set` after login

### Too Many Errors

1. **Filter by error level**:
   - Focus on `fatal` and `error` first
   - Investigate `warning` later

2. **Group by error type**:
   - Use tags to group similar errors
   - Fix root causes, not symptoms

3. **Set up alerts**:
   - Alert on fatal errors immediately
   - Daily digest for warnings

---

## Cost Optimization

Sentry free tier includes:
- 5,000 errors/month
- 10,000 transactions/month
- 1 project

To stay within limits:
- Use `tracesSampleRate: 0.2` (20% of transactions)
- Filter out noisy errors
- Group similar errors
- Set up rate limiting per issue

---

## Next Steps

1. **Set up Sentry project** (see PRODUCTION_GUIDE.md)
2. **Configure alerts** for critical errors
3. **Monitor dashboard** regularly
4. **Set up releases** to track which version has errors
5. **Integrate with Slack/Discord** for notifications

---

**Last Updated**: 2025-11-10
**Implemented By**: Claude Code Assistant
**Related Docs**: PRODUCTION_GUIDE.md, FIREBASE_SETUP.md
