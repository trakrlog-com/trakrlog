# Contributing to TrakrLog

First off, thank you for considering contributing to TrakrLog! 🎉

It's people like you that make TrakrLog a great tool for indie developers everywhere. We welcome contributions from developers of all skill levels and backgrounds.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Guidelines](#coding-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Areas We Need Help](#areas-we-need-help)
- [Community](#community)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our commitment to providing a welcoming and inclusive environment. By participating, you are expected to uphold this standard. Please:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/trakrlog-com/trakrlog/issues) to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, screenshots, etc.)
- **Describe the behavior you observed** and what you expected to see
- **Include your environment details** (OS, Go version, Node version, Docker version, etc.)
- **Include relevant logs or error messages**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful** to TrakrLog users
- **List some examples** of how it would be used
- **Include mockups or examples** if applicable

### Contributing Code

Whether it's fixing bugs, adding features, or improving documentation, code contributions are always welcome!

## 🚀 Getting Started

### Prerequisites

- **Go 1.25+** installed ([Download](https://go.dev/dl/))
- **Node.js 20+** and npm ([Download](https://nodejs.org/))
- **Docker and Docker Compose** ([Download](https://docs.docker.com/get-docker/))
- **Git** for version control
- A **GitHub account**

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/trakrlog.git
   cd trakrlog
   ```
3. **Add the upstream repository**:
   ```bash
   git remote add upstream https://github.com/trakrlog-com/trakrlog.git
   ```
4. **Create a branch** for your work:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Local Development Setup

#### Option 1: Docker (Recommended for Testing Full Stack)

```bash
# Start all services (backend, frontend, MongoDB)
make docker-run

# Access the application at http://localhost:4000
```

#### Option 2: Native Development (Recommended for Active Development)

**Backend:**
```bash
# Install Go dependencies
go mod download

# Run with live reload
make watch

# Or run directly
make run
```

**Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Frontend will be available at http://localhost:5173
```

**Database:**
```bash
# Start only MongoDB using Docker
docker compose -f docker-compose.local.yml up mongo -d
```

### Running Tests

```bash
# Run all Go tests
make test

# Run integration tests (requires Docker)
make itest

# Run frontend tests
cd frontend
npm run test

# Run linting
cd frontend
npm run lint
```

## 🔄 Development Workflow

### 1. Stay Up to Date

Before starting work, sync your fork with the upstream repository:

```bash
git checkout main
git fetch upstream
git merge upstream/main
git push origin main
```

### 2. Create a Feature Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
# or
git checkout -b docs/what-you-are-documenting
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

### 3. Make Your Changes

- Write clean, readable code
- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation as needed
- Test your changes thoroughly

### 4. Commit Your Changes

See [Commit Guidelines](#commit-guidelines) below.

### 5. Push and Create a Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub (see [Pull Request Process](#pull-request-process)).

## 📝 Coding Guidelines

### Go (Backend)

- Follow [Effective Go](https://go.dev/doc/effective_go) guidelines
- Use `gofmt` to format your code
- Follow the repository layer pattern:
  - **Models** (`internal/model/`) - Data structures
  - **Repository** (`internal/repository/`) - Database operations
  - **Service** (`internal/service/`) - Business logic
  - **Handler** (`internal/handler/`) - HTTP request handling
  - **Middleware** (`internal/middleware/`) - HTTP middleware
- Write meaningful variable and function names
- Add comments for exported functions and complex logic
- Handle errors explicitly and return them appropriately
- Use context for request-scoped values and cancellation

**Example:**
```go
// GetProjectByID retrieves a project by its ID
func (s *ProjectService) GetProjectByID(ctx context.Context, projectID string) (*model.Project, error) {
    if projectID == "" {
        return nil, errors.New("project ID cannot be empty")
    }
    
    return s.repo.FindByID(ctx, projectID)
}
```

### TypeScript/React (Frontend)

- Use **TypeScript** for type safety
- Follow React best practices and hooks patterns
- Use functional components with hooks
- Keep components focused and reusable
- Use proper TypeScript types (avoid `any`)
- Follow the existing folder structure:
  - **components/** - Reusable UI components
  - **pages/** - Page-level components
  - **context/** - React context providers
  - **hooks/** - Custom React hooks
  - **types/** - TypeScript type definitions
  - **utils/** - Utility functions
- Use Tailwind CSS for styling (follow existing patterns)
- Ensure components are accessible

**Example:**
```typescript
interface EventItemProps {
  event: Event;
  onSelect: (id: string) => void;
}

export const EventItem: React.FC<EventItemProps> = ({ event, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(event.id)}
      className="w-full text-left p-4 hover:bg-gray-50"
    >
      <h3 className="font-semibold">{event.title}</h3>
      <p className="text-gray-600">{event.description}</p>
    </button>
  );
};
```

### General Guidelines

- **DRY (Don't Repeat Yourself)** - Avoid code duplication
- **KISS (Keep It Simple, Stupid)** - Prefer simple solutions
- **YAGNI (You Aren't Gonna Need It)** - Don't add unnecessary features
- Write self-documenting code with clear names
- Add comments for complex logic or non-obvious decisions
- Keep functions small and focused
- Write tests for new functionality

## 💬 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear and meaningful commit messages.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, missing semicolons, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks, dependency updates

**Scope (optional):** The area of the codebase affected
- `api` - Backend API
- `frontend` - Frontend application
- `database` - Database related
- `auth` - Authentication
- `docs` - Documentation
- `docker` - Docker configuration

**Examples:**

```bash
feat(api): add endpoint to filter events by tags

fix(frontend): resolve dashboard loading spinner issue

docs: update contributing guidelines with commit conventions

refactor(database): optimize event query performance

test(api): add integration tests for channel service
```

### Good Commit Practices

- Write clear, concise commit messages
- Use the imperative mood ("add" not "added")
- Limit the subject line to 50 characters
- Separate subject from body with a blank line
- Wrap the body at 72 characters
- Explain what and why, not how
- Reference issues and pull requests when relevant

## 🔍 Pull Request Process

### Before Submitting

- [ ] Code follows the project's style guidelines
- [ ] Self-review of your code completed
- [ ] Comments added for complex code
- [ ] Documentation updated if needed
- [ ] No new warnings generated
- [ ] Tests added/updated and all tests pass
- [ ] Commits follow commit guidelines
- [ ] Branch is up to date with main

### Submitting a Pull Request

1. **Push your branch** to your fork
2. **Open a Pull Request** against the `main` branch
3. **Fill out the PR template** with all required information
4. **Link related issues** using keywords (e.g., "Closes #123")
5. **Request review** from maintainers
6. **Address feedback** promptly and professionally

### Review Process

- Maintainers will review your PR as soon as possible
- Be patient and respectful during the review process
- Address feedback constructively
- Make requested changes in new commits (don't force push)
- Once approved, maintainers will merge your PR

## 🎯 Areas We Need Help

We're especially looking for contributions in these areas:

### 🎮 SDK Development

**Priority: High**

Help us build SDKs for popular game engines and frameworks:

- **Unity SDK** - C# library for Unity integration
- **Godot SDK** - GDScript/C# library for Godot
- **Unreal Engine SDK** - C++ library for Unreal
- **React Native SDK** - Mobile app tracking
- **Flutter SDK** - Cross-platform mobile support
- **Python SDK** - For backend services and data science

**What you'll need:**
- Experience with the target platform
- Understanding of REST APIs
- Knowledge of best practices for the platform

### 📊 Analytics & Visualization

**Priority: High**

Enhance our analytics capabilities:

- **Advanced Charts** - New visualization types (heatmaps, funnels, cohorts)
- **Export Features** - CSV, JSON, PDF export options
- **Custom Dashboards** - User-configurable dashboard layouts
- **Real-time Updates** - WebSocket support for live event streaming
- **Query Builder** - Visual query interface for complex filters

**What you'll need:**
- React and TypeScript experience
- Data visualization knowledge (Chart.js, D3.js, etc.)
- UI/UX sensibility

### 🐛 Bug Fixes & Quality

**Priority: Medium**

Help improve stability and reliability:

- Fix [reported bugs](https://github.com/trakrlog-com/trakrlog/issues?q=is%3Aissue+is%3Aopen+label%3Abug)
- Add error handling and validation
- Improve test coverage
- Performance optimizations
- Security improvements

### 📝 Documentation

**Priority: Medium**

Make TrakrLog more accessible:

- **API Documentation** - OpenAPI/Swagger specs
- **SDK Guides** - How-to guides for each SDK
- **Video Tutorials** - Getting started videos
- **Blog Posts** - Use cases and best practices
- **Translation** - Help us reach developers worldwide

### 🚀 Infrastructure & DevOps

**Priority: Medium**

Improve deployment and operations:

- **Kubernetes support** - Helm charts and deployment guides
- **Monitoring** - Prometheus/Grafana integration
- **CI/CD improvements** - GitHub Actions workflows
- **Cloud deployment** - AWS, GCP, Azure guides
- **Backup & Recovery** - Automated backup solutions

### 🎨 Design & UX

**Priority: Low-Medium**

Enhance the user experience:

- UI/UX improvements
- Dark mode refinements
- Mobile responsiveness
- Accessibility enhancements
- Onboarding improvements

## 🌟 Recognition

Contributors are the heart of TrakrLog! We recognize contributions in several ways:

- Name added to our Contributors list
- Mention in release notes for significant contributions
- GitHub contributor badge
- Our eternal gratitude! 🙏

## 💡 Questions?

- **General questions:** Open a [GitHub Discussion](https://github.com/trakrlog-com/trakrlog/discussions)
- **Bug reports:** Open a [GitHub Issue](https://github.com/trakrlog-com/trakrlog/issues)
- **Security issues:** Email hey@trakrlog.com (if applicable)

## 📚 Additional Resources

- [README.md](README.md) - Project overview
- [LOCAL_TESTING.md](LOCAL_TESTING.md) - Local development guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment instructions

## 🙏 Thank You!

Every contribution, no matter how small, makes a difference. Thank you for being part of the TrakrLog community!

---

<div align="center">
  <p><strong>Happy Coding! 🚀</strong></p>
  <p>Made with ❤️ by the TrakrLog community</p>
</div>
