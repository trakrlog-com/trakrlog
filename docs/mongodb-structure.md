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

Implement services one entity at a time, building from least to most dependent.

### Phase 2.1: User Service

**Create `internal/service/user_service.go`:**

```go
package service

import (
    "context"
    "errors"
    "trakrlog/internal/models"
    "trakrlog/internal/repository"
)

type UserService struct {
    userRepo repository.UserRepository
}

func NewUserService(userRepo repository.UserRepository) *UserService {
    return &UserService{
        userRepo: userRepo,
    }
}

// CreateUser creates a new user with validation
func (s *UserService) CreateUser(ctx context.Context, email, name string) (*models.User, error) {
    // Validation
    if email == "" {
        return nil, errors.New("email required")
    }
    if name == "" {
        return nil, errors.New("name required")
    }
    
    // Check for duplicates
    existing, _ := s.userRepo.FindByEmail(ctx, email)
    if existing != nil {
        return nil, errors.New("user with this email already exists")
    }
    
    // Create user
    user := &models.User{
        Email: email,
        Name:  name,
    }
    
    if err := s.userRepo.Create(ctx, user); err != nil {
        return nil, err
    }
    
    return user, nil
}

// GetUserByID retrieves a user by ID
func (s *UserService) GetUserByID(ctx context.Context, id string) (*models.User, error) {
    return s.userRepo.FindByID(ctx, id)
}

// GetUserByEmail retrieves a user by email
func (s *UserService) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
    return s.userRepo.FindByEmail(ctx, email)
}

// UpdateUser updates user information
func (s *UserService) UpdateUser(ctx context.Context, user *models.User) error {
    if user.ID.IsZero() {
        return errors.New("user ID required")
    }
    
    // Verify user exists
    existing, err := s.userRepo.FindByID(ctx, user.ID.Hex())
    if err != nil {
        return errors.New("user not found")
    }
    
    // Update fields
    existing.Name = user.Name
    existing.Avatar = user.Avatar
    
    return s.userRepo.Update(ctx, existing)
}

// DeleteUser deletes a user
func (s *UserService) DeleteUser(ctx context.Context, id string) error {
    // Verify user exists
    _, err := s.userRepo.FindByID(ctx, id)
    if err != nil {
        return errors.New("user not found")
    }
    
    return s.userRepo.Delete(ctx, id)
}
```

---

### Phase 2.2: Project Service

**Create `internal/service/project_service.go`:**

```go
package service

import (
    "context"
    "errors"
    "trakrlog/internal/models"
    "trakrlog/internal/repository"
    
    "go.mongodb.org/mongo-driver/bson/primitive"
)

type ProjectService struct {
    projectRepo repository.ProjectRepository
    userRepo    repository.UserRepository
}

func NewProjectService(projectRepo repository.ProjectRepository, userRepo repository.UserRepository) *ProjectService {
    return &ProjectService{
        projectRepo: projectRepo,
        userRepo:    userRepo,
    }
}

// CreateProject creates a new project for a user
func (s *ProjectService) CreateProject(ctx context.Context, userID, name string) (*models.Project, error) {
    // Validation
    if name == "" {
        return nil, errors.New("project name required")
    }
    
    // Verify user exists
    userOID, err := primitive.ObjectIDFromHex(userID)
    if err != nil {
        return nil, errors.New("invalid user ID")
    }
    
    _, err = s.userRepo.FindByID(ctx, userID)
    if err != nil {
        return nil, errors.New("user not found")
    }
    
    // Create project
    project := &models.Project{
        UserID: userOID,
        Name:   name,
    }
    
    if err := s.projectRepo.Create(ctx, project); err != nil {
        return nil, err
    }
    
    return project, nil
}

// GetProjectByID retrieves a project by ID
func (s *ProjectService) GetProjectByID(ctx context.Context, id string) (*models.Project, error) {
    return s.projectRepo.FindByID(ctx, id)
}

// GetUserProjects retrieves all projects for a user
func (s *ProjectService) GetUserProjects(ctx context.Context, userID string) ([]*models.Project, error) {
    // Verify user exists
    _, err := s.userRepo.FindByID(ctx, userID)
    if err != nil {
        return nil, errors.New("user not found")
    }
    
    return s.projectRepo.FindByUserID(ctx, userID)
}

// UpdateProject updates project information
func (s *ProjectService) UpdateProject(ctx context.Context, userID string, project *models.Project) error {
    if project.ID.IsZero() {
        return errors.New("project ID required")
    }
    
    // Verify project exists and belongs to user
    existing, err := s.projectRepo.FindByID(ctx, project.ID.Hex())
    if err != nil {
        return errors.New("project not found")
    }
    
    if existing.UserID.Hex() != userID {
        return errors.New("unauthorized: project does not belong to user")
    }
    
    // Update fields
    existing.Name = project.Name
    existing.LogoBase64 = project.LogoBase64
    
    return s.projectRepo.Update(ctx, existing)
}

// DeleteProject deletes a project (user must own it)
func (s *ProjectService) DeleteProject(ctx context.Context, userID, projectID string) error {
    // Verify project exists and belongs to user
    project, err := s.projectRepo.FindByID(ctx, projectID)
    if err != nil {
        return errors.New("project not found")
    }
    
    if project.UserID.Hex() != userID {
        return errors.New("unauthorized: project does not belong to user")
    }
    
    return s.projectRepo.Delete(ctx, projectID)
}
```

