# Contributing to EcoCred

Thank you for your interest in contributing to EcoCred! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/EcoCred.git
   cd EcoCred
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/EcoCred.git
   ```

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (or use Neon serverless)
- MetaMask browser extension for testing

### Automated Setup

Run the automated setup script:
```bash
bash scripts/setup.sh
```

This will:
- Install all dependencies (blockchain, backend, frontend)
- Generate Prisma client
- Set up initial configuration

### Manual Setup

If you prefer manual setup:

```bash
# Install blockchain dependencies
cd blockchain
npm install

# Install backend dependencies
cd ../backend
npm install
npm run db:generate

# Install frontend dependencies
cd ../frontend-react
npm install
```

### Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your configuration

3. Set up database:
   ```bash
   cd backend
   npm run db:push
   npm run db:seed-if-empty
   ```

## How to Contribute

### Reporting Bugs

- Use the GitHub issue tracker
- Describe the bug clearly with steps to reproduce
- Include system information (OS, Node version, etc.)
- Add screenshots if applicable

### Suggesting Features

- Open an issue with the [Feature Request] tag
- Clearly describe the feature and its benefits
- Discuss implementation approaches if possible

### Code Contributions

1. **Find or create an issue** for the feature/bug
2. **Comment on the issue** to let others know you're working on it
3. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```
4. **Make your changes** following our code style
5. **Test thoroughly** (see Testing Requirements)
6. **Commit your changes** following commit guidelines
7. **Push to your fork** and create a pull request

## Code Style

### TypeScript/JavaScript

- Use **TypeScript** for all new code
- Follow existing code patterns and conventions
- Use **meaningful variable names**
- Add **JSDoc comments** for functions and classes
- Keep functions **small and focused**
- Avoid **magic numbers** - use named constants

### Solidity

- Follow **Solidity style guide**
- Use **NatSpec comments** for all public/external functions
- Include **@param** and **@return** documentation
- Use **explicit visibility** modifiers
- Follow **checks-effects-interactions** pattern

### React Components

- Use **functional components** with hooks
- Keep components **small and reusable**
- Use **TypeScript** for props and state
- Follow **consistent naming** (PascalCase for components)
- Extract **complex logic** into custom hooks

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```
feat(marketplace): add bulk listing creation

- Added batch listing creation endpoint
- Updated frontend to support multiple listings
- Added validation for bulk operations

Closes #123
```

```
fix(staking): prevent underflow in reward calculation

Fixed an issue where reward calculation could underflow
when unstaking within the first hour.

Fixes #456
```

## Pull Request Process

### Before Submitting

1. **Update from upstream**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests**:
   ```bash
   bash scripts/test-all.sh
   ```

3. **Build successfully**:
   ```bash
   cd blockchain && npm run compile
   cd ../backend && npm run build
   cd ../frontend-react && npm run build
   ```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings introduced
```

### Review Process

1. Automated checks must pass (linting, tests, build)
2. At least one maintainer approval required
3. Address review comments promptly
4. Squash commits if requested

## Testing Requirements

### Smart Contracts

All contract changes must include:
- **Unit tests** for new functions
- **Integration tests** for contract interactions
- **Test coverage** > 80%

Run tests:
```bash
cd blockchain
npm test
npm run test:coverage
```

### Backend

- **API endpoint tests** for new routes
- **Database migration tests**
- **Error handling tests**

Run tests:
```bash
cd backend
npm test
```

### Frontend

- **Component rendering tests** (if adding test framework)
- **Integration tests** for critical flows
- **Manual testing** in multiple browsers

Build check:
```bash
cd frontend-react
npm run build
npm run lint
```

## Documentation

When adding features, update:
- `README.md` - For user-facing features
- Code comments - For complex logic
- API documentation - For new endpoints
- Smart contract NatSpec - For contract changes

## Questions?

If you have questions about contributing:
- Check existing issues and discussions
- Open a new issue with the [Question] tag
- Reach out to maintainers

Thank you for contributing to EcoCred! 🌍
