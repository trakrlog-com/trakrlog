package service

import (
	"context"
	"errors"

	"trakrlog/internal/model"
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
func (s *ProjectService) CreateProject(ctx context.Context, userID, name string, logoBase64 string) (*model.Project, error) {
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
	project := &model.Project{
		UserID:     userOID,
		Name:       name,
		LogoBase64: logoBase64,
	}

	if err := s.projectRepo.Create(ctx, project); err != nil {
		return nil, err
	}

	return project, nil
}

// GetProjectByID retrieves a project by ID
func (s *ProjectService) GetProjectByID(ctx context.Context, id string) (*model.Project, error) {
	return s.projectRepo.FindByID(ctx, id)
}

// GetUserProjects retrieves all projects for a user
func (s *ProjectService) GetUserProjects(ctx context.Context, userID string) ([]*model.Project, error) {
	// Verify user exists
	_, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	return s.projectRepo.FindByUserID(ctx, userID)
}

// UpdateProject updates project information
func (s *ProjectService) UpdateProject(ctx context.Context, userID string, project *model.Project) error {
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
