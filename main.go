package main

import (
	"github.com/gin-gonic/gin"
	"io/fs"
	"net/http"
	"resolver_explorer/handler"
	"resolver_explorer/handler/api"
	"resolver_explorer/static"
)

func main() {
	r := gin.Default()
	r.POST("/api/trace/:txId", api.GetTrace)
	r.POST("/api/tx", api.GetTx)
	r.GET("/api/rpc", api.GetRpc)
	r.GET("/", static.IndexHandler)
	r.GET("/block.html", static.BlockHandler)
	r.GET("/tx.html", static.TxHandler)
	r.GET("/search", handler.SearchHandler)
	subDir, _ := fs.Sub(static.EmbedFs, "script")
	r.StaticFS("/script", http.FS(subDir))
	panic(r.Run("0.0.0.0:80"))
}
