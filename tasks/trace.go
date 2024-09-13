package tasks

import (
	"resolver_explorer/service/cast"
	"resolver_explorer/service/db"
	"resolver_explorer/utils/hx"
)

func TraceJob(rpc, txId string) {
	// Call cast
	db.Set(db.GetDb(), []byte("trace"+txId), []byte("1"))
	call := cast.RunCall(rpc, txId)
	doc := hx.HandleTerminalEscape(call)
	// Save call to db
	db.Set(db.GetDb(), []byte("trace"+txId), []byte(doc))
	// Send result to user
}

func TraceForkedJob(port, txId string) {
	// Call cast
	db.Set(db.GetDb(), []byte("fork_trace"+port+txId), []byte("1"))
	rpc := "http://localhost:" + port
	call := cast.RunCall(rpc, txId)
	doc := hx.HandleTerminalEscape(call)
	// Save call to db
	db.Set(db.GetDb(), []byte("fork_trace"+port+txId), []byte(doc))
}
