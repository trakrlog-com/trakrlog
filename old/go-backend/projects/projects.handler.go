package projects

import (
	"github.com/gin-gonic/gin"
	"trakrlog.com/go-backend/handlers"
)

type Handler struct {
	appHandler *handlers.AppHandler
}

func NewHandler(appHandler *handlers.AppHandler) *Handler {
	return &Handler{appHandler: appHandler}
}

func (h *Handler) GetProjects(ctx *gin.Context) {
	// return test data
	projects := []gin.H{
		{"id": 1, "name": "Project Alpha", "description": "First project"},
		{"id": 2, "name": "Project Beta", "description": "Second project"},
	}

	ctx.JSON(200, gin.H{
		"success":  true,
		"projects": projects,
	})
}

func (h *Handler) CreateProject(ctx *gin.Context) {

}

func (h *Handler) UpdateProject(ctx *gin.Context) {

}

func (h *Handler) DeleteProject(ctx *gin.Context) {

}

func (h *Handler) GetProjectByID(ctx *gin.Context) {

}
