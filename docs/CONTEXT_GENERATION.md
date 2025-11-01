# AI Context Generation - Phase 1 Implementation

This document describes the AI-powered context generation feature for MemoryVerse Bible verses.

## Overview

The context generation system uses AI (OpenAI, Anthropic Claude, or Perplexity) to automatically generate concise, encouraging spiritual explanations for Bible verses. These explanations help users:

1. **Understand the meaning** - Clarifies the spiritual significance
2. **Memorize better** - Provides context that aids retention
3. **Apply practically** - Encourages real-world application

## Features

### Core Functionality

- ✅ **On-demand generation** - Context is generated when a user views a verse in the Understand screen
- ✅ **Caching** - Generated context is stored in Supabase for instant future access
- ✅ **Batch generation** - Server-side script to pre-populate context for all verses
- ✅ **Multiple AI providers** - Supports OpenAI, Anthropic (Claude), and Perplexity
- ✅ **Rate limiting** - Respects API rate limits to control costs
- ✅ **Error handling** - Graceful fallbacks and retry logic
- ✅ **Progress tracking** - Visual feedback during batch operations

### User Experience

- 📖 **UnderstandScreen** - Beautiful UI showing verse with AI-generated context
- 🎨 **AI badge** - Visual indicator showing context source
- 🔄 **Loading states** - Smooth UX while context is generating
- ⚠️ **Error handling** - Clear error messages with retry options
- 💡 **Memory tips** - Additional guidance for memorization

## Architecture

### Database Schema

```sql
-- New columns added to verses table
ALTER TABLE public.verses
  ADD COLUMN context TEXT,
  ADD COLUMN context_generated_by_ai BOOLEAN DEFAULT false,
  ADD COLUMN context_generated_at TIMESTAMPTZ;
```

**Fields:**
- `context` - The AI-generated explanation (1-3 sentences, ~150 words max)
- `context_generated_by_ai` - Flag to distinguish AI vs manually entered context
- `context_generated_at` - Timestamp for tracking and analytics

### Services

#### 1. **contextGenerator.ts**

Core AI integration service with the following methods:

```typescript
// Generate context for a single verse
generateContext(verse: Verse, retries?: number): Promise<ContextGenerationResult>

// Save generated context to database
saveContextToDatabase(verseId: string, context: string): Promise<{success: boolean}>

// Get cached context or generate on-demand
getOrGenerateContext(verseId: string): Promise<{context: string | null, isGenerated: boolean}>

// Batch process multiple verses
batchGenerateContexts(limit: number, onProgress?: Function): Promise<BatchGenerationResult>

// Get statistics
getContextStats(): Promise<{total, withContext, withoutContext, aiGenerated}>
```

**Key Features:**
- Rate limiting (default 50 requests/minute)
- Exponential backoff retry logic (3 attempts)
- Support for OpenAI, Anthropic, and Perplexity APIs
- Progress callbacks for batch operations
- Comprehensive error handling

#### 2. **verseService.ts** (Extended)

Added context-related methods:

```typescript
// Get verse with context (generates if missing)
getVerseWithContext(verseId: string): Promise<{verse, context, contextGenerated, error?}>

// Update context manually
updateVerseContext(verseId: string, context: string, isAiGenerated: boolean): Promise<{success: boolean}>

// Get verses needing context
getVersesNeedingContext(limit: number): Promise<Verse[]>
```

### React Native Components

#### UnderstandScreen

**Route:** `/Understand`
**Params:** `{ verseId: string }`

**Features:**
- Displays verse with reference and category
- Shows AI-generated context in a beautiful card
- Loading state while generating context
- Error handling with retry button
- AI-generated badge
- Memory tips section
- Bible companion animation

**Usage:**
```typescript
navigation.navigate('Understand', { verseId: '12345-abcd-...' });
```

### Configuration

Environment variables in `.env`:

