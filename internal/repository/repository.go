package repository

import (
	"context"
	"trakrlog/internal/models"
)

// UserRepository defines the interface for user data operations
type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	FindByID(ctx context.Context, id string) (*models.User, error)
	FindByEmail(ctx context.Context, email string) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
	Delete(ctx context.Context, id string) error
}

// ProjectRepository defines the interface for project data operations
type ProjectRepository interface {
	Create(ctx context.Context, project *models.Project) error
	FindByID(ctx context.Context, id string) (*models.Project, error)
	FindByUserID(ctx context.Context, userID string) ([]*models.Project, error)
	Update(ctx context.Context, project *models.Project) error
	Delete(ctx context.Context, id string) error
}

// ChannelRepository defines the interface for channel data operations
type ChannelRepository interface {
	Create(ctx context.Context, channel *models.Channel) error
	FindByID(ctx context.Context, id string) (*models.Channel, error)
	FindByProjectID(ctx context.Context, projectID string) ([]*models.Channel, error)
	Update(ctx context.Context, channel *models.Channel) error
	Delete(ctx context.Context, id string) error
}

// EventRepository defines the interface for event data operations
type EventRepository interface {
	Create(ctx context.Context, event *models.Event) error
	FindByID(ctx context.Context, id string) (*models.Event, error)
	FindByChannelID(ctx context.Context, channelID string, limit, offset int64) ([]*models.Event, error)
	FindByProjectID(ctx context.Context, projectID string, limit, offset int64) ([]*models.Event, error)
	Update(ctx context.Context, event *models.Event) error
	Delete(ctx context.Context, id string) error
}
