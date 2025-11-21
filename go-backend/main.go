package main

import (
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"trakrlog.com/go-backend/auth"
)

func main() {

	var router *gin.Engine = gin.Default()

	router.Use(static.Serve("/", static.LocalFile("../apps/frontend/dist", true)))

	auth.Routes(router)

	router.Run("localhost:4000")

}
