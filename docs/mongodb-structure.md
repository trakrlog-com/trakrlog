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

This phase extends the authentication system to support multiple OAuth providers (Google, GitHub, etc.) for a single user account with proper account linking.

#### **Phase 4.1: Update User Model**
- Add Provider struct to user model
- Update User struct with Providers array
- Add helper methods for provider management

#### **Phase 4.2: Create Database Indexes**
- Add compound index for provider lookup
- Add email index for user lookup
- Test index creation

#### **Phase 4.3: Extend User Repository**
- Add FindByProvider method
- Add LinkProvider method
- Add UnlinkProvider method
- Add UpdateProvider method (for token refresh)

#### **Phase 4.4: Update User Service**
- Implement AuthenticateWithProvider method
- Add account linking logic
- Add provider validation
- Handle edge cases (duplicate providers, email conflicts)

#### **Phase 4.5: Add GitHub OAuth Provider**
- Configure GitHub OAuth in environment
- Add GitHub provider to Goth setup
- Create GitHub authentication handler
- Add GitHub routes

#### **Phase 4.6: Update Authentication Flow**
- Refactor Google handler to use new service method
- Implement GitHub handler with new service method
- Add provider management endpoints
- Test multi-provider authentication

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

---

## Phase 4: Multi-Provider Authentication - Detailed Implementation

### **Phase 4.1: Update User Model**

Update `internal/model/user.go` to support multiple OAuth providers:

```go
package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Provider represents an OAuth provider linked to a user account
type Provider struct {
	Name         string    `bson:"name" json:"name"`                     // "google", "github", etc.
	ProviderID   string    `bson:"provider_id" json:"providerId"`       // OAuth provider's user ID
	Email        string    `bson:"email" json:"email"`                   // Email from this provider
	AccessToken  string    `bson:"access_token,omitempty" json:"-"`     // Never send to client
	RefreshToken string    `bson:"refresh_token,omitempty" json:"-"`    // Never send to client
	LinkedAt     time.Time `bson:"linked_at" json:"linkedAt"`
	LastUsedAt   time.Time `bson:"last_used_at,omitempty" json:"lastUsedAt,omitempty"`
}

type APIKey struct {
	Key       string    `bson:"key" json:"key"`
	Name      string    `bson:"name" json:"name"`
	CreatedAt time.Time `bson:"created_at" json:"createdAt"`
	LastUsed  time.Time `bson:"last_used,omitempty" json:"lastUsed,omitempty"`
}

type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Email     string             `bson:"email" json:"email"`           // Primary email
	Name      string             `bson:"name" json:"name"`
	Avatar    string             `bson:"avatar,omitempty" json:"avatar,omitempty"`
	Providers []Provider         `bson:"providers" json:"providers"`   // Linked OAuth accounts
	APIKeys   []APIKey           `bson:"api_keys,omitempty" json:"apiKeys,omitempty"`
	CreatedAt time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updatedAt"`
}

// Helper methods
func (u *User) HasProvider(providerName string) bool {
	for _, p := range u.Providers {
		if p.Name == providerName {
			return true
		}
	}
	return false
}

