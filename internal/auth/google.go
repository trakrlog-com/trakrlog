package auth

import (
	"net/http"

	"trakrlog/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/markbates/goth/gothic"
)

type GoogleHandler struct {
	sessionSecret string
	userService   *service.UserService
}

func NewGoogleHandler(sessionSecret string, userService *service.UserService) *GoogleHandler {
	return &GoogleHandler{
		sessionSecret: sessionSecret,
		userService:   userService,
	}
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

	// Find or create user in database
	dbUser, err := h.userService.GetUserByEmail(ctx.Request.Context(), user.Email)
	if err != nil {
		// User doesn't exist, create new user
		dbUser, err = h.userService.CreateUser(ctx.Request.Context(), user.Email, user.Name)
		if err != nil {
			ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Error creating user",
				"error":   err.Error(),
			})
			return
		}
	}

	// Update avatar if changed
	if dbUser.Avatar != user.AvatarURL {
		dbUser.Avatar = user.AvatarURL
		if err := h.userService.UpdateUser(ctx.Request.Context(), dbUser); err != nil {
			// Log error but don't fail the login
		}
	}

	// Store user ID in session (not the whole user object)
	session.Values["user_id"] = dbUser.ID.Hex()
	session.Values["user_email"] = dbUser.Email

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

	// Get user ID from session
	userID, ok := session.Values["user_id"].(string)
	if !ok || userID == "" {
		ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "No authenticated user found",
		})
		return
	}

	// Fetch user from database
	user, err := h.userService.GetUserByID(ctx.Request.Context(), userID)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not found",
			"error":   err.Error(),
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
