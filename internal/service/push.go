package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"trakrlog/internal/model"
	"trakrlog/internal/repository"

	webpush "github.com/SherClockHolmes/webpush-go"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PushService handles sending Web Push notifications
type PushService struct {
	subscriptionRepo repository.NotificationSubscriptionRepository
	logRepo          repository.NotificationLogRepository
	vapidPublicKey   string
	vapidPrivateKey  string
	vapidSubject     string
}

// NewPushService creates a new push notification service
func NewPushService(
	subscriptionRepo repository.NotificationSubscriptionRepository,
	logRepo repository.NotificationLogRepository,
	vapidPublicKey string,
	vapidPrivateKey string,
	vapidSubject string,
) *PushService {
	return &PushService{
		subscriptionRepo: subscriptionRepo,
		logRepo:          logRepo,
		vapidPublicKey:   vapidPublicKey,
		vapidPrivateKey:  vapidPrivateKey,
		vapidSubject:     vapidSubject,
	}
}

// SendNotification sends a push notification to a specific subscription
func (s *PushService) SendNotification(ctx context.Context, subscription *model.NotificationSubscription, payload *model.NotificationPayload) error {
	// Marshal payload to JSON
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	// Create the Web Push subscription
	pushSubscription := &webpush.Subscription{
		Endpoint: subscription.Endpoint,
		Keys: webpush.Keys{
			P256dh: subscription.P256dh,
			Auth:   subscription.Auth,
		},
	}

	// Send the notification with retry logic
	var lastErr error
	maxRetries := 3
	for attempt := 0; attempt < maxRetries; attempt++ {
		if attempt > 0 {
			// Exponential backoff: 1s, 2s, 4s
			backoff := time.Duration(1<<uint(attempt-1)) * time.Second
			time.Sleep(backoff)
			log.Printf("Retrying push notification (attempt %d/%d) for subscription %s", attempt+1, maxRetries, subscription.ID.Hex())
		}

		// Send the push notification
		resp, err := webpush.SendNotification(payloadBytes, pushSubscription, &webpush.Options{
			Subscriber:      s.vapidSubject,
			VAPIDPublicKey:  s.vapidPublicKey,
			VAPIDPrivateKey: s.vapidPrivateKey,
			TTL:             3600, // Time to live in seconds (1 hour)
		})

		if err != nil {
			lastErr = err
			// Don't retry on certain errors
			if resp != nil && (resp.StatusCode == http.StatusGone || resp.StatusCode == http.StatusNotFound) {
				break
			}
			continue
		}

		// Check response status
		if resp.StatusCode == http.StatusGone || resp.StatusCode == http.StatusNotFound {
			// Subscription is no longer valid, disable it
			log.Printf("Subscription %s is no longer valid (status %d), disabling", subscription.ID.Hex(), resp.StatusCode)
			subscription.Enabled = false
			if err := s.subscriptionRepo.Update(ctx, subscription); err != nil {
				log.Printf("Failed to disable invalid subscription %s: %v", subscription.ID.Hex(), err)
			}
			return fmt.Errorf("subscription no longer valid: status %d", resp.StatusCode)
		}

		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			lastErr = fmt.Errorf("push service returned status %d", resp.StatusCode)
			continue
		}

		// Success
		resp.Body.Close()
		return nil
	}

	return fmt.Errorf("failed to send notification after %d attempts: %w", maxRetries, lastErr)
}

// SendToUser sends a notification to all active subscriptions for a user
// A user may have multiple subscriptions (one per device/browser they use)
// For example: desktop Chrome, mobile Firefox, laptop Edge, etc.
func (s *PushService) SendToUser(ctx context.Context, userID string, payload *model.NotificationPayload, eventID string) error {
	// Get all active subscriptions for the user
	subscriptions, err := s.subscriptionRepo.FindActiveByUserID(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to get user subscriptions: %w", err)
	}

	if len(subscriptions) == 0 {
		log.Printf("No active subscriptions found for user %s", userID)
		return nil
	}

	// Send to all subscriptions
	successCount := 0
	for _, subscription := range subscriptions {
		err := s.SendNotification(ctx, subscription, payload)

		// Log the notification attempt
		status := "sent"
		errorMsg := ""
		if err != nil {
			status = "failed"
			errorMsg = err.Error()
			log.Printf("Failed to send notification to subscription %s: %v", subscription.ID.Hex(), err)
		} else {
			successCount++
		}

		// Create notification log
		notificationLog := &model.NotificationLog{
			UserID:         subscription.UserID,
			SubscriptionID: subscription.ID,
			Status:         status,
			Error:          errorMsg,
		}

		// Add event ID if provided
		if eventID != "" {
			eventObjID, parseErr := primitive.ObjectIDFromHex(eventID)
			if parseErr == nil {
				notificationLog.EventID = eventObjID
			}
		}

		if logErr := s.logRepo.Create(ctx, notificationLog); logErr != nil {
			log.Printf("Failed to create notification log: %v", logErr)
		}
	}

	if successCount == 0 {
		return fmt.Errorf("failed to send notification to any of %d subscriptions", len(subscriptions))
	}

	log.Printf("Successfully sent notification to %d/%d subscriptions for user %s", successCount, len(subscriptions), userID)
	return nil
}

// GetNotificationLogs retrieves notification logs for a user with pagination
func (s *PushService) GetNotificationLogs(ctx context.Context, userID string, limit, offset int64) ([]*model.NotificationLog, error) {
	return s.logRepo.FindByUserID(ctx, userID, limit, offset)
}
