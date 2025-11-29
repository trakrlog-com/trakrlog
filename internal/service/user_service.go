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
