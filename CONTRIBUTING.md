# Contributing to GalaxyCo.ai

Thank you for your interest in contributing to GalaxyCo.ai! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Security](#security)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for details.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Set up your development environment (see below)
4. Create a feature branch from `develop`
5. Make your changes
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- Required API keys (see `.env.example`)

### Installation

```bash
# Clone the repository
git clone https://github.com/galaxy-co-ai/galaxyco_ai_3.0.git
cd galaxyco_ai_3.0

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript compiler |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run db:studio` | Open Drizzle Studio |

## Project Structure

```
├── src/
│   ├── app/              # Next.js App Router (routes + API)
│   ├── components/       # React components
│   ├── lib/              # Business logic & utilities
│   │   ├── ai/           # AI orchestration & tools
│   │   ├── neptune/      # Neptune assistant logic
│   │   ├── crm/          # CRM services
│   │   └── ...           # Other domain services
│   ├── db/               # Drizzle schema
│   └── trigger/          # Background jobs (Trigger.dev)
├── tests/                # Test files
│   ├── lib/              # Unit tests
│   ├── api/              # Integration tests
│   ├── components/       # Component tests
│   └── e2e/              # Playwright E2E tests
├── drizzle/              # Database migrations
├── scripts/              # Utility scripts
├── docs/                 # Documentation
└── public/               # Static assets
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code (no `.js` files)
- Enable strict mode - no `any` types unless absolutely necessary
- Use Zod schemas for runtime validation

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Routes | kebab-case | `crm-dashboard/` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRIES` |

### Formatting

- Prettier enforces: 2-space indentation, semicolons, single quotes, 100 char width
- Run `npm run format` before committing
- ESLint must pass without new suppressions

### Best Practices

- Keep components small and focused
- Use server components by default, client components only when needed
- Implement proper error handling with try-catch
- Add JSDoc comments for complex functions
- Update `.env.example` when adding new environment variables

## Testing Guidelines

### Test Organization

- Unit tests: `tests/lib/` - test individual functions
- Integration tests: `tests/api/` - test API endpoints
- Component tests: `tests/components/` - test React components
- E2E tests: `tests/e2e/` - test user flows

### Writing Tests

```typescript
// Example test structure
describe('featureName', () => {
  describe('functionName', () => {
    it('should handle expected case', () => {
      // Arrange
      // Act
      // Assert
    });

    it('should handle edge case', () => {
      // ...
    });
  });
});
```

### Coverage Requirements

- Maintain >= 80% code coverage
- Document intentional coverage gaps in `tests/STATUS.md`
- Run E2E smoke tests before merging

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting) |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |
| `perf` | Performance improvements |

### Examples

```
feat(ai): add sentiment analysis to Neptune
fix(crm): resolve duplicate contact creation
docs(readme): update installation instructions
refactor(auth): simplify session management
```

## Pull Request Process

1. **Create a feature branch** from `develop`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** following coding standards

3. **Run quality checks**:
   ```bash
   npm run lint
   npm run typecheck
   npm run test:run
   ```

4. **Commit your changes** using conventional commits

5. **Push and create a PR** against `develop`

6. **Fill out the PR template** completely

7. **Request review** from maintainers

8. **Address feedback** and update as needed

### PR Requirements

- [ ] All CI checks pass
- [ ] Code follows project standards
- [ ] Tests added for new functionality
- [ ] Documentation updated if needed
- [ ] No merge conflicts

## Security

- Never commit secrets or API keys
- Keep `.env.local` out of version control
- Run `npm run env:check` before builds
- Report vulnerabilities privately (see [SECURITY.md](SECURITY.md))

## Questions?

- Check the [documentation](docs/)
- Open a [discussion](https://github.com/galaxy-co-ai/galaxyco_ai_3.0/discussions)
- Contact: hello@galaxyco.ai

---

Thank you for contributing to GalaxyCo.ai!
