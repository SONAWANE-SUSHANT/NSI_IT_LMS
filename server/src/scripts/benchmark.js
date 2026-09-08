const http = require("http");

async function makeRequest(options, postData = null) {
  const start = process.hrtime.bigint();
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1e6;
        resolve({ statusCode: res.statusCode, durationMs, body });
      });
    });
    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function calculateStats(latencies) {
  latencies.sort((a, b) => a - b);
  const sum = latencies.reduce((acc, v) => acc + v, 0);
  const avg = sum / latencies.length;
  const min = latencies[0];
  const max = latencies[latencies.length - 1];
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p90 = latencies[Math.floor(latencies.length * 0.9)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  return { avg, min, max, p50, p90, p95, p99 };
}

async function benchmarkEndpoint(name, requestOptions, postData, iterations = 150, concurrency = 15) {
  process.stdout.write(`Benchmarking ${name.padEnd(35)} (${iterations} reqs, c=${concurrency})... `);
  const latencies = [];
  const errors = [];
  let inFlight = 0;
  let completed = 0;

  const startTotal = process.hrtime.bigint();

  return new Promise((resolve) => {
    function launchNext() {
      if (completed >= iterations) {
        if (inFlight === 0) {
          const endTotal = process.hrtime.bigint();
          const totalTimeSec = Number(endTotal - startTotal) / 1e9;
          const rps = (iterations / totalTimeSec).toFixed(1);
          const stats = calculateStats(latencies);
          console.log(`✓ ${rps} req/s | Avg: ${stats.avg.toFixed(2)}ms | p95: ${stats.p95.toFixed(2)}ms`);
          resolve({ name, stats, rps, errorCount: errors.length });
        }
        return;
      }

      while (inFlight < concurrency && completed + inFlight < iterations) {
        inFlight++;
        makeRequest(requestOptions, postData)
          .then((res) => {
            latencies.push(res.durationMs);
            if (res.statusCode >= 400) errors.push(res.statusCode);
          })
          .catch((err) => {
            errors.push(err.message);
          })
          .finally(() => {
            inFlight--;
            completed++;
            launchNext();
          });
      }
    }

    launchNext();
  });
}

async function runBenchmark() {
  console.log("\n=======================================================");
  console.log("             LMS FULL API SPEED BENCHMARK             ");
  console.log("=======================================================\n");

  const loginPost = JSON.stringify({ username: "admin@nsi", password: "Admin@123" });
  const loginRes = await makeRequest({
    hostname: "localhost",
    port: 5000,
    path: "/api/auth/login",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(loginPost),
    },
  }, loginPost);

  if (loginRes.statusCode !== 200) {
    console.error("Failed to login for benchmark:", loginRes.body);
    process.exit(1);
  }

  const token = JSON.parse(loginRes.body).data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const results = [];

  results.push(await benchmarkEndpoint("GET /api/health", {
    hostname: "localhost",
    port: 5000,
    path: "/api/health",
    method: "GET",
  }, null, 200, 20));

  results.push(await benchmarkEndpoint("POST /api/auth/login", {
    hostname: "localhost",
    port: 5000,
    path: "/api/auth/login",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(loginPost),
    },
  }, loginPost, 50, 5));

  results.push(await benchmarkEndpoint("GET /api/admin/users", {
    hostname: "localhost",
    port: 5000,
    path: "/api/admin/users",
    method: "GET",
    headers: authHeaders,
  }, null, 150, 15));

  results.push(await benchmarkEndpoint("GET /api/admin/courses", {
    hostname: "localhost",
    port: 5000,
    path: "/api/admin/courses",
    method: "GET",
    headers: authHeaders,
  }, null, 150, 15));

  results.push(await benchmarkEndpoint("GET /api/admin/courses/1/batches", {
    hostname: "localhost",
    port: 5000,
    path: "/api/admin/courses/1/batches",
    method: "GET",
    headers: authHeaders,
  }, null, 150, 15));

  results.push(await benchmarkEndpoint("GET /api/courses/1/modules", {
    hostname: "localhost",
    port: 5000,
    path: "/api/courses/1/modules",
    method: "GET",
    headers: authHeaders,
  }, null, 150, 15));

  results.push(await benchmarkEndpoint("GET /api/modules/1/lectures", {
    hostname: "localhost",
    port: 5000,
    path: "/api/modules/1/lectures",
    method: "GET",
    headers: authHeaders,
  }, null, 150, 15));

  console.log("\n=======================================================");
  console.log("                 BENCHMARK SUMMARY                    ");
  console.log("=======================================================");
  console.table(results.map(r => ({
    Endpoint: r.name,
    "Throughput (req/s)": r.rps,
    "Avg Latency (ms)": r.stats.avg.toFixed(2),
    "p50 (ms)": r.stats.p50.toFixed(2),
    "p95 (ms)": r.stats.p95.toFixed(2),
    "Errors": r.errorCount,
  })));
}

runBenchmark();
