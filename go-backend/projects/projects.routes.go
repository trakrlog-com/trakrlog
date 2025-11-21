package projects

import (
	"github.com/gin-gonic/gin"
	"trakrlog.com/go-backend/container"
)

func Routes(route *gin.Engine) {
	var projectsHandler = NewHandler(container.App.Config)

	projects := route.Group("/projects")
	{
		projects.GET("/", projectsHandler.GetProjects)
		projects.POST("/", projectsHandler.CreateProject)
		projects.PUT("/:projectId", projectsHandler.UpdateProject)
		projects.DELETE("/:projectId", projectsHandler.DeleteProject)
		projects.GET("/:projectId", projectsHandler.GetProjectByID)
	}
}
