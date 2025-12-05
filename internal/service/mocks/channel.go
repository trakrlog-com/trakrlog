package mocks

import (
	"context"

	"github.com/stretchr/testify/mock"
	"trakrlog/internal/model"
)

// MockChannelService is a mock implementation of ChannelServiceInterface
type MockChannelService struct {
	mock.Mock
}

func (m *MockChannelService) GetChannelByID(ctx context.Context, id string) (*model.Channel, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Channel), args.Error(1)
}