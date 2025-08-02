/**
 * Analytics API Endpoint
 * 
 * Handles incoming analytics data from the performance monitor
 * and processes it for storage and analysis
 */

import type { APIRoute } from 'astro';

// Analytics data storage interface
interface AnalyticsEvent {
  type: string;
  data: any;
  timestamp: number;
  sessionId?: string;
  userId?: string;
  url?: string;
}

// In-memory storage for development (replace with database in production)
const analyticsData: AnalyticsEvent[] = [];
const MAX_EVENTS = 10000; // Limit memory usage

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  clientData.count++;
  return true;
}

function getClientId(request: Request): string {
  // Use IP address or session ID as client identifier
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return ip;
}

function validateAnalyticsData(data: any[]): boolean {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.type === 'string' &&
      typeof item.timestamp === 'number' &&
      item.data !== undefined
    );
  });
}

function processAnalyticsData(events: AnalyticsEvent[]): void {
  events.forEach(event => {
    // Add to in-memory storage
    analyticsData.push(event);
    
    // Keep only recent events to prevent memory issues
    if (analyticsData.length > MAX_EVENTS) {
      analyticsData.splice(0, analyticsData.length - MAX_EVENTS);
    }

    // Process specific event types
    switch (event.type) {
      case 'web_vitals':
        processWebVitalsData(event);
        break;
      case 'performance':
        processPerformanceData(event);
        break;
      case 'user_behavior':
        processUserBehaviorData(event);
        break;
      case 'content_interaction':
        processContentInteractionData(event);
        break;
      case 'seo':
        processSEOData(event);
        break;
      case 'custom_event':
        processCustomEventData(event);
        break;
    }
  });
}

function processWebVitalsData(event: AnalyticsEvent): void {
  const { name, value, rating } = event.data;
  
  // Log poor performance metrics
  if (rating === 'poor') {
    console.warn(`Poor Web Vital detected: ${name} = ${value}`, {
      url: event.data.url,
      timestamp: event.timestamp
    });
  }

  // In production, you might want to:
  // - Send alerts for poor metrics
  // - Store in database for trend analysis
  // - Update real-time dashboards
}

function processPerformanceData(event: AnalyticsEvent): void {
  const { loadTime, url } = event.data;
  
  // Log slow page loads
  if (loadTime > 3000) { // 3 seconds
    console.warn(`Slow page load detected: ${loadTime}ms for ${url}`);
  }

  // In production, you might want to:
  // - Identify performance bottlenecks
  // - Track performance trends
  // - Generate performance reports
}

function processUserBehaviorData(event: AnalyticsEvent): void {
  const { event: behaviorEvent, data } = event.data;
  
  // Track important user actions
  if (behaviorEvent === 'search') {
    console.log(`Search performed: "${data.query}"`);
  }

  // In production, you might want to:
  // - Build user journey maps
  // - Identify popular content
  // - Optimize user experience
}

function processContentInteractionData(event: AnalyticsEvent): void {
  const { contentId, contentType, event: interactionEvent } = event.data;
  
  // Track content engagement
  console.log(`Content interaction: ${interactionEvent} on ${contentType} ${contentId}`);

  // In production, you might want to:
  // - Track content popularity
  // - Measure engagement metrics
  // - Optimize content strategy
}

function processSEOData(event: AnalyticsEvent): void {
  const { url, title, h1Count, imagesWithoutAlt } = event.data;
  
  // Check for SEO issues
  if (h1Count !== 1) {
    console.warn(`SEO Issue: Page has ${h1Count} H1 tags (should be 1): ${url}`);
  }
  
  if (imagesWithoutAlt > 0) {
    console.warn(`SEO Issue: ${imagesWithoutAlt} images without alt text on ${url}`);
  }

  // In production, you might want to:
  // - Generate SEO audit reports
  // - Track SEO improvements over time
  // - Alert on SEO issues
}

function processCustomEventData(event: AnalyticsEvent): void {
  const { eventName, ...eventData } = event.data;
  
  console.log(`Custom event: ${eventName}`, eventData);

  // In production, you might want to:
  // - Track custom business metrics
  // - Trigger automated workflows
  // - Update business dashboards
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Check rate limiting
    const clientId = getClientId(request);
    if (!checkRateLimit(clientId)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60'
        }
      });
    }

    // Parse request body
    const body = await request.json();
    
    // Validate data
    if (!validateAnalyticsData(body)) {
      return new Response(JSON.stringify({ error: 'Invalid analytics data format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Process analytics data
    processAnalyticsData(body);

    return new Response(JSON.stringify({ 
      success: true, 
      processed: body.length,
      timestamp: Date.now()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '100');
    const since = searchParams.get('since');

    let filteredData = analyticsData;

    // Filter by type
    if (type) {
      filteredData = filteredData.filter(event => event.type === type);
    }

    // Filter by timestamp
    if (since) {
      const sinceTimestamp = new Date(since).getTime();
      filteredData = filteredData.filter(event => event.timestamp >= sinceTimestamp);
    }

    // Limit results
    const results = filteredData.slice(-limit);

    // Generate summary statistics
    const summary = {
      totalEvents: analyticsData.length,
      filteredEvents: results.length,
      eventTypes: [...new Set(analyticsData.map(e => e.type))],
      timeRange: {
        oldest: analyticsData.length > 0 ? Math.min(...analyticsData.map(e => e.timestamp)) : null,
        newest: analyticsData.length > 0 ? Math.max(...analyticsData.map(e => e.timestamp)) : null
      }
    };

    return new Response(JSON.stringify({
      summary,
      events: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Analytics GET API error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};