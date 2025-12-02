package service

import (
	"context"
	"errors"

	"trakrlog/internal/model"
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
func (s *EventService) CreateEvent(ctx context.Context, userID, projectID, channelID, title, description, icon string, tags map[string]string) (*model.Event, error) {
	// Validation
	if title == "" {
		return nil, errors.New("event title required")
	}

	// Verify project exists and belongs to user
	project, err := s.projectRepo.FindByID(ctx, projectID)
	if err != nil {
		return nil, errors.New("project not found")
	}

	if project.UserID.Hex() != userID {
		return nil, errors.New("unauthorized: project does not belong to user")
	}

	// Verify channel exists and belongs to the project
	channel, err := s.channelRepo.FindByID(ctx, channelID)
	if err != nil {
		return nil, errors.New("channel not found")
	}

	if channel.ProjectID.Hex() != projectID {
		return nil, errors.New("channel does not belong to the specified project")
	}

	// Create event
	channelOID, _ := primitive.ObjectIDFromHex(channelID)
	event := &model.Event{
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
func (s *EventService) GetEventByID(ctx context.Context, id string) (*model.Event, error) {
	return s.eventRepo.FindByID(ctx, id)
}

// GetChannelEvents retrieves paginated events for a channel
func (s *EventService) GetChannelEvents(ctx context.Context, userID, channelID string, limit, offset int64) ([]*model.Event, error) {
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
func (s *EventService) GetProjectEvents(ctx context.Context, userID, projectID string, limit, offset int64) ([]*model.Event, error) {
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
func (s *EventService) UpdateEvent(ctx context.Context, userID string, event *model.Event) error {
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
