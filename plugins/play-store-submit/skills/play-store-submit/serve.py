# Usage: python3 -I serve.py /path/to/app.aab   (run in background; stop after upload)
# Serves the file on http://127.0.0.1:8765/<anything> with CORS + Private Network Access headers.
import http.server, sys, os
FILE = sys.argv[1]
class H(http.server.BaseHTTPRequestHandler):
    def cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
        self.send_header('Access-Control-Allow-Headers', '*')
    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()
    def do_GET(self):
        data = open(FILE, 'rb').read()
        self.send_response(200); self.cors()
        self.send_header('Content-Type', 'application/octet-stream')
        self.send_header('Content-Length', str(len(data))); self.end_headers()
        self.wfile.write(data)
http.server.ThreadingHTTPServer(('127.0.0.1', 8765), H).serve_forever()
