package main

import (
	"github.com/gin-gonic/gin"
	"io/fs"
	"net/http"
	"resolver_explorer/handler"
	"resolver_explorer/handler/api"
	"resolver_explorer/service/indexer"
	"resolver_explorer/static"
)

func main() {
	r := gin.Default()
	go indexer.InitIndexer()
	r.POST("/api/trace/:txId", api.GetTrace)
	r.POST("/api/tx", api.GetTx)
	r.GET("/api/rpc", api.GetRpc)
	r.GET("/api/txs/:address", api.GetTxs)
	r.GET("/api/tokens/:address", api.GetTokens)
	r.POST("/api/tokens/add", api.AddDisplayToken)
	r.GET("/api/tokens/list", api.GetDisplayToken)
	r.GET("/", static.IndexHandler)
	r.GET("/block.html", static.BlockHandler)
	r.GET("/tx.html", static.TxHandler)
	r.GET("/account.html", static.AccountHandler)
	r.GET("/search", handler.SearchHandler)
	subDir, _ := fs.Sub(static.EmbedFs, "script")
	r.StaticFS("/script", http.FS(subDir))
	panic(r.Run("0.0.0.0:80"))
}
