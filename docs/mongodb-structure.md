# MongoDB Layer Code Structure

## Overview
Best practices for structuring MongoDB database layer in Go with collections: projects, users, channels, events.

## Implementation Phases

This guide is organized into phases for incremental implementation:

### **Phase 1: Foundation** (Start Here)
- Setup models layer
- Create repository interfaces and base implementations
- Enhance database service
- Basic CRUD for all collections

### **Phase 2: Service Layer & Business Logic**
- Implement service layer for each entity
- Add validation and error handling
- Implement repository patterns
- Setup dependency injection

### **Phase 3: Integration**
- Connect services to handlers
- Add transaction support
- Implement pagination
- Add indexes for performance

### **Phase 4: Multi-Provider Authentication** (Final Phase)
- Extend User model for multiple OAuth providers
- Implement account linking logic
- Support Google + GitHub authentication
- Add provider management

---

## Phase 1: Foundation

## Recommended Approach: Repository Pattern + Service Layer

### 1. **Directory Structure**

```
internal/
├── models/              # Domain models (structs)
│   ├── user.go
│   ├── project.go
│   ├── channel.go
│   └── event.go
├── repository/          # Database access layer (MongoDB operations)
│   ├── repository.go    # Interface definitions
│   ├── user_repo.go
│   ├── project_repo.go
│   ├── channel_repo.go
│   └── event_repo.go
├── service/             # Business logic layer
│   ├── user_service.go
│   ├── project_service.go
│   ├── channel_service.go
│   └── event_service.go
└── database/
    └── database.go      # Existing - MongoDB connection and service interface
```

### 2. **Layer Responsibilities**

#### **Models Layer** (`internal/models/`)
- Pure domain structs with BSON tags
- No business logic
- Shared across all layers

```go
// models/user.go
type User struct {
    ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
    Email     string             `bson:"email" json:"email"`
    Name      string             `bson:"name" json:"name"`
    CreatedAt time.Time          `bson:"created_at" json:"createdAt"`
}
```

#### **Repository Layer** (`internal/repository/`)
- Direct MongoDB operations (CRUD)
- Collection-specific methods
- Returns domain models
- No business logic
- Interface-based for testability

```go
// repository/repository.go
type UserRepository interface {
    Create(ctx context.Context, user *models.User) error
    FindByID(ctx context.Context, id string) (*models.User, error)
    FindByEmail(ctx context.Context, email string) (*models.User, error)
    Update(ctx context.Context, user *models.User) error
    Delete(ctx context.Context, id string) error
}

// repository/user_repo.go
type userRepository struct {
    collection *mongo.Collection
}

func NewUserRepository(db *mongo.Database) UserRepository {
    return &userRepository{
        collection: db.Collection("users"),
    }
}
```

#### **Service Layer** (`internal/service/`)
- Business logic
- Validation
- Orchestrates multiple repositories
- Transaction management
- Returns DTOs or models

```go
// service/user_service.go
type UserService struct {
    userRepo    repository.UserRepository
    projectRepo repository.ProjectRepository
}

func (s *UserService) CreateUser(ctx context.Context, email, name string) (*models.User, error) {
    // Validation
    if email == "" {
        return nil, errors.New("email required")
    }
    
    // Check duplicates
    existing, _ := s.userRepo.FindByEmail(ctx, email)
    if existing != nil {
        return nil, errors.New("user already exists")
    }
    
    // Create user
    user := &models.User{
        Email: email,
        Name: name,
        CreatedAt: time.Now(),
    }
    
    return user, s.userRepo.Create(ctx, user)
}
```

### 3. **Database Layer** (`internal/database/database.go`)

**Your existing implementation:**
```go
// database/database.go
type Service interface {
    Health() map[string]string
}

type service struct {
    db *mongo.Client
}

func New() Service {
    // Existing connection logic
}
```

**Enhancement needed for repositories:**
Add a method to expose the database instance:

```go
// database/database.go
type Service interface {
    Health() map[string]string
    GetDB() *mongo.Database  // Add this
}

func (s *service) GetDB() *mongo.Database {
    return s.db.Database(os.Getenv("MONGODB_DATABASE"))
}
```

This allows repositories to access collections through the database service.

---

## Phase 2: Service Layer & Business Logic

