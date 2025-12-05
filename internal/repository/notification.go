package repository

import (
	"context"
	"time"

	"trakrlog/internal/database"
	"trakrlog/internal/model"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// NotificationSubscriptionRepository defines methods for managing notification subscriptions
type NotificationSubscriptionRepository interface {
	Create(ctx context.Context, subscription *model.NotificationSubscription) error
	FindByID(ctx context.Context, id string) (*model.NotificationSubscription, error)
	FindByUserID(ctx context.Context, userID string) ([]*model.NotificationSubscription, error)
	Update(ctx context.Context, subscription *model.NotificationSubscription) error
	Delete(ctx context.Context, id string) error
	FindActiveByUserID(ctx context.Context, userID string) ([]*model.NotificationSubscription, error)
}

// NotificationLogRepository defines methods for managing notification logs
type NotificationLogRepository interface {
	Create(ctx context.Context, log *model.NotificationLog) error
	FindByUserID(ctx context.Context, userID string, limit, offset int64) ([]*model.NotificationLog, error)
	FindByEventID(ctx context.Context, eventID string) ([]*model.NotificationLog, error)
}

type notificationSubscriptionRepository struct {
	collection *mongo.Collection
}

type notificationLogRepository struct {
	collection *mongo.Collection
}

// NewNotificationSubscriptionRepository creates a new notification subscription repository
func NewNotificationSubscriptionRepository(dbService database.Service) NotificationSubscriptionRepository {
	return &notificationSubscriptionRepository{
		collection: dbService.GetCollection("notification_subscriptions"),
	}
}

// NewNotificationLogRepository creates a new notification log repository
func NewNotificationLogRepository(dbService database.Service) NotificationLogRepository {
	return &notificationLogRepository{
		collection: dbService.GetCollection("notification_logs"),
	}
}

// Create creates a new notification subscription
func (r *notificationSubscriptionRepository) Create(ctx context.Context, subscription *model.NotificationSubscription) error {
	subscription.ID = primitive.NewObjectID()
	subscription.CreatedAt = time.Now()
	subscription.UpdatedAt = time.Now()

	_, err := r.collection.InsertOne(ctx, subscription)
	return err
}

// FindByID finds a notification subscription by ID
func (r *notificationSubscriptionRepository) FindByID(ctx context.Context, id string) (*model.NotificationSubscription, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var subscription model.NotificationSubscription
	err = r.collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&subscription)
	if err != nil {
		return nil, err
	}

	return &subscription, nil
}

// FindByUserID finds all notification subscriptions for a user
func (r *notificationSubscriptionRepository) FindByUserID(ctx context.Context, userID string) ([]*model.NotificationSubscription, error) {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	cursor, err := r.collection.Find(ctx, bson.M{"user_id": objectID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var subscriptions []*model.NotificationSubscription
	if err = cursor.All(ctx, &subscriptions); err != nil {
		return nil, err
	}

	return subscriptions, nil
}

// Update updates a notification subscription
func (r *notificationSubscriptionRepository) Update(ctx context.Context, subscription *model.NotificationSubscription) error {
	subscription.UpdatedAt = time.Now()

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"_id": subscription.ID},
		bson.M{"$set": subscription},
	)
	return err
}

// Delete deletes a notification subscription
func (r *notificationSubscriptionRepository) Delete(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	_, err = r.collection.DeleteOne(ctx, bson.M{"_id": objectID})
	return err
}

// FindActiveByUserID finds all active (enabled) notification subscriptions for a user
func (r *notificationSubscriptionRepository) FindActiveByUserID(ctx context.Context, userID string) ([]*model.NotificationSubscription, error) {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	cursor, err := r.collection.Find(ctx, bson.M{
		"user_id": objectID,
		"enabled": true,
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var subscriptions []*model.NotificationSubscription
	if err = cursor.All(ctx, &subscriptions); err != nil {
		return nil, err
	}

	return subscriptions, nil
}

// Create creates a new notification log entry
func (r *notificationLogRepository) Create(ctx context.Context, log *model.NotificationLog) error {
	log.ID = primitive.NewObjectID()
	log.SentAt = time.Now()

	_, err := r.collection.InsertOne(ctx, log)
	return err
}

// FindByUserID finds notification logs for a user with pagination
func (r *notificationLogRepository) FindByUserID(ctx context.Context, userID string, limit, offset int64) ([]*model.NotificationLog, error) {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	cursor, err := r.collection.Find(
		ctx,
		bson.M{"user_id": objectID},
		options.Find().SetLimit(limit).SetSkip(offset).SetSort(bson.D{{Key: "sent_at", Value: -1}}),
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var logs []*model.NotificationLog
	if err = cursor.All(ctx, &logs); err != nil {
		return nil, err
	}

	return logs, nil
}

// FindByEventID finds all notification logs for a specific event
func (r *notificationLogRepository) FindByEventID(ctx context.Context, eventID string) ([]*model.NotificationLog, error) {
	objectID, err := primitive.ObjectIDFromHex(eventID)
	if err != nil {
		return nil, err
	}

	cursor, err := r.collection.Find(ctx, bson.M{"event_id": objectID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var logs []*model.NotificationLog
	if err = cursor.All(ctx, &logs); err != nil {
		return nil, err
	}

	return logs, nil
}
