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

type eventRepository struct {
	collection *mongo.Collection
}

// NewEventRepository creates a new event repository instance
func NewEventRepository(dbService database.Service) EventRepository {
	return &eventRepository{
		collection: dbService.GetCollection("events"),
	}
}

func (r *eventRepository) Create(ctx context.Context, event *model.Event) error {
	event.CreatedAt = time.Now()

	result, err := r.collection.InsertOne(ctx, event)
	if err != nil {
		return err
	}

	event.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *eventRepository) FindByID(ctx context.Context, id string) (*model.Event, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var event model.Event
	err = r.collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&event)
	if err != nil {
		return nil, err
	}

	return &event, nil
}

func (r *eventRepository) FindByChannelID(ctx context.Context, channelID string, limit, offset int64) ([]*model.Event, error) {
	objectID, err := primitive.ObjectIDFromHex(channelID)
	if err != nil {
		return nil, err
	}

	opts := options.Find().
		SetLimit(limit).
		SetSkip(offset).
		SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := r.collection.Find(ctx, bson.M{"channel_id": objectID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var events []*model.Event
	if err = cursor.All(ctx, &events); err != nil {
		return nil, err
	}

	return events, nil
}

func (r *eventRepository) FindByProjectID(ctx context.Context, projectID string, limit, offset int64) ([]*model.Event, error) {
	objectID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		return nil, err
	}

	opts := options.Find().
		SetLimit(limit).
		SetSkip(offset).
		SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := r.collection.Find(ctx, bson.M{"project_id": objectID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var events []*model.Event
	if err = cursor.All(ctx, &events); err != nil {
		return nil, err
	}

	return events, nil
}

func (r *eventRepository) Update(ctx context.Context, event *model.Event) error {
	update := bson.M{
		"$set": bson.M{
			"title":       event.Title,
			"description": event.Description,
			"icon":        event.Icon,
			"tags":        event.Tags,
		},
	}

	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": event.ID}, update)
	return err
}

func (r *eventRepository) Delete(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	_, err = r.collection.DeleteOne(ctx, bson.M{"_id": objectID})
	return err
}