### 4. **Dependency Injection Pattern**

```go
// internal/server/server.go (your existing Server struct)
type Server struct {
    port int
    db   database.Service  // Your existing database service
    
    // Add services
    userService    *service.UserService
    projectService *service.ProjectService
    channelService *service.ChannelService
    eventService   *service.EventService
}

func NewServer() *http.Server {
    port, _ := strconv.Atoi(os.Getenv("PORT"))
    
    // Initialize DB (your existing code)
    db := database.New()
    
    // Get MongoDB database instance
    mongoDB := db.GetDB()
    
    // Initialize repositories
    userRepo := repository.NewUserRepository(mongoDB)
    projectRepo := repository.NewProjectRepository(mongoDB)
    channelRepo := repository.NewChannelRepository(mongoDB)
    eventRepo := repository.NewEventRepository(mongoDB)
    
    // Initialize services
    userService := service.NewUserService(userRepo)
    projectService := service.NewProjectService(projectRepo, channelRepo)
    channelService := service.NewChannelService(channelRepo, eventRepo)
    eventService := service.NewEventService(eventRepo)
    
    server := &Server{
        port: port,
        db: db,
        userService: userService,
        projectService: projectService,
        channelService: channelService,
        eventService: eventService,
    }
    
    // Return http.Server as your existing code does
    return &http.Server{
        Addr:    fmt.Sprintf(":%d", server.port),
        Handler: server.RegisterRouter(),
    }
}
```

### 5. **Handler Usage**

```go
// internal/handlers/user_handler.go
type UserHandler struct {
    userService *service.UserService
}

func (h *UserHandler) CreateUser(c *gin.Context) {
    var req struct {
        Email string `json:"email"`
        Name  string `json:"name"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    user, err := h.userService.CreateUser(c.Request.Context(), req.Email, req.Name)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(201, user)
}
```

---

## Phase 3: Integration

### Transaction Support

Implement transactions for operations that span multiple collections:

```go
func (s *ProjectService) DeleteProject(ctx context.Context, projectID string) error {
    // Start transaction
    session, err := s.db.Client.StartSession()
    if err != nil {
        return err
    }
    defer session.EndSession(ctx)
    
    // Execute in transaction
    _, err = session.WithTransaction(ctx, func(sc mongo.SessionContext) (interface{}, error) {
        // Delete all events in all channels of the project
        if err := s.eventRepo.DeleteByProjectID(sc, projectID); err != nil {
            return nil, err
        }
        
        // Delete all channels
        if err := s.channelRepo.DeleteByProjectID(sc, projectID); err != nil {
            return nil, err
        }
        
        // Delete project
        return nil, s.projectRepo.Delete(sc, projectID)
    })
    
    return err
}
```

### Collection Patterns

### **Projects Collection**

### ✅ **Separation of Concerns**
- Database logic isolated in repositories
- Business logic in services
- HTTP handling in handlers

### ✅ **Testability**
- Mock repositories for service tests
- Mock services for handler tests
- No need for MongoDB in unit tests

### ✅ **Flexibility**
- Easy to swap MongoDB for PostgreSQL
- Add caching layer between service and repository
- Support multiple databases

### ✅ **Reusability**
- Services can be used by HTTP handlers, gRPC, CLI, etc.
- Repositories can be reused across services

### ✅ **Scalability**
- Easy to add new collections
- Complex queries isolated in repositories
- Business rules centralized in services

---

## Common Patterns for Your Collections

### **Users Collection - Multi-Provider Authentication**

To support multiple OAuth providers (Google, GitHub) for the same user, use an **account linking pattern**:

**User Model with Linked Accounts:**
```go
type User struct {
    ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
    Email     string             `bson:"email" json:"email"` // Primary identifier
    Name      string             `bson:"name" json:"name"`
    Avatar    string             `bson:"avatar,omitempty" json:"avatar,omitempty"`
    Providers []Provider         `bson:"providers" json:"providers"` // Linked OAuth accounts
    CreatedAt time.Time          `bson:"created_at" json:"createdAt"`
    UpdatedAt time.Time          `bson:"updated_at" json:"updatedAt"`
}