---

### Phase 2.3: Channel Service

**Create `internal/service/channel_service.go`:**

```go
package service

import (
    "context"
    "errors"
    "trakrlog/internal/models"
    "trakrlog/internal/repository"
    
    "go.mongodb.org/mongo-driver/bson/primitive"
)

type ChannelService struct {
    channelRepo repository.ChannelRepository
    projectRepo repository.ProjectRepository
}

func NewChannelService(channelRepo repository.ChannelRepository, projectRepo repository.ProjectRepository) *ChannelService {
    return &ChannelService{
        channelRepo: channelRepo,
        projectRepo: projectRepo,
    }
}

// CreateChannel creates a new channel in a project
func (s *ChannelService) CreateChannel(ctx context.Context, userID, projectID, name string) (*models.Channel, error) {
    // Validation
    if name == "" {
        return nil, errors.New("channel name required")
    }
    
    // Verify project exists
    project, err := s.projectRepo.FindByID(ctx, projectID)
    if err != nil {
        return nil, errors.New("project not found")
    }
    
    // Verify project belongs to user
    if project.UserID.Hex() != userID {
        return nil, errors.New("unauthorized: project does not belong to user")
    }
    
    // Create channel
    projectOID, _ := primitive.ObjectIDFromHex(projectID)
    channel := &models.Channel{
        ProjectID: projectOID,
        Name:      name,
    }
    
    if err := s.channelRepo.Create(ctx, channel); err != nil {
        return nil, err
    }
    
    return channel, nil
}

// GetChannelByID retrieves a channel by ID
func (s *ChannelService) GetChannelByID(ctx context.Context, id string) (*models.Channel, error) {
    return s.channelRepo.FindByID(ctx, id)
}

// GetProjectChannels retrieves all channels for a project
func (s *ChannelService) GetProjectChannels(ctx context.Context, userID, projectID string) ([]*models.Channel, error) {
    // Verify project exists and belongs to user
    project, err := s.projectRepo.FindByID(ctx, projectID)
    if err != nil {
        return nil, errors.New("project not found")
    }
    
    if project.UserID.Hex() != userID {
        return nil, errors.New("unauthorized: project does not belong to user")
    }
    
    return s.channelRepo.FindByProjectID(ctx, projectID)
}

// UpdateChannel updates channel information
func (s *ChannelService) UpdateChannel(ctx context.Context, userID string, channel *models.Channel) error {
    if channel.ID.IsZero() {
        return errors.New("channel ID required")
    }
    
    // Verify channel exists
    existing, err := s.channelRepo.FindByID(ctx, channel.ID.Hex())
    if err != nil {
        return errors.New("channel not found")
    }
    
    // Verify project belongs to user
    project, err := s.projectRepo.FindByID(ctx, existing.ProjectID.Hex())
    if err != nil {
        return errors.New("project not found")
    }
    
    if project.UserID.Hex() != userID {
        return errors.New("unauthorized: project does not belong to user")
    }
    
    // Update fields
    existing.Name = channel.Name
    
    return s.channelRepo.Update(ctx, existing)
}

// DeleteChannel deletes a channel (user must own the project)
func (s *ChannelService) DeleteChannel(ctx context.Context, userID, channelID string) error {
    // Verify channel exists
    channel, err := s.channelRepo.FindByID(ctx, channelID)
    if err != nil {
        return errors.New("channel not found")
    }
    
    // Verify project belongs to user
    project, err := s.projectRepo.FindByID(ctx, channel.ProjectID.Hex())
    if err != nil {
        return errors.New("project not found")
    }
    
    if project.UserID.Hex() != userID {
        return errors.New("unauthorized: project does not belong to user")
    }
    
    return s.channelRepo.Delete(ctx, channelID)
}
```

---

### Phase 2.4: Event Service

**Create `internal/service/event_service.go`:**

