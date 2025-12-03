package auth

import (
	"net/http"

	"trakrlog/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/markbates/goth/gothic"
)

type GitHubHandler struct {
	sessionSecret string
	userService   *service.UserService
}

func NewGitHubHandler(sessionSecret string, userService *service.UserService) *GitHubHandler {
	return &GitHubHandler{
		sessionSecret: sessionSecret,
		userService:   userService,
	}
}

func (h *GitHubHandler) Signup(ctx *gin.Context) {
	query := ctx.Request.URL.Query()
	query.Add("provider", "github")
	ctx.Request.URL.RawQuery = query.Encode()

	gothic.BeginAuthHandler(ctx.Writer, ctx.Request)
}

func (h *GitHubHandler) HandleCallback(ctx *gin.Context) {
	query := ctx.Request.URL.Query()
	query.Add("provider", "github")
	ctx.Request.URL.RawQuery = query.Encode()

	gothUser, err := gothic.CompleteUserAuth(ctx.Writer, ctx.Request)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Error authenticating user",
			"error":   err.Error(),
		})
		return
	}

	// Use AuthenticateWithProvider method
	dbUser, err := h.userService.AuthenticateWithProvider(
		ctx.Request.Context(),
		"github",
		gothUser.UserID,
		gothUser.Email,
		gothUser.Name,
		gothUser.AvatarURL,
		gothUser.AccessToken,
		gothUser.RefreshToken,
	)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Error authenticating with GitHub",
			"error":   err.Error(),
		})
		return
	}

	// Store user session
	session, err := gothic.Store.New(ctx.Request, h.sessionSecret)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Error creating session",
			"error":   err.Error(),
		})
		return
	}

	session.Values["user_id"] = dbUser.ID.Hex()
	session.Values["user_email"] = dbUser.Email

	if err = session.Save(ctx.Request, ctx.Writer); err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Error saving session",
			"error":   err.Error(),
		})
		return
	}

	ctx.Redirect(http.StatusTemporaryRedirect, "/dashboard")
}
