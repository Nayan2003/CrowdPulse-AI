import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

// Pulling your exact Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDcyNbwFv453bDI0mm4DREmon5MqBCsJeY",
  authDomain: "crowdpulse-ai-f3de5.firebaseapp.com",
  databaseURL: "https://crowdpulse-ai-f3de5-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "crowdpulse-ai-f3de5",
  storageBucket: "crowdpulse-ai-f3de5.firebasestorage.app",
  messagingSenderId: "937336493344",
  appId: "1:937336493344:web:07920adbc85ddbe61ab345"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Initial State (Baseline matching the UI layout)
let gates = [
  { id: 'Gate 1 (North)', status: 'good', flowRate: '12 ppl/min', wait: '2m', diverted: false },
  { id: 'Gate 2 (North-East)', status: 'good', flowRate: '15 ppl/min', wait: '3m', diverted: false },
  { id: 'Gate 3 (East)', status: 'warn', flowRate: '25 ppl/min', wait: '8m', diverted: false },
  { id: 'Gate 4 (South-East)', status: 'good', flowRate: '18 ppl/min', wait: '4m', diverted: false },
  { id: 'Gate 5 (South)', status: 'danger', flowRate: '45 ppl/min', wait: '18m', diverted: true },
  { id: 'Gate 6 (South-West)', status: 'warn', flowRate: '35 ppl/min', wait: '12m', diverted: false },
  { id: 'Gate 7 (West)', status: 'good', flowRate: '10 ppl/min', wait: '2m', diverted: false },
  { id: 'Gate 8 (VIP)', status: 'good', flowRate: '5 ppl/min', wait: '0m', diverted: false }
];

let foodStalls = [
  { name: 'Burger Point', zone: 'North', queue: 45, wait: '15m' },
  { name: 'Cold Drinks', zone: 'East', queue: 12, wait: '3m' },
  { name: 'Pizza Hub', zone: 'South', queue: 28, wait: '10m' },
  { name: 'Snack Bar', zone: 'West', queue: 5, wait: '1m' },
];

console.log("🚀 Starting CrowdPulse-AI Firebase Sensor Simulator...");
console.log("📡 Connecting to Realtime Database at: " + firebaseConfig.databaseURL);
console.log("Press Ctrl+C to exit.\n");

// Push data loop
setInterval(() => {
  // Mathematically mutate gate flows to simulate organic traffic
  gates = gates.map(g => {
    if (Math.random() > 0.4) {
      let currentWait = parseInt(g.wait);
      currentWait += Math.floor(Math.random() * 5) - 2; 
      if (currentWait < 0) currentWait = 0;
      
      let flow = parseInt(g.flowRate);
      flow += Math.floor(Math.random() * 8) - 3;
      if (flow < 0) flow = 0;

      g.wait = `${currentWait}m`;
      g.flowRate = `${flow} ppl/min`;
      g.status = currentWait > 15 ? 'danger' : currentWait > 5 ? 'warn' : 'good';
    }
    return g;
  });

  // Mutate food stalls queue lengths
  foodStalls = foodStalls.map(f => {
    if(Math.random() > 0.4) {
      let queue = f.queue + Math.floor(Math.random() * 7) - 3;
      if(queue < 0) queue = 0;
      f.queue = queue;
      f.wait = `${Math.ceil(queue / 3)}m`; 
    }
    return f;
  });

  // Push directly to Firebase RTDB!
  Promise.all([
    set(ref(db, 'gates'), gates),
    set(ref(db, 'foodStalls'), foodStalls)
  ]).then(() => {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ✅ Successfully published simulated sensor data to Firebase`);
  }).catch(e => {
    console.error("❌ Failed to push data: ", e);
  });

}, 4500); // Trigger a database push every 4.5 seconds