```bash
# AI Provider (choose one)
EXPO_PUBLIC_AI_PROVIDER=anthropic  # or 'openai' or 'perplexity'

# OpenAI Configuration
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
EXPO_PUBLIC_OPENAI_MODEL=gpt-4o-mini

# Anthropic Configuration
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
EXPO_PUBLIC_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Perplexity Configuration
EXPO_PUBLIC_PERPLEXITY_API_KEY=pplx-...
EXPO_PUBLIC_PERPLEXITY_MODEL=sonar

# Rate Limiting
EXPO_PUBLIC_AI_RATE_LIMIT_RPM=50
EXPO_PUBLIC_AI_BATCH_SIZE=10
EXPO_PUBLIC_AI_RETRY_ATTEMPTS=3
EXPO_PUBLIC_AI_RETRY_DELAY_MS=1000
```

**Centralized config:**
```typescript
import { config } from './src/config/env';

config.ai.provider          // 'openai', 'anthropic', or 'perplexity'
config.ai.openai.apiKey     // OpenAI key
config.ai.anthropic.apiKey  // Anthropic key
config.ai.perplexity.apiKey // Perplexity key
config.ai.rateLimitRPM      // Rate limit
```

## Setup Instructions

### 1. Run Database Migration

Apply the migration to add context columns:

```bash
# In Supabase SQL Editor, run:
supabase/migrations/002_add_context_columns.sql
```

Or via Supabase CLI:
```bash
supabase db push
```

### 2. Configure API Keys

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Edit `.env`:
```bash
# Choose your provider
EXPO_PUBLIC_AI_PROVIDER=anthropic

# Add the corresponding API key
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_actual_key_here
```

**Getting API Keys:**

**OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy and paste into `.env`

**Anthropic (Claude):**
1. Go to https://console.anthropic.com/settings/keys
2. Create new API key
3. Copy and paste into `.env`

**Perplexity:**
1. Go to https://www.perplexity.ai/settings/api
2. Create new API key
3. Copy and paste into `.env`

### 3. Batch Generate Context (Optional but Recommended)

Pre-populate context for all verses to reduce user wait times:

```bash
# Generate context for 100 verses
npx ts-node scripts/generate-contexts.ts --limit 100

# Generate for 500 verses
npx ts-node scripts/generate-contexts.ts --limit 500

# Use OpenAI instead of Claude
npx ts-node scripts/generate-contexts.ts --limit 100 --provider openai

# Show statistics only
npx ts-node scripts/generate-contexts.ts --stats
```

**Recommendations:**
- Start with a small batch (50-100) to test
- Monitor API costs before running large batches
- Run during off-peak hours for better rate limits
- With 50 RPM limit, processing 3000 verses takes ~1 hour

### 4. Test In-App

Navigate to the Understand screen with a verse ID:

```typescript
import { verseService } from './src/services/verseService';

// Get a random verse
const verse = await verseService.getRandomVerse('KJV');

// Navigate to Understand screen
navigation.navigate('Understand', { verseId: verse.id });
```

## Usage Examples

### On-Demand Context Generation

```typescript
import { getOrGenerateContext } from './src/services/contextGenerator';

// User views a verse - context generated automatically if missing
const result = await getOrGenerateContext(verseId);

if (result.context) {
  console.log('Context:', result.context);
  console.log('Newly generated:', result.isGenerated);
} else {
  console.error('Error:', result.error);
}
```

### Manual Context Update

```typescript
import { verseService } from './src/services/verseService';

// Manually set context (e.g., curated by theologians)
await verseService.updateVerseContext(
  verseId,
  'This passage teaches...',
  false // not AI-generated
);
```

### Batch Processing with Progress

```typescript
import { batchGenerateContexts } from './src/services/contextGenerator';

const result = await batchGenerateContexts(
  100, // limit
  (current, total) => {
    console.log(`Progress: ${current}/${total}`);
  }
);

console.log(`Success: ${result.successful}, Failed: ${result.failed}`);
```

### Get Statistics

```typescript
import { getContextStats } from './src/services/contextGenerator';

const stats = await getContextStats();
console.log(`${stats.withContext}/${stats.total} verses have context`);
```

## Cost Estimation

### OpenAI Pricing (gpt-4o-mini)

- **Input:** $0.150 per 1M tokens (~$0.00015 per request)
- **Output:** $0.600 per 1M tokens (~$0.00012 per response)
- **Total per verse:** ~$0.00027
- **1000 verses:** ~$0.27
- **31,000 verses (full KJV):** ~$8.37

### Anthropic Pricing (Claude 3.5 Sonnet)