func (u *User) GetProvider(providerName string) *Provider {
	for i := range u.Providers {
		if u.Providers[i].Name == providerName {
			return &u.Providers[i]
		}
	}
	return nil
}
```

---

### **Phase 4.2: Create Database Indexes**

Create `internal/database/indexes.go`:

```go
package database

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// CreateIndexes creates all necessary database indexes
func (s *service) CreateIndexes() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	db := s.GetDB()

	// Users collection indexes
	usersCollection := db.Collection("users")
	
	// Index on email (unique)
	emailIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	
	// Compound index on provider name + provider ID (unique, sparse)
	providerIndex := mongo.IndexModel{
		Keys: bson.D{
			{Key: "providers.name", Value: 1},
			{Key: "providers.provider_id", Value: 1},
		},
		Options: options.Index().SetUnique(true).SetSparse(true),
	}
	
	// API key index for fast lookups
	apiKeyIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "api_keys.key", Value: 1}},
		Options: options.Index().SetSparse(true),
	}
	
	if _, err := usersCollection.Indexes().CreateMany(ctx, []mongo.IndexModel{
		emailIndex,
		providerIndex,
		apiKeyIndex,
	}); err != nil {
		log.Printf("Warning: Failed to create user indexes: %v", err)
		return err
	}

	// Projects collection indexes
	projectsCollection := db.Collection("projects")
	projectUserIndex := mongo.IndexModel{
		Keys: bson.D{{Key: "user_id", Value: 1}},
	}
	
	if _, err := projectsCollection.Indexes().CreateOne(ctx, projectUserIndex); err != nil {
		log.Printf("Warning: Failed to create project indexes: %v", err)
		return err
	}

	// Channels collection indexes
	channelsCollection := db.Collection("channels")
	channelProjectIndex := mongo.IndexModel{
		Keys: bson.D{{Key: "project_id", Value: 1}},
	}
	
	if _, err := channelsCollection.Indexes().CreateOne(ctx, channelProjectIndex); err != nil {
		log.Printf("Warning: Failed to create channel indexes: %v", err)
		return err
	}

	// Events collection indexes
	eventsCollection := db.Collection("events")
	eventIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "channel_id", Value: 1},
				{Key: "created_at", Value: -1},
			},
		},
		{
			Keys: bson.D{
				{Key: "project_id", Value: 1},
				{Key: "created_at", Value: -1},
			},
		},
	}
	
	if _, err := eventsCollection.Indexes().CreateMany(ctx, eventIndexes); err != nil {
		log.Printf("Warning: Failed to create event indexes: %v", err)
		return err
	}

	log.Println("[⚡️ Database]: All indexes created successfully")
	return nil
}
```

Update `internal/database/database.go` Service interface:

```go
type Service interface {
	Health() map[string]string
	GetDB() *mongo.Database
	GetCollection(name string) *mongo.Collection
	CreateIndexes() error  // Add this
}
```

Call `CreateIndexes()` in `internal/server/server.go` after database initialization:

```go
// Initialize database
db := database.New()

// Create indexes
if err := db.CreateIndexes(); err != nil {
	log.Printf("Warning: Index creation failed: %v", err)
}
```

---

### **Phase 4.3: Extend User Repository**

Update `internal/repository/repository.go` interface:

```go
type UserRepository interface {
	Create(ctx context.Context, user *model.User) error
	FindByID(ctx context.Context, id string) (*model.User, error)
	FindByEmail(ctx context.Context, email string) (*model.User, error)
	FindByAPIKey(ctx context.Context, apiKey string) (*model.User, error)
	FindByProvider(ctx context.Context, providerName, providerID string) (*model.User, error)
	LinkProvider(ctx context.Context, userID string, provider model.Provider) error
	UnlinkProvider(ctx context.Context, userID, providerName string) error
	UpdateProvider(ctx context.Context, userID string, provider model.Provider) error
	Update(ctx context.Context, user *model.User) error
	Delete(ctx context.Context, id string) error
}
```

Update `internal/repository/user.go` implementation:

```go
// Add after existing methods

