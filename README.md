<div align="center">
  <h1>🚀 TrakrLog</h1>
  <p><strong>Open Source Event Logging for Indie Game & SaaS Developers</strong></p>
</div>

---

## 📖 About

**TrakrLog** is a free, open-source event logging and analytics platform designed specifically for indie game and SaaS developers. Own your data, self-host your analytics, and gain deep insights into your applications without the complexity or cost of enterprise solutions.

Track everything from critical bugs to user behavior, performance metrics to custom events—all in real-time with an intuitive dashboard and powerful analytics tools.

### Why TrakrLog?

- 🎮 **Built for Indie Devs**: First-class support for game engines (Unity, Godot) and web frameworks
- 💰 **100% Free & Open Source**: No hidden costs, no usage limits, no vendor lock-in
- 🔒 **Privacy-First**: Self-host and own your data completely
- ⚡ **Real-Time Insights**: Track events as they happen with lightweight SDKs
- 🎯 **Simple Integration**: Get started in minutes, not hours
- 📊 **Powerful Analytics**: Deep insights without the complexity

---

## ✨ Features

### Core Capabilities

- **Real-time Event Logging** - Track gameplay events, performance metrics, and system data instantly
- **Advanced Analytics** - Powerful dashboards with detailed insights and visualizations
- **Project & Channel Organization** - Organize events by projects and channels for clarity
- **Custom Event Tags** - Attach custom metadata to events for flexible filtering
- **User Insights** - Understand how users experience your game or app
- **Smart Notifications** - Get real-time alerts for critical events
- **Google OAuth Integration** - Secure authentication out of the box

### Developer Experience

- **Multi-Engine SDK Support** - Native SDKs for Godot, Unity, React, Node.js, and more
- **REST API** - Simple HTTP endpoints for easy integration
- **Self-Hosted** - Full control with Docker deployment
- **Lightweight** - Performance-optimized for minimal overhead
- **TypeScript Support** - Fully typed for better DX

---

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- (Optional) Google OAuth credentials for authentication

### Local Development with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/trakrlog-com/trakrlog.git
   cd trakrlog
   ```

2. **Configure environment** (optional for OAuth)
   ```bash
   # Edit .env.local if you want to test Google OAuth
   nano .env.local
   ```

3. **Start the application**
   ```bash
   make docker-run
   # Or manually:
   docker compose -f docker-compose.local.yml --env-file .env.local up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:4000
   - API Health: http://localhost:4000/api/health
   - MongoDB: localhost:27017

5. **Stop the application**
   ```bash
   make docker-down
   # Or manually:
   docker compose -f docker-compose.local.yml down
   ```

### Native Development (without Docker)

1. **Install dependencies**
   ```bash
   # Backend
   go mod download
   
   # Frontend
   cd frontend
   npm install
   ```

2. **Build the application**
   ```bash
   make build
   ```

3. **Run with live reload**
   ```bash
   # Backend (installs air if needed)
   make watch
   
   # Frontend (in separate terminal)
   cd frontend
   npm run dev
   ```

---

## 🛠️ Tech Stack

### Backend
- **Go 1.25+** - High-performance API server
- **Gin** - Web framework with routing and middleware
- **MongoDB** - Flexible document database for events and analytics
- **OAuth2** - Google authentication integration

### Frontend
- **React 19** - Modern UI with hooks and context
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS 4** - Utility-first styling
- **Headless UI** - Accessible component primitives
- **Heroicons** - Beautiful hand-crafted icons
- **React Router** - Client-side routing
- **Luxon** - DateTime handling

### Infrastructure
- **Docker** - Containerized deployment
- **Caddy** - Automatic HTTPS and reverse proxy
- **Air** - Live reload for Go development
- **Testcontainers** - Integration testing with containers

---

## 📁 Project Structure

```
trakrlog/
├── cmd/api/              # Application entry point
├── internal/             # Private application code
│   ├── auth/            # Authentication logic (Google OAuth)
│   ├── database/        # Database connection and utilities
│   ├── handler/         # HTTP request handlers
│   ├── middleware/      # HTTP middleware (auth, CORS, etc.)
│   ├── model/          # Data models (Project, Channel, Event, User)
│   ├── repository/     # Database operations layer
│   ├── server/         # Server setup and routing
│   └── service/        # Business logic layer
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/      # Page components
│   │   ├── context/    # React context providers
│   │   ├── hooks/      # Custom React hooks
│   │   └── types/      # TypeScript type definitions
│   └── public/         # Static assets
├── docs/               # Documentation
├── docker-compose.*.yml # Docker configurations
└── Makefile           # Build and development commands
```

---

## 🧪 Testing

```bash
# Run all tests
make test

# Run integration tests (requires Docker)
make itest

# Frontend tests
cd frontend
npm run test
```

---

## 📚 Documentation

- **[Local Testing Guide](LOCAL_TESTING.md)** - Detailed guide for local development
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment instructions
- **[VPS Deployment](VPS_DEPLOYMENT.md)** - Deploy to a VPS

---

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help makes TrakrLog better for everyone.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow existing code style and conventions
   - Add tests for new features
   - Update documentation as needed
4. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
5. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Development Guidelines

- **Code Style**: Follow Go and TypeScript best practices
- **Commits**: Write clear, descriptive commit messages using conventional commits notation.
- **Tests**: Add tests for new functionality
- **Documentation**: Update README and docs for significant changes
- **Issues**: Check existing issues before creating new ones

### Areas We Need Help

- 🎮 **SDK Development** - Unity, Godot, Unreal Engine integrations
- 📊 **Analytics Features** - New visualization and insights tools
- 🐛 **Bug Fixes** - Check our [issues](https://github.com/trakrlog-com/trakrlog/issues)
- 📝 **Documentation** - Improve guides and tutorials
- 🌐 **Translations** - Help us reach more developers worldwide

---

## 🔨 Makefile Commands

```bash
make all          # Build frontend, backend, and run tests
make build        # Build the entire application
make run          # Run the application natively
make docker-run   # Start local containerized environment
make docker-down  # Stop local containers
make test         # Run all tests
make itest        # Run integration tests
make watch        # Run with live reload (uses air)
make clean        # Remove build artifacts
```

---

## 📄 License

This project is open source and available under the [GNU AFFERO GENERAL PUBLIC LICENSE](LICENSE).

---

## 🌟 Support

If you find TrakrLog useful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs and requesting features
- 🤝 Contributing to the codebase
- 📢 Spreading the word to other indie developers

---

## 📞 Contact & Community

- **GitHub**: [@trakrlog-com](https://github.com/trakrlog-com)
- **Website**: [trakrlog.com](https://trakrlog.com)
- **Issues**: [GitHub Issues](https://github.com/trakrlog-com/trakrlog/issues)

---

<div align="center">
  <p>Made with ❤️ for indie developers by indie developers</p>
  <p><strong>Own your data. Own your analytics.</strong></p>
</div>
```bash
make clean
```
