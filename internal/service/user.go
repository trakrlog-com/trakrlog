package service

import (
	"context"
	"errors"
	"log"

	"trakrlog/internal/model"
	"trakrlog/internal/repository"

	"github.com/google/uuid"
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
func (s *UserService) CreateUser(ctx context.Context, email, name string) (*model.User, error) {
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

	// Create an API Key
	apiKey := model.APIKey{Key: "tl_" + uuid.New().String()}

	// Create user
	user := &model.User{
		Email:   email,
		Name:    name,
		APIKeys: []model.APIKey{apiKey},
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

// GetUserByID retrieves a user by ID
func (s *UserService) GetUserByID(ctx context.Context, id string) (*model.User, error) {
	return s.userRepo.FindByID(ctx, id)
}

// GetUserByEmail retrieves a user by email
func (s *UserService) GetUserByEmail(ctx context.Context, email string) (*model.User, error) {
	return s.userRepo.FindByEmail(ctx, email)
}

// FindByAPIKey retrieves a user by API key
func (s *UserService) FindByAPIKey(ctx context.Context, apiKey string) (*model.User, error) {
	return s.userRepo.FindByAPIKey(ctx, apiKey)
}

// UpdateUser updates user information
func (s *UserService) UpdateUser(ctx context.Context, user *model.User) error {
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
