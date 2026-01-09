#!/usr/bin/env node

/**
 * Auto-generate AI_CONTEXT.md from git history and project health
 * 
 * Usage: node scripts/update-context.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');

// Helper to run shell commands safely
function exec(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function normalizeVersion(version) {
  if (typeof version !== 'string') {
    return null;
  }

  const trimmed = version.trim();
  const firstDigit = trimmed.search(/[0-9]/);
  if (firstDigit === -1) {
    return trimmed;
  }

  return trimmed.slice(firstDigit);
}

// Utility for future file stats feature - currently unused
function _countMarkdownFiles(dirPath) {
  let count = 0;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        count += _countMarkdownFiles(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        count += 1;
      }
    }
  } catch {
    // Ignore missing directories or permission issues
  }

  return count;
}

function getDependencyVersion(allDeps, name) {
  const raw = allDeps?.[name];
  return normalizeVersion(raw) ?? null;
}

// Read package.json for an accurate stack snapshot
const packageJson = readJson(path.join(repoRoot, 'package.json')) ?? {};
const allDeps = {
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.devDependencies ?? {}),
};

const versions = {
  next: getDependencyVersion(allDeps, 'next'),
  react: getDependencyVersion(allDeps, 'react'),
  typescript: getDependencyVersion(allDeps, 'typescript'),
  tailwind: getDependencyVersion(allDeps, 'tailwindcss'),
  drizzleOrm: getDependencyVersion(allDeps, 'drizzle-orm'),
  clerk: getDependencyVersion(allDeps, '@clerk/nextjs'),
  nextAuth: getDependencyVersion(allDeps, 'next-auth'),
  upstashRedis: getDependencyVersion(allDeps, '@upstash/redis'),
  upstashVector: getDependencyVersion(allDeps, '@upstash/vector'),
  trigger: getDependencyVersion(allDeps, '@trigger.dev/sdk'),
  stripe: getDependencyVersion(allDeps, 'stripe'),
  sentry: getDependencyVersion(allDeps, '@sentry/nextjs'),
};

const authProvider = versions.clerk ? 'Clerk' : versions.nextAuth ? 'NextAuth' : 'Unknown';

const techStackParts = [
  versions.next ? `Next.js ${versions.next}` : 'Next.js',
  versions.react ? `React ${versions.react}` : 'React',
  versions.typescript ? `TypeScript ${versions.typescript}` : 'TypeScript',
  versions.tailwind ? `Tailwind CSS ${versions.tailwind}` : 'Tailwind CSS',
  authProvider !== 'Unknown' ? `${authProvider} Auth` : 'Auth',
  versions.drizzleOrm ? `Drizzle ORM ${versions.drizzleOrm}` : 'Drizzle ORM',
  'Neon Postgres',
  versions.upstashRedis || versions.upstashVector ? 'Upstash (Redis/Vector)' : null,
  versions.trigger ? 'Trigger.dev' : null,
  versions.stripe ? 'Stripe' : null,
  versions.sentry ? 'Sentry' : null,
].filter(Boolean);

const techStackLine = techStackParts.join(', ');

// Get git info
const currentBranch = exec('git branch --show-current');

function parseGitLog(raw) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [date, hash, subject] = line.split('\t');
      return { date, hash, subject };
    })
    .filter((c) => c.date && c.hash && c.subject);
}

function isAutoContextCommit(subject) {
  const normalized = String(subject).trim().toLowerCase();
  return (
    normalized === 'docs(status): update ai context' ||
    normalized === 'docs(status): update ai_context' ||
    normalized === 'docs: update ai context' ||
    normalized === 'docs: update ai_context'
  );
}

function extractBlock(source, startMarker, endMarker) {
  if (!source) return null;
  const startIdx = source.indexOf(startMarker);
  const endIdx = source.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;

  const afterStart = startIdx + startMarker.length;
  return source.slice(afterStart, endIdx).trim();
}

const outputPath = path.join(repoRoot, 'docs', 'status', 'AI_CONTEXT.md');
const existingContent = fs.existsSync(outputPath)
  ? fs.readFileSync(outputPath, 'utf8')
  : '';

const manualStatusStart = '<!-- AI_CONTEXT:STATUS_START -->';
const manualStatusEnd = '<!-- AI_CONTEXT:STATUS_END -->';
const preservedStatus =
  extractBlock(existingContent, manualStatusStart, manualStatusEnd) ??
  `- Focus: 
- Next: 
- Risks: `;

// Pull a structured commit list (avoid enormous sections; keep this file small)
const rawLog = exec(
  'git log -n 80 --pretty=format:"%ad\t%h\t%s" --date=short'
);
const commits = parseGitLog(rawLog);
const meaningfulCommits = commits.filter((c) => !isAutoContextCommit(c.subject));

const lastMeaningful = meaningfulCommits[0];
const throughLine = lastMeaningful
  ? `${lastMeaningful.date} (${lastMeaningful.hash})`
  : 'Unknown';

// Changelog (last 20 meaningful commits)
const changelogLines = meaningfulCommits
  .slice(0, 20)
  .map((c) => `- ${c.date} ${c.hash} ${c.subject}`)
  .join('\n');

// Build the context file (keep it concise; no session archives)
const contextContent = `# AI_CONTEXT — GalaxyCo.ai 3.0

**Updated Through:** ${throughLine}  
**Branch:** ${currentBranch}

## Quick Start
- Dev: \`npm run dev\`
- Typecheck: \`npm run typecheck\`
- Lint: \`npm run lint\`
- Build: \`npm run build\`
- Tests: \`npm test\`

## Stack (from package.json)
${techStackLine}

## Current Status (manual)
${manualStatusStart}
${preservedStatus}
${manualStatusEnd}

## Changelog (auto, last 20 meaningful commits)
${changelogLines || '- No recent commits found.'}

## Where to look first (for new AI agents)
- \`docs/guides/ORGANIZATION_GUIDELINES.md\`
- \`docs/guides/DESIGN-SYSTEM.md\`
- \`docs/guides/AGENT_INSTRUCTIONS.md\`

---

Generated by \`scripts/update-context.js\`.
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, contextContent, 'utf8');

console.log('✅ AI_CONTEXT.md updated successfully!');
console.log('   Location: docs/status/AI_CONTEXT.md');
console.log(`   Updated Through: ${throughLine}`);
