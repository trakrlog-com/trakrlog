package projects

import (
	"github.com/gin-gonic/gin"
	"trakrlog.com/go-backend/config"
)

type Handler struct {
	cfg *config.Config
}

func NewHandler(cfg *config.Config) *Handler {
	return &Handler{cfg: cfg}
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
