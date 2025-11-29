package repository

import (
	"context"
	"time"

	"trakrlog/internal/database"
	"trakrlog/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type channelRepository struct {
	collection *mongo.Collection
}

// NewChannelRepository creates a new channel repository instance
func NewChannelRepository(dbService database.Service) ChannelRepository {
	return &channelRepository{
		collection: dbService.GetCollection("channels"),
	}
}

func (r *channelRepository) Create(ctx context.Context, channel *models.Channel) error {
	channel.CreatedAt = time.Now()
	channel.UpdatedAt = time.Now()

	result, err := r.collection.InsertOne(ctx, channel)
	if err != nil {
		return err
	}

	channel.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *channelRepository) FindByID(ctx context.Context, id string) (*models.Channel, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var channel models.Channel
	err = r.collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&channel)
	if err != nil {
		return nil, err
	}

	return &channel, nil
}

func (r *channelRepository) FindByProjectID(ctx context.Context, projectID string) ([]*models.Channel, error) {
	objectID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		return nil, err
	}

	cursor, err := r.collection.Find(ctx, bson.M{"project_id": objectID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var channels []*models.Channel
	if err = cursor.All(ctx, &channels); err != nil {
		return nil, err
	}

	return channels, nil
}

func (r *channelRepository) Update(ctx context.Context, channel *models.Channel) error {
	channel.UpdatedAt = time.Now()

	update := bson.M{
		"$set": bson.M{
			"name":       channel.Name,
			"updated_at": channel.UpdatedAt,
		},
	}

	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": channel.ID}, update)
	return err
}

func (r *channelRepository) Delete(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	_, err = r.collection.DeleteOne(ctx, bson.M{"_id": objectID})
	return err
}