- **Input:** $3.00 per 1M tokens (~$0.0003 per request)
- **Output:** $15.00 per 1M tokens (~$0.003 per response)
- **Total per verse:** ~$0.0033
- **1000 verses:** ~$3.30
- **31,000 verses (full KJV):** ~$102.30

### Perplexity Pricing (Llama 3.1 Sonar Small)

- **Input:** $0.20 per 1M tokens (~$0.0002 per request)
- **Output:** $0.20 per 1M tokens (~$0.00004 per response)
- **Total per verse:** ~$0.00024
- **1000 verses:** ~$0.24
- **31,000 verses (full KJV):** ~$7.44

**Recommendation:** Use **Perplexity (sonar)** or **gpt-4o-mini** for cost-effective batch generation. Perplexity offers the lowest cost while maintaining good quality.

## Rate Limiting

Default configuration:
- **50 requests per minute** (adjustable via `EXPO_PUBLIC_AI_RATE_LIMIT_RPM`)
- **Automatic throttling** with request queue
- **Retry logic** with exponential backoff

Time estimates for batch processing:
- 100 verses: ~2 minutes
- 500 verses: ~10 minutes
- 1000 verses: ~20 minutes
- 5000 verses: ~100 minutes

## Error Handling

The system handles errors gracefully:

1. **Network errors** - Automatic retry with exponential backoff
2. **Rate limit errors** - Automatic throttling and queueing
3. **API errors** - Logged with verse ID for debugging
4. **Invalid responses** - Caught and reported as failed generation

Users see:
- Loading state during generation
- Error message with retry button
- Fallback UI when context unavailable

## Security Considerations

1. **API Keys**
   - Never commit `.env` to git
   - Use environment variables
   - Rotate keys periodically

2. **Database Access**
   - RLS policies control write access
   - Authenticated users can read all contexts
   - Only service role can batch update

3. **Rate Limiting**
   - Prevents abuse
   - Controls costs
   - Protects API quotas

## Future Enhancements (Phase 2-5)

### Phase 2: In-App Integration
- [ ] Companion messaging based on context
- [ ] Personalized daily recommendations
- [ ] Premium gating for on-demand generation
- [ ] Analytics tracking

### Phase 3: User Experience
- [ ] Context regeneration with custom prompts
- [ ] User feedback on context quality
- [ ] Save favorite contexts
- [ ] Share contexts

### Phase 4: Advanced Features
- [ ] Multi-language context generation
- [ ] Category-specific prompts
- [ ] Audio TTS for contexts
- [ ] Reading plans based on themes

### Phase 5: AI Enhancements
- [ ] NLP auto-categorization refinement
- [ ] Context personalization per user level
- [ ] Verse connections and cross-references
- [ ] Study guide generation

## Troubleshooting

### Context not generating

**Check:**
1. API key is set correctly in `.env`
2. Internet connection is active
3. Supabase URL and anon key are valid
4. Migration has been applied
5. Check logs for specific error messages

### Batch script fails

**Common issues:**
1. TypeScript not installed: `npm install -g ts-node typescript`
2. Missing dependencies: `npm install`
3. Environment variables not loaded: Make sure `.env` file exists
4. Rate limit exceeded: Reduce `--limit` or increase `AI_RATE_LIMIT_RPM`

### Slow generation

**Optimize:**
1. Use gpt-4o-mini instead of gpt-4
2. Increase rate limit (if API allows)
3. Run batch generation server-side
4. Use Anthropic which may have higher limits

### High costs

**Reduce costs:**
1. Use gpt-4o-mini (cheapest option)
2. Generate context for popular verses only
3. Set reasonable batch limits
4. Monitor usage via API dashboard

## Support

For issues or questions:
1. Check this documentation
2. Review error logs in console
3. Test with small batches first
4. Verify API keys and configuration

## Conclusion

Phase 1 is complete! The AI context generation system is fully functional with:

✅ Database migrations
✅ AI service integration (OpenAI + Anthropic)
✅ React Native Understand screen
✅ Batch processing scripts
✅ Error handling and retries
✅ Cost-effective configuration
✅ Comprehensive documentation

**Next Steps:** Test the system with a small batch, then proceed to Phase 2 for in-app integration and user experience enhancements.
