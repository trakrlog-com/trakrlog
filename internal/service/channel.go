package service

import (
	"context"
	"errors"

	"trakrlog/internal/model"
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
func (s *ChannelService) CreateChannel(ctx context.Context, userID, projectID, name string) (*model.Channel, error) {
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
	channel := &model.Channel{
		ProjectID: projectOID,
		Name:      name,
	}

	if err := s.channelRepo.Create(ctx, channel); err != nil {
		return nil, err
	}

	return channel, nil
}

// GetChannelByID retrieves a channel by ID
func (s *ChannelService) GetChannelByID(ctx context.Context, id string) (*model.Channel, error) {
	return s.channelRepo.FindByID(ctx, id)
}

// GetProjectChannels retrieves all channels for a project
func (s *ChannelService) GetProjectChannels(ctx context.Context, userID, projectID string) ([]*model.Channel, error) {
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

// GetAllChannels retrieves all channels for all projects of a user
func (s *ChannelService) GetAllChannels(ctx context.Context, userID string) ([]*model.Channel, error) {
	// Get all projects for the user
	projects, err := s.projectRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	var allChannels []*model.Channel
	for _, project := range projects {
		channels, err := s.channelRepo.FindByProjectID(ctx, project.ID.Hex())
		if err != nil {
			return nil, err
		}
		allChannels = append(allChannels, channels...)
	}

	return allChannels, nil
}

// UpdateChannel updates channel information
func (s *ChannelService) UpdateChannel(ctx context.Context, userID string, channel *model.Channel) error {
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
