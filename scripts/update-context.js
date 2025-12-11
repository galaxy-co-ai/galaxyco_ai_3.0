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

function countMarkdownFiles(dirPath) {
  let count = 0;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        count += countMarkdownFiles(fullPath);
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

// Get current date/time
const now = new Date().toISOString();
const dateOnly = now.split('T')[0];

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
const currentCommit = exec('git rev-parse --short HEAD');
const lastCommitDate = exec('git log -1 --format=%cd --date=short');

// Get recent commits (last 10)
const recentCommits = exec('git log --oneline -10 --pretty=format:"- %ad: %s" --date=short');

// Get commits from last 7 days
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const recentWork = exec(`git log --since="${sevenDaysAgo}" --oneline --pretty=format:"- %ad: %s" --date=short`);

// Check TypeScript health
let tsHealth = '⏳ Checking...';
try {
  execSync('npm run typecheck --silent', { stdio: 'pipe' });
  tsHealth = '✅ 0 errors';
} catch {
  tsHealth = '❌ Has errors';
}

// Keep lint/build/tests fast: do not run them in this generator
const eslintHealth = '🟡 Not checked by generator';
const buildHealth = '🟡 Not checked by generator';
const testHealth = '🟡 Not checked by generator';
const depsHealth = '🟡 Not checked by generator';

// Count markdown files in docs (cross-platform)
const docsCount = countMarkdownFiles(path.join(repoRoot, 'docs'));

// Build the context file
const contextContent = `# AI Agent Context - GalaxyCo.ai 3.0

**Last Updated:** ${now}  
**Git Branch:** ${currentBranch}  
**Git HEAD (at generation):** ${currentCommit}  
**Last Commit Date:** ${lastCommitDate}

---

## 🎯 Quick Summary (100 words)

Production SaaS platform for AI-powered business automation. Built with Next.js (App Router) + React + TypeScript + Tailwind. Data layer uses Drizzle ORM with Neon Postgres. Authentication is handled by ${authProvider}. Key integrations include Upstash (Redis/Vector), Trigger.dev background jobs, Stripe billing, and Sentry monitoring (where configured). Repo contains extensive documentation under \`docs/\` and a broad API surface under \`src/app/api/\`.

**Tech Stack:** ${techStackLine}

---

## 📊 Current Health

|| Metric | Status | Details |
||--------|--------|---------|
|| **TypeScript** | ${tsHealth} | \`npm run typecheck\` |
|| **ESLint** | ${eslintHealth} | Run \`npm run lint\` |
|| **Build** | ${buildHealth} | Run \`npm run build\` |
|| **Tests** | ${testHealth} | Run \`npm test\` |
|| **Dependencies** | ${depsHealth} | Run \`npm audit\` / \`npm outdated\` |

---

## 🔄 Recent Work (Last 7 Days)

${recentWork || 'No commits in last 7 days'}

---

## 📝 Recent Commits (Last 10)

${recentCommits}

---

## 📁 Project Structure

\`\`\`
galaxyco-ai-3.0/
├── docs/                    # All documentation (${docsCount} files)
│   ├── status/             # Current state & health
│   ├── plans/              # Roadmaps & strategies
│   ├── guides/             # Setup & tutorials
│   └── archive/            # Historical docs
├── src/
│   ├── app/                # Next.js App Router
│   ├── components/         # React components
│   ├── lib/                # Utilities & integrations
│   └── types/              # TypeScript definitions
└── tests/                  # E2E & unit tests
\`\`\`

---

## 🎯 Known Issues

**None blocking production.**

Optional improvements:
- ESLint warnings cleanup (unused imports/vars)
- React hooks deps cleanup where flagged
- Console statements cleanup (prefer \`logger\`)

---

## 🚀 Next Priorities

1. **Feature Development** - Continue shipping product features
2. **Performance/Quality** - Incrementally reduce lint noise where touched
3. **Observability** - Keep Sentry + metrics coverage current

---

## 📚 Essential Docs for AI Agents

**Start Here (Read First):**
1. **This File** - Current state & recent changes
2. [Organization Guidelines](../guides/ORGANIZATION_GUIDELINES.md) - Project structure & conventions
3. [Backend Health Audit](./BACKEND_HEALTH_AUDIT.md) - Detailed health analysis

**Reference Docs:**
- [Roadmap](../plans/ROADMAP.md) - Long-term vision
- [API Documentation](../guides/API_DOCUMENTATION.md) - API reference
- [Design System](../guides/DESIGN-SYSTEM.md) - UI patterns & tokens
- [Agent Instructions](../guides/AGENT_INSTRUCTIONS.md) - AI agent guidelines

**For Specific Tasks:**
- New features: Read ORGANIZATION_GUIDELINES.md first
- Bug fixes: Check BACKEND_HEALTH_AUDIT.md for known issues
- Refactoring: Follow patterns in existing code

---

## 🏗️ Architecture Highlights

### Current Tech Decisions
- **Frontend:** Next.js App Router, React, TypeScript strict mode
- **Styling:** Tailwind CSS utilities only (no CSS modules/inline styles)
- **UI Components:** Radix UI primitives + shadcn/ui patterns
- **Data:** Drizzle ORM + Neon Postgres
- **Caching/Search:** Upstash (Redis/Vector)
- **Auth:** ${authProvider}
- **Payments:** Stripe
- **Background Jobs:** Trigger.dev
- **Monitoring:** Sentry

### Key Patterns
- Server Components by default, Client Components when needed
- Zod validation for all user inputs
- Error boundaries around features
- TypeScript: Prefer \`unknown\` over \`any\`; type everything
- Git: Conventional Commits (feat, fix, refactor, docs, chore)

---

## 🔐 Safety Rules for AI Agents

**ALWAYS:**
- ✅ Work on a branch (never directly on main)
- ✅ Test after changes (typecheck, build, lint)
- ✅ Commit incrementally with descriptive messages
- ✅ Follow existing patterns and conventions
- ✅ Read ORGANIZATION_GUIDELINES.md before major changes

**NEVER:**
- ❌ Delete files without verification (move to _archive/ instead)
- ❌ Change imports without exhaustive grep
- ❌ Skip build verification after code changes
- ❌ Hard-code secrets (use environment variables)

---

## 💡 Tips for AI Agents

1. **Before Starting:** Read this file + ORGANIZATION_GUIDELINES.md (~7 min)
2. **For Context:** Check recent commits to see what's changed
3. **For Structure:** Refer to ORGANIZATION_GUIDELINES.md
4. **For Health:** Review BACKEND_HEALTH_AUDIT.md
5. **When Stuck:** Grep for similar patterns in existing code
6. **Before Committing:** Run health checks (typecheck + build)

---

**Generated by:** \`scripts/update-context.js\`  
**Update Frequency:** After significant work or weekly  
**Maintainer:** Executive Engineer AI + User

---

*This file provides a snapshot of the current project state. For detailed history, see git log or CHANGELOG.md.*
`;

// Write to file
const outputPath = path.join(__dirname, '..', 'docs', 'status', 'AI_CONTEXT.md');
fs.writeFileSync(outputPath, contextContent, 'utf8');

console.log('✅ AI_CONTEXT.md updated successfully!');
console.log(`   Location: docs/status/AI_CONTEXT.md`);
console.log(`   Updated: ${dateOnly}`);
console.log(`   Commit: ${currentCommit}`);
