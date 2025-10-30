# Quick Start: AI Context Generation

Get AI-powered context for Bible verses up and running in 5 minutes.

## Prerequisites

- Supabase project configured
- OpenAI or Anthropic API key
- Node.js installed

## Step 1: Database Migration (2 minutes)

```bash
# Run in Supabase SQL Editor
supabase/migrations/002_add_context_columns.sql
```

Or copy and paste:
```sql
ALTER TABLE public.verses
  ADD COLUMN IF NOT EXISTS context TEXT,
  ADD COLUMN IF NOT EXISTS context_generated_by_ai BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS context_generated_at TIMESTAMPTZ;
```

## Step 2: Configure API Key (1 minute)

Edit `.env`:
```bash
# Choose one provider
EXPO_PUBLIC_AI_PROVIDER=anthropic

# Add your API key
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-your-key-here
# OR
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-key-here
```

**Get API Keys:**
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/settings/keys

## Step 3: Test In-App (1 minute)

```typescript
// Navigate to Understand screen from any verse
navigation.navigate('Understand', { verseId: verse.id });
```

The context will generate automatically on first view!

## Step 4: Pre-Generate Context (Optional)

Batch generate for better UX:

```bash
# Test with 10 verses
npx ts-node scripts/generate-contexts.ts --limit 10

# Generate for 100 verses (~2 minutes)
npx ts-node scripts/generate-contexts.ts --limit 100
```

## That's It!

You now have AI-powered context generation working. 🎉

### Common Commands

```bash
# Show statistics
npx ts-node scripts/generate-contexts.ts --stats

# Generate 500 verses
npx ts-node scripts/generate-contexts.ts --limit 500

# Use OpenAI
npx ts-node scripts/generate-contexts.ts --provider openai
```

### Costs

- **gpt-4o-mini:** ~$0.0003/verse (~$0.30 per 1000 verses) ✅ Recommended
- **claude-3-5-sonnet:** ~$0.0033/verse (~$3.30 per 1000 verses)

### Need Help?

See full documentation: `docs/CONTEXT_GENERATION.md`

## Example Context Output

**Verse:** "For God so loved the world..." (John 3:16)

**Generated Context:**
> "This is the most famous verse in Scripture, summarizing the entire gospel message. It reveals God's immense love that motivated Him to sacrifice His Son, offering eternal life to all who believe. Remember this verse as the foundation of your faith—God's love, Christ's sacrifice, and the gift of salvation."

## Troubleshooting

**Context not generating?**
- Check `.env` file has API key
- Verify internet connection
- Check console logs for errors

**Script not running?**
- Install dependencies: `npm install`
- Install ts-node: `npm install -g ts-node`

**Costs too high?**
- Use `gpt-4o-mini` model (cheapest)
- Generate for popular verses only
- Set lower batch limits
