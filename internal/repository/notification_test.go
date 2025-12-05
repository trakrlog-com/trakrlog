package repository

import (
	"context"
	"log"
	"os"
	"testing"
	"time"

	"trakrlog/internal/database"
	"trakrlog/internal/model"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go/modules/mongodb"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var testMongoURL string

func TestMain(m *testing.M) {
	// Skip tests if running in environment without Docker access
	if os.Getenv("SKIP_DOCKER_TESTS") != "" {
		log.Println("Skipping repository tests (SKIP_DOCKER_TESTS is set)")
		os.Exit(0)
	}

	ctx := context.Background()

	// Start MongoDB container
	dbContainer, err := mongodb.Run(ctx, "mongo:7")
	if err != nil {
		log.Fatalf("could not start mongodb container: %v", err)
	}

	dbHost, err := dbContainer.Host(ctx)
	if err != nil {
		log.Fatalf("could not get container host: %v", err)
	}

	dbPort, err := dbContainer.MappedPort(ctx, "27017/tcp")
	if err != nil {
		log.Fatalf("could not get container port: %v", err)
	}

	testMongoURL = "mongodb://" + dbHost + ":" + dbPort.Port()

	// Run tests
	exitCode := m.Run()

	// Cleanup
	if err := dbContainer.Terminate(ctx); err != nil {
		log.Fatalf("could not terminate mongodb container: %v", err)
	}

	os.Exit(exitCode)
}

// testDBService wraps a mongo.Database to implement database.Service for testing
type testDBService struct {
	db *mongo.Database
}

func (t *testDBService) Health() map[string]string {
	return map[string]string{"message": "healthy"}
}

func (t *testDBService) GetDB() *mongo.Database {
	return t.db
}

func (t *testDBService) GetCollection(name string) *mongo.Collection {
	return t.db.Collection(name)
}

// Helper function to setup test database
func setupTestDB(t *testing.T) database.Service {
	ctx := context.Background()

	// Connect to test MongoDB instance using testcontainer URL
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(testMongoURL))
	require.NoError(t, err)

	// Use a test database with unique name
	db := client.Database("trakrlog_test_" + primitive.NewObjectID().Hex())

	// Clean up function
	t.Cleanup(func() {
		err := db.Drop(ctx)
		assert.NoError(t, err)
		err = client.Disconnect(ctx)
		assert.NoError(t, err)
	})

	return &testDBService{db: db}
}

func TestNotificationSubscriptionRepository_Create(t *testing.T) {
	db := setupTestDB(t)
	repo := NewNotificationSubscriptionRepository(db)
	ctx := context.Background()

	subscription := &model.NotificationSubscription{
		UserID:    primitive.NewObjectID(),
		Endpoint:  "https://fcm.googleapis.com/fcm/send/test123",
		P256dh:    "test-p256dh-key",
		Auth:      "test-auth-key",
		UserAgent: "Mozilla/5.0",
		Enabled:   true,
	}

	err := repo.Create(ctx, subscription)
	require.NoError(t, err)
	assert.NotEqual(t, primitive.NilObjectID, subscription.ID)
	assert.False(t, subscription.CreatedAt.IsZero())
	assert.False(t, subscription.UpdatedAt.IsZero())
}

func TestNotificationSubscriptionRepository_FindByID(t *testing.T) {
	db := setupTestDB(t)
	repo := NewNotificationSubscriptionRepository(db)
	ctx := context.Background()

	// Create a subscription
	subscription := &model.NotificationSubscription{
		UserID:    primitive.NewObjectID(),
		Endpoint:  "https://fcm.googleapis.com/fcm/send/test123",
		P256dh:    "test-p256dh-key",
		Auth:      "test-auth-key",
		UserAgent: "Mozilla/5.0",
		Enabled:   true,
	}
	err := repo.Create(ctx, subscription)
	require.NoError(t, err)

	// Find by ID
	found, err := repo.FindByID(ctx, subscription.ID.Hex())
	require.NoError(t, err)
	assert.Equal(t, subscription.ID, found.ID)
	assert.Equal(t, subscription.Endpoint, found.Endpoint)
}

