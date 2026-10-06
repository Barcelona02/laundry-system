// Automated API test: i-run gamit "npm run test:api" habang tumatakbo ang server
const BASE = process.env.API_URL || "http://localhost:5000/api";

let passed = 0;
let failed = 0;

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

function check(name, actual, expected, data) {
  if (actual === expected) {
    passed++;
    console.log(`  PASS  ${name} (${actual})`);
  } else {
    failed++;
    const reason = data && data.message ? ` -> ${data.message}` : "";
    console.log(`  FAIL  ${name}: expected ${expected}, got ${actual}${reason}`);
  }
}

async function run() {
  // ===== A. CUSTOMERS =====
  console.log("\nA. Customers");
  const customers = await call("GET", "/customers");
  check("list customers", customers.status, 200);
  if (!customers.data || customers.data.length < 2) {
    throw new Error("Kulang ang customers. I-run muna: npm run seed");
  }

  const uniquePhone = "09" + String(Date.now()).slice(-9);
  const newCustomer = await call("POST", "/customers", { name: "Test Customer", phone: uniquePhone });
  check("create customer", newCustomer.status, 201, newCustomer.data);

  const invalid = await call("POST", "/customers", { name: "R", phone: "12345" });
  check("invalid customer data", invalid.status, 400, invalid.data);

  const duplicate = await call("POST", "/customers", { name: "Duplicate", phone: uniquePhone });
  check("duplicate phone", duplicate.status, 400, duplicate.data);

  check("invalid id", (await call("GET", "/customers/abc")).status, 400);
  check("customer not found", (await call("GET", "/customers/000000000000000000000000")).status, 404);

  // ===== B. ORDERS + PAYMENTS =====
  console.log("\nB. Orders + Payments");
  const services = await call("GET", "/services?active=true");
  check("list active services", services.status, 200);
  const wdf = services.data.find((s) => s.name === "Wash-Dry-Fold");
  if (!wdf) throw new Error("Walang Wash-Dry-Fold. I-run muna: npm run seed");

  const order = await call("POST", "/orders", {
    customer: customers.data[0]._id,
    service: wdf._id,
    quantity: 6,
    addOns: ["fabcon"],
    isRush: true,
  });
  check("create order", order.status, 201, order.data);
  check("total = 330 (210 + 15 fabcon + 105 rush)", order.data.totalAmount, 330);
  const id = order.data._id;

  const detail = await call("GET", `/orders/${id}`);
  check("order detail", detail.status, 200, detail.data);
  check("starting balance = 330", detail.data.balance, 330);

  check("skip to claimed", (await call("PATCH", `/orders/${id}/status`, { status: "claimed" })).status, 400);

  const down = await call("POST", "/payments", { order: id, amount: 100, method: "cash" });
  check("downpayment 100", down.status, 201, down.data);
  check("balance after downpayment = 230", down.data.balance, 230);

  check("overpay rejected", (await call("POST", "/payments", { order: id, amount: 500 })).status, 400);
  check("gcash without reference", (await call("POST", "/payments", { order: id, amount: 50, method: "gcash" })).status, 400);

  for (const status of ["washing", "drying", "ready"]) {
    const r = await call("PATCH", `/orders/${id}/status`, { status });
    check(`status -> ${status}`, r.status, 200, r.data);
  }

  const earlyClaim = await call("PATCH", `/orders/${id}/status`, { status: "claimed" });
  check("claim with balance rejected", earlyClaim.status, 400, earlyClaim.data);

  const full = await call("POST", "/payments", { order: id, amount: 230, method: "gcash", reference: "GC1234567890" });
  check("pay remaining 230", full.status, 201, full.data);
  check("balance = 0", full.data.balance, 0);

  const claim = await call("PATCH", `/orders/${id}/status`, { status: "claimed" });
  check("claim", claim.status, 200, claim.data);

  check("change claimed order", (await call("PATCH", `/orders/${id}/status`, { status: "washing" })).status, 400);

  // ===== C. MACHINES =====
  console.log("\nC. Machines");
  const mOrder = await call("POST", "/orders", {
    customer: customers.data[1]._id,
    service: wdf._id,
    quantity: 5,
  });
  check("create machine test order", mOrder.status, 201, mOrder.data);
  const mid = mOrder.data._id;

  const toWashing = await call("PATCH", `/orders/${mid}/status`, { status: "washing" });
  check("status -> washing", toWashing.status, 200, toWashing.data);

  const dryers = await call("GET", "/machines?type=dryer");
  const wrongType = await call("PATCH", `/orders/${mid}/machine`, { machine: dryers.data[0]._id });
  check("dryer on washing order rejected", wrongType.status, 400, wrongType.data);

  const washers = await call("GET", "/machines?type=washer");
  const broken = washers.data.find((m) => m.status === "maintenance");
  if (broken) {
    const r = await call("PATCH", `/orders/${mid}/machine`, { machine: broken._id });
    check(`maintenance washer ${broken.code} rejected`, r.status, 400, r.data);
  }

  const before = await call("GET", "/machines/availability");
  check("availability", before.status, 200);
  const inUseBefore = before.data.washer.inUse;

  const free = await call("GET", "/machines?type=washer&status=available");
  if (!free.data.length) throw new Error("Walang available na washer. I-run: npm run seed");

  const assign = await call("PATCH", `/orders/${mid}/machine`, { machine: free.data[0]._id });
  check(`assign ${free.data[0].code}`, assign.status, 200, assign.data);

  const during = await call("GET", "/machines/availability");
  check("washer inUse +1", during.data.washer.inUse, inUseBefore + 1);

  const toDrying = await call("PATCH", `/orders/${mid}/status`, { status: "drying" });
  check("status -> drying", toDrying.status, 200, toDrying.data);

  const after = await call("GET", "/machines/availability");
  check("washer released (inUse back)", after.data.washer.inUse, inUseBefore);

    // ===== D. STATS + TRACKING =====
  console.log("\nD. Stats + Tracking");
  const dash = await call("GET", "/stats/dashboard");
  check("dashboard", dash.status, 200, dash.data);
  check("dashboard has today's sales", typeof dash.data.sales.today, "number");

  const sales = await call("GET", "/stats/sales?days=7");
  check("sales report", sales.status, 200, sales.data);
  check("sales series has 7 days", sales.data.series.length, 7);
  check("invalid days rejected", (await call("GET", "/stats/sales?days=abc")).status, 400);

  const code = order.data.orderCode;
  const track = await call("GET", `/track/${code}`);
  check(`track ${code}`, track.status, 200, track.data);
  check("tracked order fully paid", track.data.balance, 0);
  check("track lowercase code", (await call("GET", `/track/${code.toLowerCase()}`)).status, 200);
  check("track invalid format", (await call("GET", "/track/HELLO")).status, 400);
  check("track not found", (await call("GET", "/track/LND-99999")).status, 404);
  
  // ===== SUMMARY =====
  console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
  process.exitCode = failed ? 1 : 0;
}

run().catch((err) => {
  const hint = err.cause && err.cause.code === "ECONNREFUSED"
    ? "Hindi tumatakbo ang server. I-run muna: npm run dev"
    : err.message;
  console.error(`\nERROR: ${hint}\n`);
  process.exitCode = 1;
});