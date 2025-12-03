package repository

import (
	"context"
	"trakrlog/internal/model"
)

// UserRepository defines the interface for user data operations
type UserRepository interface {
	Create(ctx context.Context, user *model.User) error
	FindByID(ctx context.Context, id string) (*model.User, error)
	FindByEmail(ctx context.Context, email string) (*model.User, error)
	FindByAPIKey(ctx context.Context, apiKey string) (*model.User, error)
	Update(ctx context.Context, user *model.User) error
	Delete(ctx context.Context, id string) error
}

// ProjectRepository defines the interface for project data operations
type ProjectRepository interface {
	Create(ctx context.Context, project *model.Project) error
	FindByID(ctx context.Context, id string) (*model.Project, error)
	FindByUserID(ctx context.Context, userID string) ([]*model.Project, error)
	Update(ctx context.Context, project *model.Project) error
	Delete(ctx context.Context, id string) error
}

// ChannelRepository defines the interface for channel data operations
type ChannelRepository interface {
	Create(ctx context.Context, channel *model.Channel) error
	FindByID(ctx context.Context, id string) (*model.Channel, error)
	FindByProjectID(ctx context.Context, projectID string) ([]*model.Channel, error)
	Update(ctx context.Context, channel *model.Channel) error
	Delete(ctx context.Context, id string) error
}

// EventRepository defines the interface for event data operations
type EventRepository interface {
	Create(ctx context.Context, event *model.Event) error
	FindByID(ctx context.Context, id string) (*model.Event, error)
	FindByChannelID(ctx context.Context, channelID string, limit, offset int64) ([]*model.Event, error)
	FindByProjectID(ctx context.Context, projectID string, limit, offset int64) ([]*model.Event, error)
	Update(ctx context.Context, event *model.Event) error
	Delete(ctx context.Context, id string) error
}