func TestNotificationSubscriptionRepository_FindByID_NotFound(t *testing.T) {
	db := setupTestDB(t)
	repo := NewNotificationSubscriptionRepository(db)
	ctx := context.Background()

	_, err := repo.FindByID(ctx, primitive.NewObjectID().Hex())
	assert.Error(t, err)
	assert.Equal(t, mongo.ErrNoDocuments, err)
}

func TestNotificationSubscriptionRepository_FindByUserID(t *testing.T) {
	db := setupTestDB(t)
	repo := NewNotificationSubscriptionRepository(db)
	ctx := context.Background()

	userID := primitive.NewObjectID()

	// Create multiple subscriptions for the same user
	subscription1 := &model.NotificationSubscription{
		UserID:    userID,
		Endpoint:  "https://fcm.googleapis.com/fcm/send/test1",
		P256dh:    "test-p256dh-key-1",
		Auth:      "test-auth-key-1",
		UserAgent: "Mozilla/5.0",
		Enabled:   true,
	}
	subscription2 := &model.NotificationSubscription{
		UserID:    userID,
		Endpoint:  "https://fcm.googleapis.com/fcm/send/test2",
		P256dh:    "test-p256dh-key-2",
		Auth:      "test-auth-key-2",
		UserAgent: "Chrome/91.0",
		Enabled:   false,
	}

	err := repo.Create(ctx, subscription1)
	require.NoError(t, err)
	err = repo.Create(ctx, subscription2)
	require.NoError(t, err)

	// Find all subscriptions for user
	subscriptions, err := repo.FindByUserID(ctx, userID.Hex())
	require.NoError(t, err)
	assert.Len(t, subscriptions, 2)
}

func TestNotificationSubscriptionRepository_Update(t *testing.T) {
	db := setupTestDB(t)
	repo := NewNotificationSubscriptionRepository(db)
	ctx := context.Background()

	subscription := &model.NotificationSubscription{
		UserID:    primitive.NewObjectID(),
		Endpoint:  "https://fcm.googleapis.com/fcm/send/test123",
		P256dh:    "test-p256dh-key",
		Auth:      "test-auth-key",
		UserAgent: "Mozilla/5.0",
		Enabled:   true,
	}
	err := repo.Create(ctx, subscription)
	require.NoError(t, err)

	// Update subscription
	oldUpdatedAt := subscription.UpdatedAt
	time.Sleep(10 * time.Millisecond) // Ensure timestamp difference
	subscription.Enabled = false
	err = repo.Update(ctx, subscription)
	require.NoError(t, err)

	// Verify update
	found, err := repo.FindByID(ctx, subscription.ID.Hex())
	require.NoError(t, err)
	assert.False(t, found.Enabled)
	assert.True(t, found.UpdatedAt.After(oldUpdatedAt))
}

func TestNotificationSubscriptionRepository_Delete(t *testing.T) {
	db := setupTestDB(t)
	repo := NewNotificationSubscriptionRepository(db)
	ctx := context.Background()

	subscription := &model.NotificationSubscription{
		UserID:    primitive.NewObjectID(),
		Endpoint:  "https://fcm.googleapis.com/fcm/send/test123",
		P256dh:    "test-p256dh-key",
		Auth:      "test-auth-key",
		UserAgent: "Mozilla/5.0",
		Enabled:   true,
	}
	err := repo.Create(ctx, subscription)
	require.NoError(t, err)

	// Delete subscription
	err = repo.Delete(ctx, subscription.ID.Hex())
	require.NoError(t, err)

	// Verify deletion
	_, err = repo.FindByID(ctx, subscription.ID.Hex())
	assert.Error(t, err)
	assert.Equal(t, mongo.ErrNoDocuments, err)
}

