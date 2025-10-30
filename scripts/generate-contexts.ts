#!/usr/bin/env ts-node
/**
 * Batch Context Generation Script
 *
 * Generates AI context for Bible verses that don't have context yet.
 * This script should be run server-side to pre-populate context for all verses.
 *
 * Usage:
 *   npx ts-node scripts/generate-contexts.ts [--limit 100] [--provider anthropic]
 *
 * Options:
 *   --limit <number>     Maximum number of verses to process (default: 100)
 *   --provider <string>  AI provider to use: 'openai' or 'anthropic' (default: anthropic)
 *   --stats              Show statistics only, don't generate
 *   --help               Show this help message
 */

import { createClient } from '@supabase/supabase-js';
import { config } from '../src/config/env';
import { batchGenerateContexts, getContextStats } from '../src/services/contextGenerator';

// Parse command-line arguments
function parseArgs(): {
  limit: number;
  provider: 'openai' | 'anthropic';
  statsOnly: boolean;
  help: boolean;
} {
  const args = process.argv.slice(2);
  let limit = 100;
  let provider: 'openai' | 'anthropic' = 'anthropic';
  let statsOnly = false;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg === '--stats' || arg === '-s') {
      statsOnly = true;
    } else if (arg === '--limit' || arg === '-l') {
      limit = parseInt(args[++i], 10);
      if (isNaN(limit) || limit <= 0) {
        console.error('❌ Error: --limit must be a positive number');
        process.exit(1);
      }
    } else if (arg === '--provider' || arg === '-p') {
      const providerArg = args[++i];
      if (providerArg !== 'openai' && providerArg !== 'anthropic') {
        console.error('❌ Error: --provider must be "openai" or "anthropic"');
        process.exit(1);
      }
      provider = providerArg;
    }
  }

  return { limit, provider, statsOnly, help };
}

// Display help message
function showHelp() {
  console.log(`
📖 Batch Context Generation Script

Generates AI-powered spiritual context for Bible verses.

Usage:
  npx ts-node scripts/generate-contexts.ts [options]

Options:
  --limit, -l <number>      Max verses to process (default: 100)
  --provider, -p <string>   AI provider: 'openai' or 'anthropic' (default: anthropic)
  --stats, -s               Show statistics only, don't generate
  --help, -h                Show this help message

Examples:
  # Generate context for 50 verses using Claude
  npx ts-node scripts/generate-contexts.ts --limit 50 --provider anthropic

  # Generate context for 200 verses using GPT-4
  npx ts-node scripts/generate-contexts.ts --limit 200 --provider openai

  # Show statistics only
  npx ts-node scripts/generate-contexts.ts --stats

Environment Variables:
  EXPO_PUBLIC_SUPABASE_URL          Supabase project URL
  EXPO_PUBLIC_SUPABASE_ANON_KEY     Supabase anonymous key
  EXPO_PUBLIC_OPENAI_API_KEY        OpenAI API key (if using OpenAI)
  EXPO_PUBLIC_ANTHROPIC_API_KEY     Anthropic API key (if using Claude)

Note: Make sure to set the appropriate API key in your .env file before running.
  `);
}

// Display statistics
async function displayStats() {
  console.log('📊 Fetching context statistics...\n');

  const stats = await getContextStats();

  console.log('╔═══════════════════════════════════════╗');
  console.log('║     Context Generation Statistics     ║');
  console.log('╠═══════════════════════════════════════╣');
  console.log(`║ Total verses:           ${stats.total.toString().padStart(12)} ║`);
  console.log(`║ With context:           ${stats.withContext.toString().padStart(12)} ║`);
  console.log(`║ Without context:        ${stats.withoutContext.toString().padStart(12)} ║`);
  console.log(`║ AI-generated:           ${stats.aiGenerated.toString().padStart(12)} ║`);
  console.log('╚═══════════════════════════════════════╝');

  if (stats.total > 0) {
    const percentage = ((stats.withContext / stats.total) * 100).toFixed(1);
    console.log(`\n✨ Coverage: ${percentage}% of verses have context\n`);
  }

  if (stats.withoutContext > 0) {
    console.log(`💡 Tip: Run this script to generate context for ${stats.withoutContext} verses.\n`);
  } else {
    console.log('🎉 All verses have context!\n');
  }
}

