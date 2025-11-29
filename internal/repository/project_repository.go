package repository

import (
	"context"
	"time"

	"trakrlog/internal/database"
	"trakrlog/internal/model"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type projectRepository struct {
	collection *mongo.Collection
}

// NewProjectRepository creates a new project repository instance
func NewProjectRepository(dbService database.Service) ProjectRepository {
	return &projectRepository{
		collection: dbService.GetCollection("projects"),
	}
}

func (r *projectRepository) Create(ctx context.Context, project *model.Project) error {
	project.CreatedAt = time.Now()
	project.UpdatedAt = time.Now()

	result, err := r.collection.InsertOne(ctx, project)
	if err != nil {
		return err
	}

	project.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *projectRepository) FindByID(ctx context.Context, id string) (*model.Project, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var project model.Project
	err = r.collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&project)
	if err != nil {
		return nil, err
	}

	return &project, nil
}

func (r *projectRepository) FindByUserID(ctx context.Context, userID string) ([]*model.Project, error) {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	cursor, err := r.collection.Find(ctx, bson.M{"user_id": objectID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var projects []*model.Project
	if err = cursor.All(ctx, &projects); err != nil {
		return nil, err
	}

	return projects, nil
}

func (r *projectRepository) Update(ctx context.Context, project *model.Project) error {
	project.UpdatedAt = time.Now()

	update := bson.M{
		"$set": bson.M{
			"name":        project.Name,
			"logo_base64": project.LogoBase64,
			"updated_at":  project.UpdatedAt,
		},
	}

	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": project.ID}, update)
	return err
}

func (r *projectRepository) Delete(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	_, err = r.collection.DeleteOne(ctx, bson.M{"_id": objectID})
	return err
}
