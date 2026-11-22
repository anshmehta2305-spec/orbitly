// ==========================================
// Orbitly k6 Load Testing Script
// Tests API read latency, post scheduling, and concurrent publishing
// ==========================================

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up to 50 concurrent virtual users
    { duration: '1m', target: 200 },  // Scale to 200 users (soak)
    { duration: '30s', target: 500 },  // Peak spike: 500 concurrent publishes
    { duration: '30s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<800'], // 95% of requests under 300ms
    http_req_failed: ['rate<0.01'],                 // Under 1% failure rate
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000';
const API_KEY = __ENV.ORBITLY_API_KEY || 'orb_live_test_api_key';

export default function () {
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };

  // 1. Benchmark Channels Read
  const chanRes = http.get(`${BASE_URL}/public/v1/channels`, { headers });
  check(chanRes, {
    'channels status 200': (r) => r.status === 200,
  });

  // 2. Benchmark Posts List with Pagination
  const postsRes = http.get(`${BASE_URL}/public/v1/posts?limit=20`, { headers });
  check(postsRes, {
    'posts status 200': (r) => r.status === 200,
  });

  // 3. Benchmark Post Scheduling Mutation
  const payload = JSON.stringify({
    channelIds: ['chan_mock_linkedin', 'chan_mock_x'],
    content: `Load test post iteration ${__VU}-${__ITER} 🚀`,
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    publishNow: false,
  });

  const createRes = http.post(`${BASE_URL}/public/v1/posts`, payload, { headers });
  check(createRes, {
    'create post status 201 or 200': (r) => r.status === 200 || r.status === 201,
  });

  sleep(0.5);
}
