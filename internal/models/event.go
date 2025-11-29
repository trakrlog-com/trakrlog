package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Event struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ChannelID   primitive.ObjectID `bson:"channel_id" json:"channelId"`
	ProjectID   primitive.ObjectID `bson:"project_id" json:"projectId"`
	Title       string             `bson:"title" json:"title"`
	Description string             `bson:"description,omitempty" json:"description,omitempty"`
	Icon        string             `bson:"icon,omitempty" json:"icon,omitempty"`
	Tags        []string           `bson:"tags,omitempty" json:"tags,omitempty"`
	CreatedAt   time.Time          `bson:"created_at" json:"createdAt"`
}