type Provider struct {
    Name         string    `bson:"name" json:"name"`           // "google" or "github"
    ProviderID   string    `bson:"provider_id" json:"providerId"` // OAuth provider's user ID
    Email        string    `bson:"email" json:"email"`         // Email from this provider
    AccessToken  string    `bson:"access_token,omitempty" json:"-"` // Never send to client
    RefreshToken string    `bson:"refresh_token,omitempty" json:"-"`
    LinkedAt     time.Time `bson:"linked_at" json:"linkedAt"`
}
```

**Database Indexes (Important!):**
```go
// Create unique compound index on provider name + provider ID
db.users.createIndex(
    { "providers.name": 1, "providers.provider_id": 1 },
    { unique: true, sparse: true }
)

// Index on email for quick lookups
db.users.createIndex({ "email": 1 })
```

**Authentication Flow:**

1. **First-time login with Google:**
   - User doesn't exist → Create new user with Google provider
   - User exists with email → Link Google to existing account

2. **Login with GitHub (user already has Google):**
   - Find user by GitHub provider ID → Login existing user
   - Find user by email → Link GitHub to existing account
   - Neither found → Create new user with GitHub provider

**Repository Methods:**
```go
repository.UserRepository
- Create(user)
- FindByID(id)
- FindByEmail(email)
- FindByProvider(providerName, providerID) // e.g., ("google", "12345")
- LinkProvider(userID, provider)           // Add new provider to existing user
- UnlinkProvider(userID, providerName)     // Remove provider
- Update(user)
- Delete(id)
```

**Service Layer - Account Linking Logic:**
```go
func (s *UserService) AuthenticateWithProvider(
    ctx context.Context,
    providerName, providerID, email, name string,
) (*models.User, error) {
    
    // 1. Check if user exists with this provider
    user, err := s.userRepo.FindByProvider(ctx, providerName, providerID)
    if err == nil {
        // User found, update last login
        return user, nil
    }
    
    // 2. Check if user exists with this email
    user, err = s.userRepo.FindByEmail(ctx, email)
    if err == nil {
        // Link new provider to existing user
        provider := models.Provider{
            Name:       providerName,
            ProviderID: providerID,
            Email:      email,
            LinkedAt:   time.Now(),
        }
        return user, s.userRepo.LinkProvider(ctx, user.ID.Hex(), provider)
    }
    
    // 3. Create new user with this provider
    user = &models.User{
        Email: email,
        Name:  name,
        Providers: []models.Provider{
            {
                Name:       providerName,
                ProviderID: providerID,
                Email:      email,
                LinkedAt:   time.Now(),
            },
        },
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }
    
    return user, s.userRepo.Create(ctx, user)
}
```

---

### **Projects Collection**
```go
repository.ProjectRepository
- Create(project)
- FindByID(id)
- FindByUserID(userID) // List user's projects
- Update(project)
- Delete(id)
```

### **Channels Collection**
```go
repository.ChannelRepository
- Create(channel)
- FindByID(id)
- FindByProjectID(projectID) // List project's channels
- Update(channel)
- Delete(id)
```

### **Events Collection**
```go
repository.EventRepository
- Create(event)
- FindByID(id)
- FindByChannelID(channelID, limit, offset) // Paginated events
- FindByProjectID(projectID, limit, offset)
- Update(event)
- Delete(id)
```

---

## Transaction Example (Service Layer)

```go
func (s *ProjectService) DeleteProject(ctx context.Context, projectID string) error {
    // Start transaction
    session, err := s.db.Client.StartSession()
    if err != nil {
        return err
    }
    defer session.EndSession(ctx)
    
    // Execute in transaction
    _, err = session.WithTransaction(ctx, func(sc mongo.SessionContext) (interface{}, error) {
        // Delete all events in all channels of the project
        if err := s.eventRepo.DeleteByProjectID(sc, projectID); err != nil {
            return nil, err
        }
        
        // Delete all channels
        if err := s.channelRepo.DeleteByProjectID(sc, projectID); err != nil {
            return nil, err
        }
        
        // Delete project
        return nil, s.projectRepo.Delete(sc, projectID)
    })
    
    return err
}
```

---

## Summary

Use Repository + Service + Handler layers with:
- Models in separate files for each entity
- Interfaces for all repositories
- Service layer handling business logic and account linking
- Embedded providers array for multi-OAuth support
- Database indexes for performance
