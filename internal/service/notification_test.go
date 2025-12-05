package service

import (
	"context"
	"testing"

	"trakrlog/internal/model"
	"trakrlog/internal/service/mocks"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestProcessEventNotification_Success(t *testing.T) {
	ctx := context.Background()
	mockPush := new(mocks.MockPushService)
	mockProject := new(mocks.MockProjectService)
	mockChannel := new(mocks.MockChannelService)

	userID := primitive.NewObjectID()
	projectID := primitive.NewObjectID()
	channelID := primitive.NewObjectID()
	eventID := primitive.NewObjectID()

	project := &model.Project{
		ID:     projectID,
		UserID: userID,
		Name:   "Test Project",
	}

	channel := &model.Channel{
		ID:        channelID,
		ProjectID: projectID,
		Name:      "test-channel",
	}

	event := &model.Event{
		ID:          eventID,
		ProjectID:   projectID,
		ChannelID:   channelID,
		Title:       "Test Event",
		Description: "This is a test event",
		Icon:        "🔔",
	}

	mockProject.On("GetProjectByID", ctx, projectID.Hex()).Return(project, nil)
	mockChannel.On("GetChannelByID", ctx, channelID.Hex()).Return(channel, nil)
	mockPush.On("SendToUser", ctx, userID.Hex(), mock.Anything, eventID.Hex()).Return(nil)

	service := NewNotificationService(mockPush, mockProject, mockChannel)
	err := service.ProcessEventNotification(ctx, event)

	assert.NoError(t, err)
	mockProject.AssertExpectations(t)
	mockChannel.AssertExpectations(t)
	mockPush.AssertExpectations(t)
}

func TestBuildNotificationPayload(t *testing.T) {
	mockPush := new(mocks.MockPushService)
	mockProject := new(mocks.MockProjectService)
	mockChannel := new(mocks.MockChannelService)

	service := NewNotificationService(mockPush, mockProject, mockChannel)

	projectID := primitive.NewObjectID()
	channelID := primitive.NewObjectID()
	eventID := primitive.NewObjectID()

	project := &model.Project{
		ID:     projectID,
		Name:   "My Project",
		UserID: primitive.NewObjectID(),
	}

	channel := &model.Channel{
		ID:        channelID,
		ProjectID: projectID,
		Name:      "errors",
	}

	event := &model.Event{
		ID:          eventID,
		ProjectID:   projectID,
		ChannelID:   channelID,
		Title:       "Database Connection Failed",
		Description: "Unable to connect to PostgreSQL database",
		Icon:        "🔴",
		Tags:        map[string]string{"severity": "critical", "env": "production"},
	}

	payload := service.buildNotificationPayload(event, project, channel)

	assert.Equal(t, "[My Project] Database Connection Failed", payload.Title)
	assert.Equal(t, "Unable to connect to PostgreSQL database", payload.Body)
	assert.Equal(t, "🔴", payload.Icon)
	assert.Equal(t, "/badge.png", payload.Badge)
	assert.Equal(t, "event-"+eventID.Hex(), payload.Tag)
	assert.NotNil(t, payload.Data)
	assert.Equal(t, eventID.Hex(), payload.Data["eventId"])
	assert.Equal(t, projectID.Hex(), payload.Data["projectId"])
	assert.Equal(t, channelID.Hex(), payload.Data["channelId"])
	assert.Contains(t, payload.Data["url"], eventID.Hex())
	assert.Equal(t, map[string]string{"severity": "critical", "env": "production"}, payload.Data["tags"])
	assert.Len(t, payload.Actions, 2)
	assert.Equal(t, "view", payload.Actions[0].Action)
	assert.Equal(t, "View Event", payload.Actions[0].Title)
}

func TestBuildNotificationPayload_LongTitle(t *testing.T) {
	mockPush := new(mocks.MockPushService)
	mockProject := new(mocks.MockProjectService)
	mockChannel := new(mocks.MockChannelService)

	service := NewNotificationService(mockPush, mockProject, mockChannel)

	project := &model.Project{
		ID:     primitive.NewObjectID(),
		Name:   "My Really Long Project Name That Should Be Truncated",
		UserID: primitive.NewObjectID(),
	}

	channel := &model.Channel{
		ID:        primitive.NewObjectID(),
		ProjectID: project.ID,
		Name:      "errors",
	}

	event := &model.Event{
		ID:          primitive.NewObjectID(),
		ProjectID:   project.ID,
		ChannelID:   channel.ID,
		Title:       "This is a very long event title that definitely exceeds eighty characters and needs truncation",
		Description: "Description",
	}

	payload := service.buildNotificationPayload(event, project, channel)

	assert.LessOrEqual(t, len(payload.Title), 80)
	assert.Contains(t, payload.Title, "...")
}

func TestBuildNotificationPayload_EmptyDescription(t *testing.T) {
	mockPush := new(mocks.MockPushService)
	mockProject := new(mocks.MockProjectService)
	mockChannel := new(mocks.MockChannelService)

	service := NewNotificationService(mockPush, mockProject, mockChannel)

	project := &model.Project{
		ID:     primitive.NewObjectID(),
		Name:   "Test Project",
		UserID: primitive.NewObjectID(),
	}

	channel := &model.Channel{
		ID:        primitive.NewObjectID(),
		ProjectID: project.ID,
		Name:      "updates",
	}

	event := &model.Event{
		ID:          primitive.NewObjectID(),
		ProjectID:   project.ID,
		ChannelID:   channel.ID,
		Title:       "Update",
		Description: "",
	}

	payload := service.buildNotificationPayload(event, project, channel)

	assert.Equal(t, "New event in updates", payload.Body)
}

func TestSendTestNotification(t *testing.T) {
	ctx := context.Background()
	mockPush := new(mocks.MockPushService)
	mockProject := new(mocks.MockProjectService)
	mockChannel := new(mocks.MockChannelService)

	userID := primitive.NewObjectID().Hex()

	mockPush.On("SendToUser", ctx, userID, mock.Anything, "").Return(nil)

	service := NewNotificationService(mockPush, mockProject, mockChannel)
	err := service.SendTestNotification(ctx, userID)

	assert.NoError(t, err)
	mockPush.AssertExpectations(t)
}
