package service

import (
	"context"
	"time"

	"trakrlog/internal/model"
	"trakrlog/internal/repository"
)

// SubscriptionService handles the business logic for managing notification subscriptions
type SubscriptionService struct {
	subscriptionRepo repository.NotificationSubscriptionRepository
}

// NewSubscriptionService creates a new subscription service
func NewSubscriptionService(
	subscriptionRepo repository.NotificationSubscriptionRepository,
) *SubscriptionService {
	return &SubscriptionService{
		subscriptionRepo: subscriptionRepo,
	}
}

// CreateSubscription creates a new push notification subscription
func (s *SubscriptionService) CreateSubscription(ctx context.Context, subscription *model.NotificationSubscription) error {
	subscription.CreatedAt = time.Now()
	subscription.UpdatedAt = time.Now()
	subscription.Enabled = true
	return s.subscriptionRepo.Create(ctx, subscription)
}

// GetSubscriptions retrieves all subscriptions for a user
func (s *SubscriptionService) GetSubscriptions(ctx context.Context, userID string) ([]*model.NotificationSubscription, error) {
	return s.subscriptionRepo.FindByUserID(ctx, userID)
}

// GetSubscriptionByID retrieves a specific subscription by ID
func (s *SubscriptionService) GetSubscriptionByID(ctx context.Context, id string) (*model.NotificationSubscription, error) {
	return s.subscriptionRepo.FindByID(ctx, id)
}

// UpdateSubscription updates an existing subscription
func (s *SubscriptionService) UpdateSubscription(ctx context.Context, subscription *model.NotificationSubscription) error {
	subscription.UpdatedAt = time.Now()
	return s.subscriptionRepo.Update(ctx, subscription)
}

// DeleteSubscription removes a subscription
func (s *SubscriptionService) DeleteSubscription(ctx context.Context, id string) error {
	return s.subscriptionRepo.Delete(ctx, id)
}

// GetActiveSubscriptions retrieves all active subscriptions for a user
func (s *SubscriptionService) GetActiveSubscriptions(ctx context.Context, userID string) ([]*model.NotificationSubscription, error) {
	return s.subscriptionRepo.FindActiveByUserID(ctx, userID)
}