func (r *userRepository) FindByProvider(ctx context.Context, providerName, providerID string) (*model.User, error) {
	var user model.User
	err := r.collection.FindOne(ctx, bson.M{
		"providers": bson.M{
			"$elemMatch": bson.M{
				"name":        providerName,
				"provider_id": providerID,
			},
		},
	}).Decode(&user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *userRepository) LinkProvider(ctx context.Context, userID string, provider model.Provider) error {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	provider.LinkedAt = time.Now()
	provider.LastUsedAt = time.Now()

	update := bson.M{
		"$push": bson.M{
			"providers": provider,
		},
		"$set": bson.M{
			"updated_at": time.Now(),
		},
	}

	_, err = r.collection.UpdateOne(ctx, bson.M{"_id": objectID}, update)
	return err
}

func (r *userRepository) UnlinkProvider(ctx context.Context, userID, providerName string) error {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	update := bson.M{
		"$pull": bson.M{
			"providers": bson.M{
				"name": providerName,
			},
		},
		"$set": bson.M{
			"updated_at": time.Now(),
		},
	}

	_, err = r.collection.UpdateOne(ctx, bson.M{"_id": objectID}, update)
	return err
}

func (r *userRepository) UpdateProvider(ctx context.Context, userID string, provider model.Provider) error {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	provider.LastUsedAt = time.Now()

	update := bson.M{
		"$set": bson.M{
			"providers.$[elem].access_token":  provider.AccessToken,
			"providers.$[elem].refresh_token": provider.RefreshToken,
			"providers.$[elem].last_used_at":  provider.LastUsedAt,
			"updated_at":                      time.Now(),
		},
	}

	arrayFilters := options.Update().SetArrayFilters(options.ArrayFilters{
		Filters: []interface{}{
			bson.M{"elem.name": provider.Name},
		},
	})

	_, err = r.collection.UpdateOne(ctx, bson.M{"_id": objectID}, update, arrayFilters)
	return err
}
```

---

### **Phase 4.4: Update User Service**

Add to `internal/service/user.go`:

```go
// AuthenticateWithProvider handles OAuth authentication with account linking
func (s *UserService) AuthenticateWithProvider(
	ctx context.Context,
	providerName, providerID, email, name, avatar, accessToken, refreshToken string,
) (*model.User, error) {
	
	// Validation
	if providerName == "" || providerID == "" {
		return nil, errors.New("provider name and ID required")
	}
	if email == "" {
		return nil, errors.New("email required")
	}

	// 1. Check if user exists with this provider
	user, err := s.userRepo.FindByProvider(ctx, providerName, providerID)
	if err == nil {
		// User found - update last used and tokens
		provider := user.GetProvider(providerName)
		if provider != nil {
			provider.AccessToken = accessToken
			provider.RefreshToken = refreshToken
			if err := s.userRepo.UpdateProvider(ctx, user.ID.Hex(), *provider); err != nil {
				log.Printf("Warning: Failed to update provider tokens: %v", err)
			}
		}
		
		// Update avatar if changed
		if user.Avatar != avatar && avatar != "" {
			user.Avatar = avatar
			if err := s.userRepo.Update(ctx, user); err != nil {
				log.Printf("Warning: Failed to update avatar: %v", err)
			}
		}
		
		return user, nil
	}

	// 2. Check if user exists with this email
	user, err = s.userRepo.FindByEmail(ctx, email)
	if err == nil {
		// User found - link new provider to existing account
		if user.HasProvider(providerName) {
			return nil, errors.New("provider already linked to this account")
		}
		
		provider := model.Provider{
			Name:         providerName,
			ProviderID:   providerID,
			Email:        email,
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
		}
		
		if err := s.userRepo.LinkProvider(ctx, user.ID.Hex(), provider); err != nil {
			return nil, errors.New("failed to link provider: " + err.Error())
		}
		
		// Reload user to get updated providers
		return s.userRepo.FindByID(ctx, user.ID.Hex())
	}

	// 3. Create new user with this provider
	apiKey := model.APIKey{
		Key:  "tl_" + uuid.New().String(),
		Name: "Default API Key",
	}
	
	user = &model.User{
		Email:   email,
		Name:    name,
		Avatar:  avatar,
		APIKeys: []model.APIKey{apiKey},
		Providers: []model.Provider{
			{
				Name:         providerName,
				ProviderID:   providerID,
				Email:        email,
				AccessToken:  accessToken,
				RefreshToken: refreshToken,
			},
		},
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, errors.New("failed to create user: " + err.Error())
	}

	return user, nil
}

// UnlinkProvider removes an OAuth provider from a user account
func (s *UserService) UnlinkProvider(ctx context.Context, userID, providerName string) error {
	// Verify user exists
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return errors.New("user not found")
	}

	// Ensure user has at least 2 providers before unlinking
	if len(user.Providers) <= 1 {
		return errors.New("cannot unlink last provider")
	}

	// Verify provider exists
	if !user.HasProvider(providerName) {
		return errors.New("provider not linked to this account")
	}

	return s.userRepo.UnlinkProvider(ctx, userID, providerName)
}