// Main function
async function main() {
  const { limit, provider, statsOnly, help } = parseArgs();

  // Show help
  if (help) {
    showHelp();
    return;
  }

  console.log('');
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   AI Context Generation for Verses    ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log('');

  // Validate configuration
  if (!config.supabase.url || !config.supabase.anonKey) {
    console.error('❌ Error: Supabase configuration missing');
    console.error('   Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  if (provider === 'openai' && !config.ai.openai.apiKey) {
    console.error('❌ Error: OpenAI API key missing');
    console.error('   Please set EXPO_PUBLIC_OPENAI_API_KEY in your .env file');
    process.exit(1);
  }

  if (provider === 'anthropic' && !config.ai.anthropic.apiKey) {
    console.error('❌ Error: Anthropic API key missing');
    console.error('   Please set EXPO_PUBLIC_ANTHROPIC_API_KEY in your .env file');
    process.exit(1);
  }

  // Show statistics
  await displayStats();

  // If stats-only mode, exit
  if (statsOnly) {
    return;
  }

  // Confirm before proceeding
  console.log(`⚙️  Configuration:`);
  console.log(`   Provider:       ${provider}`);
  console.log(`   Model:          ${provider === 'openai' ? config.ai.openai.model : config.ai.anthropic.model}`);
  console.log(`   Batch limit:    ${limit} verses`);
  console.log(`   Rate limit:     ${config.ai.rateLimitRPM} requests/min`);
  console.log('');

  // Estimate time
  const estimatedMinutes = Math.ceil(limit / config.ai.rateLimitRPM);
  console.log(`⏱️  Estimated time: ~${estimatedMinutes} minute${estimatedMinutes !== 1 ? 's' : ''}`);
  console.log('');

  console.log('🚀 Starting context generation...');
  console.log('   (Press Ctrl+C to cancel)');
  console.log('');

  const startTime = Date.now();

  try {
    // Run batch generation
    const result = await batchGenerateContexts(limit, (current, total) => {
      const percentage = ((current / total) * 100).toFixed(0);
      const bar = '█'.repeat(Math.floor(current / total * 30));
      const empty = '░'.repeat(30 - Math.floor(current / total * 30));
      process.stdout.write(`\r   Progress: [${bar}${empty}] ${percentage}% (${current}/${total})`);
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);

    console.log('\n');
    console.log('╔═══════════════════════════════════════╗');
    console.log('║          Generation Complete!          ║');
    console.log('╠═══════════════════════════════════════╣');
    console.log(`║ Total processed:        ${result.totalProcessed.toString().padStart(12)} ║`);
    console.log(`║ Successful:             ${result.successful.toString().padStart(12)} ║`);
    console.log(`║ Failed:                 ${result.failed.toString().padStart(12)} ║`);
    console.log(`║ Duration:               ${duration.padStart(9)}s ║`);
    console.log('╚═══════════════════════════════════════╝');
    console.log('');

    // Show errors if any
    if (result.errors.length > 0) {
      console.log('⚠️  Errors encountered:');
      result.errors.slice(0, 10).forEach(({ verseId, error }) => {
        console.log(`   • Verse ${verseId}: ${error}`);
      });
      if (result.errors.length > 10) {
        console.log(`   ... and ${result.errors.length - 10} more errors`);
      }
      console.log('');
    }

    if (result.successful > 0) {
      console.log('✅ Context generation completed successfully!');
      console.log(`   ${result.successful} verse${result.successful !== 1 ? 's' : ''} now have AI-generated context.`);
    }

    if (result.failed > 0) {
      console.log(`\n⚠️  ${result.failed} verse${result.failed !== 1 ? 's' : ''} failed. You can retry by running the script again.`);
    }

    console.log('');

    // Show updated statistics
    await displayStats();

  } catch (error) {
    console.error('\n❌ Error during batch generation:');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('❌ Unexpected error:');
  console.error(error);
  process.exit(1);
});
