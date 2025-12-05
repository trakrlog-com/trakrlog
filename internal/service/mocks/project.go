package mocks

import (
	"context"

	"github.com/stretchr/testify/mock"
	"trakrlog/internal/model"
)

// MockProjectService is a mock implementation of ProjectServiceInterface
type MockProjectService struct {
	mock.Mock
}

func (m *MockProjectService) GetProjectByID(ctx context.Context, id string) (*model.Project, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Project), args.Error(1)
}
