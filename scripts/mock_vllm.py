#!/usr/bin/env python3
"""Mock OpenAI-compatible server: simulates the external vLLM project API.

Run on host port 8931, then start the dashboard with:
  -e VLLM_API_URL=http://host.containers.internal:8931
  -e VLLM_MODEL=llama-3-8b-instruct

Scripted behavior (for GenUI/chat E2E gates):
- GET  /v1/models            -> 2 fake models
- POST /v1/chat/completions  -> decides by message content:
    * ui/generate path (system prompt contains "generative UI engine")
        -> returns a JSON widget schema
    * last user message contains "TOOL_RESULT" -> final assistant text
    * last user message mentions "llama"      -> TOOL_CALL propose_topology_patch
    * otherwise                                -> TOOL_CALL get_topology
"""
import json
from http.server import BaseHTTPRequestHandler, HTTPServer


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _json(self, code, payload):
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header('content-type', 'application/json')
        self.send_header('content-length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == '/v1/models':
            self._json(200, {"object": "list", "data": [
                {"id": "llama-3-8b-instruct", "object": "model", "owned_by": "vllm-project"},
                {"id": "bge-m3-embeddings", "object": "model", "owned_by": "vllm-project"},
            ]})
        elif self.path == '/health':
            self._json(200, {"status": "ok"})
        else:
            self._json(404, {"error": "not found"})

    def do_POST(self):
        if self.path != '/v1/chat/completions':
            self._json(404, {"error": "not found"})
            return
        length = int(self.headers.get('content-length', 0))
        req = json.loads(self.rfile.read(length))
        messages = req.get('messages', [])
        system = next((m['content'] for m in messages if m['role'] == 'system'), '')
        last_user = next((m['content'] for m in reversed(messages) if m['role'] == 'user'), '')

        if 'generative UI engine' in system:
            content = json.dumps({"version": "1", "title": "GENERATED: System Overview", "widgets": [
                {"type": "status-card", "title": "Plugins", "value": "1", "status": "ok", "trend": "up"},
                {"type": "table", "title": "Loaded models", "columns": [{"key": "model", "label": "Model"}],
                 "rows": [{"model": "llama-3-8b-instruct"}, {"model": "bge-m3-embeddings"}]},
            ]})
        elif 'TOOL_RESULT' in last_user:
            content = ("Done. Patch proposed and shown for human confirmation. The new node renders "
                       "dashed magenta on the canvas until you approve it — HITL enforced.")
        elif 'llama' in last_user.lower():
            content = ('TOOL_CALL {"name":"propose_topology_patch","args":{"summary":"Spin up isolated '
                       'Llama 3 for data analysis (internal-only network)","nodes":[{"id":"service:llama3",'
                       '"label":"Llama 3 (no-web)","kind":"service"}],"edges":[{"source":"service:llama3",'
                       '"target":"agy-dashboard","label":"serves"}]}}')
        else:
            content = 'TOOL_CALL {"name":"get_topology","args":{}}'

        self._json(200, {"id": "mock", "object": "chat.completion", "choices": [
            {"index": 0, "message": {"role": "assistant", "content": content}, "finish_reason": "stop"}
        ]})


if __name__ == '__main__':
    print("mock vLLM listening on 0.0.0.0:8931")
    HTTPServer(('0.0.0.0', 8931), Handler).serve_forever()
