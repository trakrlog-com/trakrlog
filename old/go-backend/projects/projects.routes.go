package projects

import (
	"github.com/gin-gonic/gin"
	"trakrlog.com/go-backend/handlers"
)

func Routes(route *gin.Engine, appHandler *handlers.AppHandler) {
	var projectsHandler = NewHandler(appHandler)
	projects := route.Group("/projects")
	{
		projects.GET("/", projectsHandler.GetProjects)
		projects.POST("/", projectsHandler.CreateProject)
		projects.PUT("/:projectId", projectsHandler.UpdateProject)
		projects.DELETE("/:projectId", projectsHandler.DeleteProject)
		projects.GET("/:projectId", projectsHandler.GetProjectByID)
	}
}
