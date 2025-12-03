package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type APIKey struct {
	Key       string    `bson:"key" json:"key"`
	Name      string    `bson:"name" json:"name"`
	CreatedAt time.Time `bson:"created_at" json:"createdAt"`
	LastUsed  time.Time `bson:"last_used,omitempty" json:"lastUsed,omitempty"`
}

type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Email     string             `bson:"email" json:"email"`
	Name      string             `bson:"name" json:"name"`
	Avatar    string             `bson:"avatar,omitempty" json:"avatar,omitempty"`
	APIKeys   []APIKey           `bson:"api_keys,omitempty" json:"apiKeys,omitempty"`
	CreatedAt time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updatedAt"`
}