// GetLinkedProviders returns list of provider names for a user
func (s *UserService) GetLinkedProviders(ctx context.Context, userID string) ([]string, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	providers := make([]string, len(user.Providers))
	for i, p := range user.Providers {
		providers[i] = p.Name
	}

	return providers, nil
}
```

Don't forget to add the import:
```go
import (
	"log"
	// ... other imports
)
```

---

### **Phase 4.5: Add GitHub OAuth Provider**

**Step 1:** Add GitHub credentials to `.env`:

```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:8080/auth/github/callback
```

**Step 2:** Update `internal/server/routes.go` to add GitHub provider:

```go
import (
	// ... existing imports
	"github.com/markbates/goth/providers/github"
)

func (s *Server) setupGoth(sessionSecret string) {
	store := sessions.NewCookieStore([]byte(sessionSecret))
	store.MaxAge(int(12 * time.Hour / time.Second))
	store.Options.Path = "/"
	store.Options.HttpOnly = true
	store.Options.Secure = os.Getenv("ENV") == "production"

	gothic.Store = store

	goth.UseProviders(
		google.New(
			os.Getenv("GOOGLE_CLIENT_ID"),
			os.Getenv("GOOGLE_CLIENT_SECRET"),
			os.Getenv("GOOGLE_CALLBACK_URL"),
			"email", "profile",
		),
		github.New(
			os.Getenv("GITHUB_CLIENT_ID"),
			os.Getenv("GITHUB_CLIENT_SECRET"),
			os.Getenv("GITHUB_CALLBACK_URL"),
			"user:email",
		),
	)
}
```

**Step 3:** Create `internal/auth/github.go`:

```go
package auth

import (
	"net/http"

	"trakrlog/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/markbates/goth/gothic"
)

type GitHubHandler struct {
	sessionSecret string
	userService   *service.UserService
}

func NewGitHubHandler(sessionSecret string, userService *service.UserService) *GitHubHandler {
	return &GitHubHandler{
		sessionSecret: sessionSecret,
		userService:   userService,
	}
}

func (h *GitHubHandler) Signup(ctx *gin.Context) {
	query := ctx.Request.URL.Query()
	query.Add("provider", "github")
	ctx.Request.URL.RawQuery = query.Encode()

	gothic.BeginAuthHandler(ctx.Writer, ctx.Request)
}

func (h *GitHubHandler) HandleCallback(ctx *gin.Context) {
	query := ctx.Request.URL.Query()
	query.Add("provider", "github")
	ctx.Request.URL.RawQuery = query.Encode()

	gothUser, err := gothic.CompleteUserAuth(ctx.Writer, ctx.Request)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Error authenticating user",
			"error":   err.Error(),
		})
		return
	}

	// Use new AuthenticateWithProvider method
	dbUser, err := h.userService.AuthenticateWithProvider(
		ctx.Request.Context(),
		"github",
		gothUser.UserID,
		gothUser.Email,
		gothUser.Name,
		gothUser.AvatarURL,
		gothUser.AccessToken,
		gothUser.RefreshToken,
	)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Error authenticating with GitHub",
			"error":   err.Error(),
		})
		return
	}

	// Store user session
	session, err := gothic.Store.New(ctx.Request, h.sessionSecret)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Error creating session",
			"error":   err.Error(),
		})
		return
	}

	session.Values["user_id"] = dbUser.ID.Hex()
	session.Values["user_email"] = dbUser.Email

	if err = session.Save(ctx.Request, ctx.Writer); err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Error saving session",
			"error":   err.Error(),
		})
		return
	}

	ctx.Redirect(http.StatusTemporaryRedirect, "/dashboard")
}
```

**Step 4:** Add GitHub routes in `internal/server/routes.go`:

```go
googleHandler := auth.NewGoogleHandler(sessionSectret, s.userService)
githubHandler := auth.NewGitHubHandler(sessionSectret, s.userService)

