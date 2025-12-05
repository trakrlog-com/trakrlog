package auth

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"math/big"
)

// VapidKeys represents a VAPID public/private key pair
type VapidKeys struct {
	PublicKey  string
	PrivateKey string
}

// GenerateVAPIDKeys generates a new VAPID key pair for Web Push notifications
// This should be run once during initial setup and the keys stored securely
func GenerateVAPIDKeys() (*VapidKeys, error) {
	// Generate P-256 elliptic curve private key
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return nil, fmt.Errorf("failed to generate private key: %w", err)
	}

	// Encode private key to base64 URL-safe format
	privateKeyBytes := privateKey.D.Bytes()
	// Ensure the key is 32 bytes (pad with zeros if needed)
	if len(privateKeyBytes) < 32 {
		paddedKey := make([]byte, 32)
		copy(paddedKey[32-len(privateKeyBytes):], privateKeyBytes)
		privateKeyBytes = paddedKey
	}
	privateKeyEncoded := base64.RawURLEncoding.EncodeToString(privateKeyBytes)

	// Encode public key to base64 URL-safe format (uncompressed format)
	// First byte is 0x04 (indicating uncompressed point), followed by X and Y coordinates
	publicKeyBytes := make([]byte, 65)
	publicKeyBytes[0] = 0x04
	
	xBytes := privateKey.PublicKey.X.Bytes()
	yBytes := privateKey.PublicKey.Y.Bytes()
	
	// Ensure X and Y are 32 bytes each (pad with zeros if needed)
	copy(publicKeyBytes[1+32-len(xBytes):33], xBytes)
	copy(publicKeyBytes[33+32-len(yBytes):65], yBytes)
	
	publicKeyEncoded := base64.RawURLEncoding.EncodeToString(publicKeyBytes)

	return &VapidKeys{
		PublicKey:  publicKeyEncoded,
		PrivateKey: privateKeyEncoded,
	}, nil
}

// ParseVAPIDPrivateKey parses a base64-encoded VAPID private key into an ECDSA private key
func ParseVAPIDPrivateKey(encodedKey string) (*ecdsa.PrivateKey, error) {
	// Decode the base64 URL-safe encoded private key
	privateKeyBytes, err := base64.RawURLEncoding.DecodeString(encodedKey)
	if err != nil {
		return nil, fmt.Errorf("failed to decode private key: %w", err)
	}

	// Convert bytes to big.Int
	d := new(big.Int).SetBytes(privateKeyBytes)

	// Create the private key
	privateKey := new(ecdsa.PrivateKey)
	privateKey.PublicKey.Curve = elliptic.P256()
	privateKey.D = d

	// Calculate the public key from the private key
	privateKey.PublicKey.X, privateKey.PublicKey.Y = privateKey.PublicKey.Curve.ScalarBaseMult(d.Bytes())

	return privateKey, nil
}
