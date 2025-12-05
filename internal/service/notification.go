package service

import (
	"context"
	"fmt"
	"log"

	"trakrlog/internal/model"
)

// PushServiceInterface defines the interface for push notification operations
type PushServiceInterface interface {
	SendToUser(ctx context.Context, userID string, payload *model.NotificationPayload, eventID string) error
}

// ProjectServiceInterface defines the interface for project operations
type ProjectServiceInterface interface {
	GetProjectByID(ctx context.Context, id string) (*model.Project, error)
}

// ChannelServiceInterface defines the interface for channel operations
type ChannelServiceInterface interface {
	GetChannelByID(ctx context.Context, id string) (*model.Channel, error)
}

// NotificationService handles the business logic for sending notifications based on events
type NotificationService struct {
	pushService    PushServiceInterface
	projectService ProjectServiceInterface
	channelService ChannelServiceInterface
}

// NewNotificationService creates a new notification service
func NewNotificationService(
	pushService PushServiceInterface,
	projectService ProjectServiceInterface,
	channelService ChannelServiceInterface,
) *NotificationService {
	return &NotificationService{
		pushService:    pushService,
		projectService: projectService,
		channelService: channelService,
	}
}

// ProcessEventNotification processes an event and sends notifications to subscribed users
// In the MVP, all events trigger notifications for users with active subscriptions
func (s *NotificationService) ProcessEventNotification(ctx context.Context, event *model.Event) error {
	// Get project details to build notification context
	project, err := s.projectService.GetProjectByID(ctx, event.ProjectID.Hex())
	if err != nil {
		return fmt.Errorf("failed to get project: %w", err)
	}

	// Get channel details
	channel, err := s.channelService.GetChannelByID(ctx, event.ChannelID.Hex())
	if err != nil {
		return fmt.Errorf("failed to get channel: %w", err)
	}

	// Build notification payload
	payload := s.buildNotificationPayload(event, project, channel)

	// Send notification to the project owner
	// Note: In MVP, we send to project owner. Future enhancement: support channel subscribers
	userID := project.UserID.Hex()

	log.Printf("Processing notification for event %s to user %s", event.ID.Hex(), userID)

	if err := s.pushService.SendToUser(ctx, userID, payload, event.ID.Hex()); err != nil {
		// Log the error but don't fail event creation
		log.Printf("Failed to send notification for event %s: %v", event.ID.Hex(), err)
		return fmt.Errorf("failed to send notification: %w", err)
	}

	return nil
}

// buildNotificationPayload creates the notification payload from event data
func (s *NotificationService) buildNotificationPayload(
	event *model.Event,
	project *model.Project,
	channel *model.Channel,
) *model.NotificationPayload {
	// Build notification title
	title := fmt.Sprintf("[%s] %s", project.Name, event.Title)
	if len(title) > 80 {
		title = title[:77] + "..."
	}

	// Build notification body
	body := event.Description
	if body == "" {
		body = fmt.Sprintf("New event in %s", channel.Name)
	}
	if len(body) > 120 {
		body = body[:117] + "..."
	}

	// Use event icon if available, otherwise use project logo or default
	icon := event.Icon
	if icon == "" && project.LogoBase64 != "" {
		icon = project.LogoBase64
	}
	if icon == "" {
		icon = "/icon.png" // Default app icon
	}

	// Build the notification data with event metadata
	data := map[string]interface{}{
		"eventId":   event.ID.Hex(),
		"projectId": project.ID.Hex(),
		"channelId": channel.ID.Hex(),
		"url":       fmt.Sprintf("/projects/%s/channels/%s/events/%s", project.ID.Hex(), channel.ID.Hex(), event.ID.Hex()),
		"timestamp": event.CreatedAt.Unix(),
	}

	// Add tags if present
	if len(event.Tags) > 0 {
		data["tags"] = event.Tags
	}

	return &model.NotificationPayload{
		Title: title,
		Body:  body,
		Icon:  icon,
		Badge: "/badge.png",
		Tag:   fmt.Sprintf("event-%s", event.ID.Hex()), // Group notifications by event
		Data:  data,
		Actions: []model.NotificationAction{
			{
				Action: "view",
				Title:  "View Event",
			},
			{
				Action: "close",
				Title:  "Dismiss",
			},
		},
	}
}

// SendTestNotification sends a test notification to verify the setup
func (s *NotificationService) SendTestNotification(ctx context.Context, userID string) error {
	payload := &model.NotificationPayload{
		Title: "🔔 Test Notification",
		Body:  "Your push notifications are working correctly!",
		Icon:  "/icon.png",
		Badge: "/badge.png",
		Tag:   "test-notification",
		Data: map[string]interface{}{
			"type": "test",
			"url":  "/settings",
		},
		Actions: []model.NotificationAction{
			{
				Action: "view",
				Title:  "Open Settings",
			},
		},
	}

	if err := s.pushService.SendToUser(ctx, userID, payload, ""); err != nil {
		return fmt.Errorf("failed to send test notification: %w", err)
	}

	log.Printf("Test notification sent successfully to user %s", userID)
	return nil
}