```go
package service

import (
    "context"
    "errors"
    "trakrlog/internal/models"
    "trakrlog/internal/repository"
    
    "go.mongodb.org/mongo-driver/bson/primitive"
)

type EventService struct {
    eventRepo   repository.EventRepository
    channelRepo repository.ChannelRepository
    projectRepo repository.ProjectRepository
}

func NewEventService(eventRepo repository.EventRepository, channelRepo repository.ChannelRepository, projectRepo repository.ProjectRepository) *EventService {
    return &EventService{
        eventRepo:   eventRepo,
        channelRepo: channelRepo,
        projectRepo: projectRepo,
    }
}

// CreateEvent creates a new event in a channel
func (s *EventService) CreateEvent(ctx context.Context, userID, channelID, title, description, icon string, tags []string) (*models.Event, error) {
    // Validation
    if title == "" {
        return nil, errors.New("event title required")
    }
    
    // Verify channel exists
    channel, err := s.channelRepo.FindByID(ctx, channelID)
    if err != nil {
        return nil, errors.New("channel not found")
    }
    
    // Verify project belongs to user
    project, err := s.projectRepo.FindByID(ctx, channel.ProjectID.Hex())
    if err != nil {
        return nil, errors.New("project not found")
    }
    
    if project.UserID.Hex() != userID {
        return nil, errors.New("unauthorized: project does not belong to user")
    }
    
    // Create event
    channelOID, _ := primitive.ObjectIDFromHex(channelID)
    event := &models.Event{
        ChannelID:   channelOID,
        ProjectID:   channel.ProjectID,
        Title:       title,
        Description: description,
        Icon:        icon,
        Tags:        tags,
    }
    
    if err := s.eventRepo.Create(ctx, event); err != nil {
        return nil, err
    }
    
    return event, nil
}

// GetEventByID retrieves an event by ID
func (s *EventService) GetEventByID(ctx context.Context, id string) (*models.Event, error) {
    return s.eventRepo.FindByID(ctx, id)
}

// GetChannelEvents retrieves paginated events for a channel
func (s *EventService) GetChannelEvents(ctx context.Context, userID, channelID string, limit, offset int64) ([]*models.Event, error) {
    // Verify channel exists
    channel, err := s.channelRepo.FindByID(ctx, channelID)
    if err != nil {
        return nil, errors.New("channel not found")
    }
    
    // Verify project belongs to user
    project, err := s.projectRepo.FindByID(ctx, channel.ProjectID.Hex())
    if err != nil {
        return nil, errors.New("project not found")
    }
    
    if project.UserID.Hex() != userID {
        return nil, errors.New("unauthorized: project does not belong to user")
    }
    
    return s.eventRepo.FindByChannelID(ctx, channelID, limit, offset)
}

// GetProjectEvents retrieves paginated events for a project
func (s *EventService) GetProjectEvents(ctx context.Context, userID, projectID string, limit, offset int64) ([]*models.Event, error) {
    // Verify project exists and belongs to user
    project, err := s.projectRepo.FindByID(ctx, projectID)
    if err != nil {
        return nil, errors.New("project not found")
    }
    
    if project.UserID.Hex() != userID {
        return nil, errors.New("unauthorized: project does not belong to user")
    }
    
    return s.eventRepo.FindByProjectID(ctx, projectID, limit, offset)
}

// UpdateEvent updates event information
func (s *EventService) UpdateEvent(ctx context.Context, userID string, event *models.Event) error {
    if event.ID.IsZero() {
        return errors.New("event ID required")
    }
    
    // Verify event exists
    existing, err := s.eventRepo.FindByID(ctx, event.ID.Hex())
    if err != nil {
        return errors.New("event not found")
    }
    
    // Verify project belongs to user
    project, err := s.projectRepo.FindByID(ctx, existing.ProjectID.Hex())
    if err != nil {
        return errors.New("project not found")
    }
    
    if project.UserID.Hex() != userID {
        return errors.New("unauthorized: project does not belong to user")
    }
    
    // Update fields
    existing.Title = event.Title
    existing.Description = event.Description
    existing.Icon = event.Icon
    existing.Tags = event.Tags
    
    return s.eventRepo.Update(ctx, existing)
}

// DeleteEvent deletes an event (user must own the project)
func (s *EventService) DeleteEvent(ctx context.Context, userID, eventID string) error {
    // Verify event exists
    event, err := s.eventRepo.FindByID(ctx, eventID)
    if err != nil {
        return errors.New("event not found")
    }
    
    // Verify project belongs to user
    project, err := s.projectRepo.FindByID(ctx, event.ProjectID.Hex())
    if err != nil {
        return errors.New("project not found")
    }
    
    if project.UserID.Hex() != userID {
        return errors.New("unauthorized: project does not belong to user")
    }
    
    return s.eventRepo.Delete(ctx, eventID)
}
```

---

### Phase 2.5: Wire Services in Server

**Update `internal/server/server.go`:**

```go
type Server struct {
    port int
    db   database.Service
    
    // Add services
    userService    *service.UserService
    projectService *service.ProjectService
    channelService *service.ChannelService
    eventService   *service.EventService
}

func NewServer() *http.Server {
    port, _ := strconv.Atoi(os.Getenv("PORT"))
    
    // Initialize DB
    db := database.New()
    
    // Initialize repositories
    userRepo := repository.NewUserRepository(db)
    projectRepo := repository.NewProjectRepository(db)
    channelRepo := repository.NewChannelRepository(db)
    eventRepo := repository.NewEventRepository(db)
    
    // Initialize services (note the dependencies)
    userService := service.NewUserService(userRepo)
    projectService := service.NewProjectService(projectRepo, userRepo)
    channelService := service.NewChannelService(channelRepo, projectRepo)
    eventService := service.NewEventService(eventRepo, channelRepo, projectRepo)
    
    server := &Server{
        port: port,
        db: db,
        userService: userService,
        projectService: projectService,
        channelService: channelService,
        eventService: eventService,
    }
    
    return &http.Server{
        Addr:    fmt.Sprintf(":%d", server.port),
        Handler: server.RegisterRouter(),
    }
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
