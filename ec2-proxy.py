#!/usr/bin/env python3
"""
Simple proxy server to forward requests to internal services
Run this on EC2 to expose internal services on port 80
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import urllib.parse
import json
import sys

class ProxyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.handle_request()
    
    def do_POST(self):
        self.handle_request()
    
    def handle_request(self):
        try:
            # Parse the path to determine target service
            path = self.path
            
            if path.startswith('/auth/'):
                target_port = 8001
                target_path = path.replace('/auth', '')
            elif path.startswith('/messages') or path.startswith('/chat-requests'):
                target_port = 8002
                target_path = path
            elif path.startswith('/ws'):
                target_port = 8003
                target_path = path
            else:
                self.send_error(404, "Service not found")
                return
            
            # Build target URL
            target_url = f"http://localhost:{target_port}{target_path}"
            
            # Prepare request
            headers = {}
            for header, value in self.headers.items():
                if header.lower() not in ['host', 'content-length']:
                    headers[header] = value
            
            # Get request body for POST
            body = None
            if self.command == 'POST':
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length > 0:
                    body = self.rfile.read(content_length)
            
            # Make request to internal service
            req = urllib.request.Request(target_url, data=body, headers=headers, method=self.command)
            
            with urllib.request.urlopen(req, timeout=10) as response:
                # Send response
                self.send_response(response.status)
                for header, value in response.headers.items():
                    if header.lower() not in ['server', 'date']:
                        self.send_header(header, value)
                self.end_headers()
                
                # Send body
                self.wfile.write(response.read())
                
        except Exception as e:
            print(f"Proxy error: {e}")
            self.send_error(500, f"Proxy error: {str(e)}")

if __name__ == '__main__':
    port = 8080
    server = HTTPServer(('0.0.0.0', port), ProxyHandler)
    print(f"Proxy server running on port {port}")
    server.serve_forever()