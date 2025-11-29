package handler

import (
	"net/http"

	"trakrlog/internal/middleware"
	"trakrlog/internal/model"
	"trakrlog/internal/service"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ProjectHandler struct {
	projectService *service.ProjectService
}

func NewProjectHandler(projectService *service.ProjectService) *ProjectHandler {
	return &ProjectHandler{
		projectService: projectService,
	}
}

// CreateProject handles POST /api/projects
func (h *ProjectHandler) CreateProject(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	var req struct {
		Name       string `json:"name" binding:"required"`
		LogoBase64 string `json:"logoBase64"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request",
			"error":   err.Error(),
		})
		return
	}

	project, err := h.projectService.CreateProject(ctx.Request.Context(), userID, req.Name, req.LogoBase64)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Error creating project",
			"error":   err.Error(),
		})
		return
	}

	// Update logo if provided
	if req.LogoBase64 != "" {
		project.LogoBase64 = req.LogoBase64
		if err := h.projectService.UpdateProject(ctx.Request.Context(), userID, project); err != nil {
			// Log error but don't fail the creation
		}
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Project created successfully",
		"data":    project,
	})
}

// GetProjects handles GET /api/projects
func (h *ProjectHandler) GetProjects(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	projects, err := h.projectService.GetUserProjects(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Error fetching projects",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Projects fetched successfully",
		"data":    projects,
	})
}

// GetProject handles GET /api/projects/:projectId
func (h *ProjectHandler) GetProject(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	projectID := ctx.Param("projectId")
	if projectID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Project ID required",
		})
		return
	}

	project, err := h.projectService.GetProjectByID(ctx.Request.Context(), projectID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Project not found",
			"error":   err.Error(),
		})
		return
	}

	// Verify ownership
	if project.UserID.Hex() != userID {
		ctx.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "Access denied",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Project fetched successfully",
		"data":    project,
	})
}

// UpdateProject handles PATCH /api/projects/:projectId
func (h *ProjectHandler) UpdateProject(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	projectID := ctx.Param("projectId")
	if projectID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Project ID required",
		})
		return
	}

	var req struct {
		Name       string `json:"name"`
		LogoBase64 string `json:"logoBase64"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request",
			"error":   err.Error(),
		})
		return
	}

	objectID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid project ID",
		})
		return
	}

	project := &model.Project{
		ID:         objectID,
		Name:       req.Name,
		LogoBase64: req.LogoBase64,
	}

	if err := h.projectService.UpdateProject(ctx.Request.Context(), userID, project); err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "unauthorized: project does not belong to user" {
			statusCode = http.StatusForbidden
		} else if err.Error() == "project not found" {
			statusCode = http.StatusNotFound
		}

		ctx.JSON(statusCode, gin.H{
			"success": false,
			"message": "Error updating project",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Project updated successfully",
	})
}

// DeleteProject handles DELETE /api/projects/:projectId
func (h *ProjectHandler) DeleteProject(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	projectID := ctx.Param("projectId")
	if projectID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Project ID required",
		})
		return
	}

	if err := h.projectService.DeleteProject(ctx.Request.Context(), userID, projectID); err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "unauthorized: project does not belong to user" {
			statusCode = http.StatusForbidden
		} else if err.Error() == "project not found" {
			statusCode = http.StatusNotFound
		}

		ctx.JSON(statusCode, gin.H{
			"success": false,
			"message": "Error deleting project",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Project deleted successfully",
	})
}