func TestNotificationSubscriptionRepository_FindActiveByUserID(t *testing.T) {
	db := setupTestDB(t)
	repo := NewNotificationSubscriptionRepository(db)
	ctx := context.Background()

	userID := primitive.NewObjectID()

	// Create active and inactive subscriptions
	activeSubscription := &model.NotificationSubscription{
		UserID:    userID,
		Endpoint:  "https://fcm.googleapis.com/fcm/send/active",
		P256dh:    "test-p256dh-key-1",
		Auth:      "test-auth-key-1",
		UserAgent: "Mozilla/5.0",
		Enabled:   true,
	}
	inactiveSubscription := &model.NotificationSubscription{
		UserID:    userID,
		Endpoint:  "https://fcm.googleapis.com/fcm/send/inactive",
		P256dh:    "test-p256dh-key-2",
		Auth:      "test-auth-key-2",
		UserAgent: "Chrome/91.0",
		Enabled:   false,
	}

	err := repo.Create(ctx, activeSubscription)
	require.NoError(t, err)
	err = repo.Create(ctx, inactiveSubscription)
	require.NoError(t, err)

	// Find only active subscriptions
	subscriptions, err := repo.FindActiveByUserID(ctx, userID.Hex())
	require.NoError(t, err)
	assert.Len(t, subscriptions, 1)
	assert.True(t, subscriptions[0].Enabled)
	assert.Equal(t, "https://fcm.googleapis.com/fcm/send/active", subscriptions[0].Endpoint)
}

func TestNotificationLogRepository_Create(t *testing.T) {
	db := setupTestDB(t)
	repo := NewNotificationLogRepository(db)
	ctx := context.Background()

	log := &model.NotificationLog{
		UserID:         primitive.NewObjectID(),
		EventID:        primitive.NewObjectID(),
		SubscriptionID: primitive.NewObjectID(),
		Status:         "sent",
	}

	err := repo.Create(ctx, log)
	require.NoError(t, err)
	assert.NotEqual(t, primitive.NilObjectID, log.ID)
	assert.False(t, log.SentAt.IsZero())
}

func TestNotificationLogRepository_FindByUserID(t *testing.T) {
	db := setupTestDB(t)
	repo := NewNotificationLogRepository(db)
	ctx := context.Background()

	userID := primitive.NewObjectID()

	// Create multiple logs
	for i := 0; i < 5; i++ {
		log := &model.NotificationLog{
			UserID:         userID,
			EventID:        primitive.NewObjectID(),
			SubscriptionID: primitive.NewObjectID(),
			Status:         "sent",
		}
		err := repo.Create(ctx, log)
		require.NoError(t, err)
		time.Sleep(10 * time.Millisecond) // Ensure different timestamps
	}

	// Find logs with pagination
	logs, err := repo.FindByUserID(ctx, userID.Hex(), 3, 0)
	require.NoError(t, err)
	assert.Len(t, logs, 3)

	// Verify sorting (newest first)
	for i := 0; i < len(logs)-1; i++ {
		assert.True(t, logs[i].SentAt.After(logs[i+1].SentAt) || logs[i].SentAt.Equal(logs[i+1].SentAt))
	}
}

func TestNotificationLogRepository_FindByEventID(t *testing.T) {
	db := setupTestDB(t)
	repo := NewNotificationLogRepository(db)
	ctx := context.Background()

	eventID := primitive.NewObjectID()

	// Create logs for the same event
	log1 := &model.NotificationLog{
		UserID:         primitive.NewObjectID(),
		EventID:        eventID,
		SubscriptionID: primitive.NewObjectID(),
		Status:         "sent",
	}
	log2 := &model.NotificationLog{
		UserID:         primitive.NewObjectID(),
		EventID:        eventID,
		SubscriptionID: primitive.NewObjectID(),
		Status:         "failed",
		Error:          "subscription expired",
	}

	err := repo.Create(ctx, log1)
	require.NoError(t, err)
	err = repo.Create(ctx, log2)
	require.NoError(t, err)

	// Find logs by event ID
	logs, err := repo.FindByEventID(ctx, eventID.Hex())
	require.NoError(t, err)
	assert.Len(t, logs, 2)
}
