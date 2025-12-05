package mocks

import (
	"context"

	"trakrlog/internal/model"

	"github.com/stretchr/testify/mock"
)

// MockPushService is a mock implementation of PushServiceInterface
type MockPushService struct {
	mock.Mock
}

func (m *MockPushService) SendToUser(ctx context.Context, userID string, payload *model.NotificationPayload, eventID string) error {
	args := m.Called(ctx, userID, payload, eventID)
	return args.Error(0)
}
