package main

import (
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

func main() {

	router := gin.Default()

	router.Use(static.Serve("/", static.LocalFile("../apps/frontend/dist", true)))

	router.Run("localhost:4000")

}