authGroup := router.Group("/auth")
{
	// Google OAuth
	authGroup.GET("google", googleHandler.Signup)
	authGroup.GET("google/callback", googleHandler.HandleCallback)
	
	// GitHub OAuth
	authGroup.GET("github", githubHandler.Signup)
	authGroup.GET("github/callback", githubHandler.HandleCallback)
	
	// Common auth endpoints
	authGroup.GET("is-auth", googleHandler.GetAuthUser)
	authGroup.GET("login/failed", googleHandler.HandleUnauthorized)
}
```

---

### **Phase 4.6: Update Authentication Flow**

**Step 1:** Refactor `internal/auth/google.go` to use new service method:

```go
func (h *GoogleHandler) HandleCallback(ctx *gin.Context) {
	query := ctx.Request.URL.Query()
	query.Add("provider", "google")
	ctx.Request.URL.RawQuery = query.Encode()

	gothUser, err := gothic.CompleteUserAuth(ctx.Writer, ctx.Request)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Error authenticating user",
			"error":   err.Error(),
		})
		return
	}

	// Use new AuthenticateWithProvider method
	dbUser, err := h.userService.AuthenticateWithProvider(
		ctx.Request.Context(),
		"google",
		gothUser.UserID,
		gothUser.Email,
		gothUser.Name,
		gothUser.AvatarURL,
		gothUser.AccessToken,
		gothUser.RefreshToken,
	)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Error authenticating with Google",
			"error":   err.Error(),
		})
		return
	}

	// Store user session
	session, err := gothic.Store.New(ctx.Request, h.sessionSecret)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Error creating session",
			"error":   err.Error(),
		})
		return
	}

	session.Values["user_id"] = dbUser.ID.Hex()
	session.Values["user_email"] = dbUser.Email

	if err = session.Save(ctx.Request, ctx.Writer); err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Error saving session",
			"error":   err.Error(),
		})
		return
	}

	ctx.Redirect(http.StatusTemporaryRedirect, "/dashboard")
}
```

**Step 2:** Create provider management handler in `internal/handler/user.go`:

```go
package handler

import (
	"net/http"

	"trakrlog/internal/middleware"
	"trakrlog/internal/service"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userService *service.UserService
}

func NewUserHandler(userService *service.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// GetLinkedProviders returns list of OAuth providers linked to user
func (h *UserHandler) GetLinkedProviders(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	providers, err := h.userService.GetLinkedProviders(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to get linked providers",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    providers,
	})
}

// UnlinkProvider removes an OAuth provider from user account
func (h *UserHandler) UnlinkProvider(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	providerName := ctx.Param("provider")
	if providerName == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Provider name required",
		})
		return
	}

	if err := h.userService.UnlinkProvider(ctx.Request.Context(), userID, providerName); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Failed to unlink provider",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Provider unlinked successfully",
	})
}
```

**Step 3:** Add user routes in `internal/server/routes.go`:

```go
api := router.Group("/api")
api.Use(middleware.RequireAuth(sessionSectret))
{
	// User/Profile routes
	userHandler := handler.NewUserHandler(s.userService)
	api.GET("/user/providers", userHandler.GetLinkedProviders)
	api.DELETE("/user/providers/:provider", userHandler.UnlinkProvider)
	
	// ... rest of the routes
}
```

---

### **Testing Phase 4**

1. **Test Google login** - Should create user with Google provider
2. **Test GitHub login with same email** - Should link GitHub to existing user
3. **Test listing providers** - Should show both Google and GitHub
4. **Test unlinking provider** - Should remove provider (only if user has multiple)
5. **Test login with each provider** - Both should work independently


