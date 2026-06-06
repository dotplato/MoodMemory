const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export function extensionCorsHeaders() {
  return corsHeaders
}

export function withCors(response: Response) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

export function corsOptionsResponse() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
}
