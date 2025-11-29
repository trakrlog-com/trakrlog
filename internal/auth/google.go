package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/markbates/goth/gothic"
)

type GoogleHandler struct {
	sessionSecret string
}

func NewGoogleHandler(sessionSecret string) *GoogleHandler {
	return &GoogleHandler{sessionSecret: sessionSecret}
}

func (h *GoogleHandler) Signup(ctx *gin.Context) {
	query := ctx.Request.URL.Query()
	query.Add("provider", "google")
	ctx.Request.URL.RawQuery = query.Encode()

	gothic.BeginAuthHandler(ctx.Writer, ctx.Request)
}

func (h *GoogleHandler) HandleCallback(ctx *gin.Context) {
	query := ctx.Request.URL.Query()
	query.Add("provider", "google")
	ctx.Request.URL.RawQuery = query.Encode()

	user, err := gothic.CompleteUserAuth(ctx.Writer, ctx.Request)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Error authenticating user",
			"error":   err.Error(),
		})
		return
	}

	// store the user session
	session, err := gothic.Store.New(ctx.Request, h.sessionSecret)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Error stroing user session",
			"error":   err.Error(),
		})
		return
	}

	// your logic for storing the user in database goes here
	// TODO

	session.Values["user"] = user

	// save the user session
	if err = session.Save(ctx.Request, ctx.Writer); err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Error saving user session",
			"error":   err.Error(),
		})
		return
	}

	ctx.Redirect(http.StatusTemporaryRedirect, "/dashboard")
}

func (h *GoogleHandler) GetAuthUser(ctx *gin.Context) {
	// Retrieve the session
	session, err := gothic.Store.Get(ctx.Request, h.sessionSecret)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Error retrieving user session",
			"error":   err.Error(),
		})
		return
	}

	// Get user data from session
	user := session.Values["user"]
	if user == nil {
		ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "No authenticated user found",
		})
		return
	}

	// Return user info
	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "User fetched successfully",
		"data":    user,
	})
}

func (h *GoogleHandler) HandleUnauthorized(ctx *gin.Context) {
	ctx.JSON(http.StatusUnauthorized, gin.H{
		"success": false,
		"message": "Unauthorized access",
	})

	// redirect to /unauthorized
	ctx.Redirect(http.StatusTemporaryRedirect, "/unauthorized")
}
