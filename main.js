import { db, isFirebaseConfigured, ref, onValue } from './firebase.js';

// Dummy Data & Real-Time Simulation for CrowdPulse-AI Dashboard
const fullAlertHistory = [];

const gates = [
  { id: 'Gate 1 (North)', status: 'good', flowRate: '12 ppl/min', wait: '2m', diverted: false },
  { id: 'Gate 2 (North-East)', status: 'good', flowRate: '15 ppl/min', wait: '3m', diverted: false },
  { id: 'Gate 3 (East)', status: 'warn', flowRate: '25 ppl/min', wait: '8m', diverted: false },
  { id: 'Gate 4 (South-East)', status: 'good', flowRate: '18 ppl/min', wait: '4m', diverted: false },
  { id: 'Gate 5 (South)', status: 'danger', flowRate: '45 ppl/min', wait: '18m', diverted: true },
  { id: 'Gate 6 (South-West)', status: 'warn', flowRate: '35 ppl/min', wait: '12m', diverted: false },
  { id: 'Gate 7 (West)', status: 'good', flowRate: '10 ppl/min', wait: '2m', diverted: false },
  { id: 'Gate 8 (VIP)', status: 'good', flowRate: '5 ppl/min', wait: '0m', diverted: false }
];

const foodStalls = [
  { name: 'Burger Point', zone: 'North', queue: 45, wait: '15m' },
  { name: 'Cold Drinks', zone: 'East', queue: 12, wait: '3m' },
  { name: 'Pizza Hub', zone: 'South', queue: 28, wait: '10m' },
  { name: 'Snack Bar', zone: 'West', queue: 5, wait: '1m' },
];

const getStatusClass = (statusType) => `status-${statusType}`;

const getDensityColor = (densityPct) => {
  if (densityPct > 80) return `rgba(239, 68, 68, ${densityPct / 100})`;
  if (densityPct > 60) return `rgba(245, 158, 11, ${densityPct / 100})`;
  return `rgba(16, 185, 129, ${densityPct / 100})`;
};

// ================= Navigation Logic ================= //
const navigateTo = (targetId) => {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-item[data-target="${targetId}"]`);
  if (activeNav) {
    activeNav.classList.add('active');
    document.getElementById('page-title').innerText = activeNav.textContent.trim();
  }
  
  document.querySelectorAll('.view-section').forEach(view => {
    view.classList.remove('active');
  });
  
  const targetEl = document.getElementById(targetId);
  if (targetEl) targetEl.classList.add('active');
};

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo(item.getAttribute('data-target'));
  });
});

document.querySelectorAll('[data-navigate]').forEach(card => {
  card.addEventListener('click', () => {
    navigateTo(card.getAttribute('data-navigate'));
  });
});

// ================= Render Views ================= //

const renderGates = () => {
  // Mini List (Overview)
  const overviewContainer = document.getElementById('overview-gate-list');
  overviewContainer.innerHTML = gates.map(gate => `
    <div class="list-item ${getStatusClass(gate.status)}">
      <div class="item-info">
        <strong>${gate.id}</strong>
        <span>Flow: ${gate.flowRate}</span>
      </div>
      <div class="item-metric">${gate.wait}</div>
    </div>
  `).join('');

  // Detailed List (Gates Page)
  const detailedContainer = document.getElementById('detailed-gate-list');
  if(detailedContainer) {
    detailedContainer.innerHTML = gates.map(gate => `
      <div class="list-item ${getStatusClass(gate.status)}">
        <div class="item-info">
          <strong>${gate.id} ${gate.diverted ? '<span class="status-warn">(Re-routed)</span>' : ''}</strong>
          <span>Flow: ${gate.flowRate}</span>
        </div>
        <div class="item-metric">${gate.wait}</div>
      </div>
    `).join('');
  }

  // Update Visual Heatmap Gates
  gates.forEach((gate, index) => {
    const fillEl = document.getElementById(`gate-fill-${index}`);
    if(fillEl) {
      const waitInt = parseInt(gate.wait) || 0;
      let pct = (waitInt / 20) * 100;
      if(pct > 100) pct = 100;
      fillEl.style.width = `${pct}%`;
      
      if(gate.status === 'danger') fillEl.style.backgroundColor = 'var(--status-danger)';
      else if (gate.status === 'warn') fillEl.style.backgroundColor = 'var(--status-warn)';
      else fillEl.style.backgroundColor = 'var(--status-good)';
    }
  });
};

const renderFood = () => {
  const sorted = [...foodStalls].sort((a,b) => b.queue - a.queue);

  // Mini List (Overview)
  const overviewContainer = document.getElementById('overview-queue-list');
  overviewContainer.innerHTML = sorted.map(stall => {
    let status = stall.queue > 30 ? 'danger' : stall.queue > 15 ? 'warn' : 'good';
    return `
    <div class="list-item ${getStatusClass(status)}">
      <div class="item-info">
        <strong>${stall.name}</strong>
        <span>${stall.zone} Zone</span>
      </div>
      <div class="item-metric">${stall.queue} ppl</div>
    </div>
  `}).join('');

  // Detailed Table (Food Page)
  const detailedContainer = document.getElementById('detailed-food-list');
  if(detailedContainer) {
    detailedContainer.innerHTML = sorted.map(stall => {
      let status = stall.queue > 30 ? 'danger' : stall.queue > 15 ? 'warn' : 'good';
      let statusText = stall.queue > 30 ? 'Congested' : stall.queue > 15 ? 'Moderate' : 'Clear';
      return `
      <tr>
        <td><strong>${stall.name}</strong></td>
        <td>${stall.zone}</td>
        <td>${stall.queue} users</td>
        <td>${stall.wait}</td>
        <td><span class="pill" style="background:var(--status-${status}); border-radius:4px; padding:2px 8px; font-size:12px;">${statusText}</span></td>
      </tr>
      `
    }).join('');
  }
};

const addAlert = (message, isCritical = false) => {
  const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
  const alertHtml = `
    <div class="alert-item ${isCritical ? 'critical' : ''}">
      <strong>[${time}]</strong> ${message}
    </div>
  `;
  
  // Update History memory
  fullAlertHistory.unshift(alertHtml);

  // Overview Container (max 5)
  const overviewContainer = document.getElementById('overview-alert-list');
  overviewContainer.innerHTML = fullAlertHistory.slice(0, 5).join('');
  
  // Detailed Alerts Container (all)
  const detailedContainer = document.getElementById('detailed-alert-list');
  if(detailedContainer) {
     detailedContainer.innerHTML = fullAlertHistory.join('');
  }
};

const updateHeatmaps = () => {
  const zones = ['north', 'south', 'east', 'west'];
  zones.forEach(zone => {
    // Generate Random Density matching realistic scenarios
    const density = Math.floor(Math.random() * 75) + 20; 
    const isHigh = density > 75;

    // Mini Map Update
    const miniEl = document.getElementById(`zone-${zone}`);
    if(miniEl) {
      miniEl.style.backgroundColor = getDensityColor(density);
      miniEl.innerText = `${zone.charAt(0).toUpperCase() + zone.slice(1)} (${density}%)`;
    }

    // Large Map Update
    const lgEl = document.getElementById(`zone-${zone}-lg`);
    if(lgEl) {
      lgEl.style.backgroundColor = getDensityColor(density);
      lgEl.innerText = `${zone.charAt(0).toUpperCase() + zone.slice(1)} Area (${density}% Density) - ${isHigh ? 'Bottleneck Detected' : 'Flow Normal'}`;
    }
  });

  // Random Total Attendance Fluctuation
  const attendanceEl = document.getElementById('val-attendance');
  let current = parseInt(attendanceEl.innerText.replace(/,/g, ''));
  if(Math.random() > 0.5) current += Math.floor(Math.random() * 5);
  attendanceEl.innerText = current.toLocaleString();
};

// ================= Loop System ================= //
const simulateRealTimeUpdates = () => {
  setInterval(updateHeatmaps, 2500);

  setInterval(() => {
    gates.forEach(g => {
      if(Math.random() > 0.6) {
        let currentWait = parseInt(g.wait);
        currentWait += Math.floor(Math.random() * 5) - 2; 
        if(currentWait < 0) currentWait = 0;
        g.wait = `${currentWait}m`;
        g.status = currentWait > 15 ? 'danger' : currentWait > 5 ? 'warn' : 'good';
      }
    });
    renderGates();
  }, 4000);

  setInterval(() => {
    foodStalls.forEach(f => {
      if(Math.random() > 0.5) {
        let queue = f.queue + Math.floor(Math.random() * 7) - 3;
        if(queue < 0) queue = 0;
        f.queue = queue;
        f.wait = `${Math.ceil(queue / 3)}m`; 
      }
    });
    renderFood();
  }, 5000);

  setInterval(() => {
    const alerts = [
      "AI detected crowd buildup near North Gate. Suggesting diversion.",
      "Food pickup speed at Burger Point dropped.",
      "South Pavilion density normalized.",
      "Concourse movement is optimal."
    ];
    const critical = ["CRITICAL: Crowd surge at Gate 2!", "ALERT: Heatmap red-zone detected."];

    if(Math.random() > 0.7) {
      if(Math.random() > 0.8) addAlert(critical[Math.floor(Math.random() * critical.length)], true);
      else addAlert(alerts[Math.floor(Math.random() * alerts.length)]);
    }
  }, 7000);
};

// ================= Heatmap Filter Logic ================= //
document.querySelectorAll('.filter-pills .pill').forEach(pill => {
  pill.addEventListener('click', () => {
    // Update active class
    document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');

    const filterText = pill.textContent.trim();
    const zones = document.querySelectorAll('.large-map .stadium-zone');
    const points = document.querySelectorAll('.large-map .heat-point');

    if (filterText === 'All Zones') {
      zones.forEach(z => z.style.opacity = '1');
      points.forEach(p => p.style.opacity = '0.8');
    } else if (filterText === 'Concourse') {
      zones.forEach(z => z.style.opacity = '0.1');
      points.forEach(p => p.style.opacity = '1'); 
    } else if (filterText === 'Stands') {
      zones.forEach(z => z.style.opacity = '1');
      points.forEach(p => p.style.opacity = '0'); 
    }
  });
});

// ================= Login Handlers ================= //
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const loginOverlay = document.getElementById('login-overlay');
  const errorMessage = document.getElementById('login-error-message');

  if (loginForm && loginOverlay) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById('admin-username');
      const passwordInput = document.getElementById('admin-password');

      // Simple mock authentication check. Since auth is optional in workflow,
      // we just simulate a successful login upon clicking login.
      if (usernameInput.value && passwordInput.value) {
        // Authenticated
        loginOverlay.classList.add('hidden');
        // Clear timeout error if any
        if (errorMessage) errorMessage.style.display = 'none';
        
        // Remove from DOM eventually for performance (optional)
        setTimeout(() => {
          loginOverlay.style.display = 'none';
        }, 500);

        addAlert(`Admin Login Successful: ${usernameInput.value}`, false);
      } else {
        if (errorMessage) {
          errorMessage.style.display = 'block';
        }
      }
    });
  }
});

// Init
document.addEventListener('DOMContentLoaded', () => {
  renderGates();
  renderFood();
  addAlert("System Initialization Complete. AI Models active.");
  updateHeatmaps();

  if (isFirebaseConfigured) {
    // 📡 Live Firebase Database Observers
    onValue(ref(db, 'gates'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        gates.length = 0;
        data.forEach(g => { if(g) gates.push(g) });
        renderGates();
      }
    });

    onValue(ref(db, 'foodStalls'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        foodStalls.length = 0;
        data.forEach(f => { if(f) foodStalls.push(f) });
        renderFood();
      }
    });
    
    // Fallback heatmaps interval since we aren't observing map density yet
    setInterval(updateHeatmaps, 2500);
    console.log("🟢 Live Firebase connection active!");
  } else {
    simulateRealTimeUpdates();
  }

  // Trigger alert button
  document.getElementById('btn-trigger-alert').addEventListener('click', () => {
    addAlert("MANUAL OVERRIDE: Evacuation protocol standby.", true);
  });


});

// ================= Google Maps Engine Integration ================= //
let mapInitialized = false;

window.initMap = () => {
  if (mapInitialized) return;
  const mapContainer = document.getElementById('google-map-container');
  if(!mapContainer) return;
  
  if (!window.google || !window.google.maps) return;

  // Clear offline placeholder
  mapContainer.innerHTML = '';
  
  // Ground-Truth Center of Wankhede Pitch
  const stadiumCenter = { lat: 18.9388, lng: 72.8258 };
  
  const map = new google.maps.Map(mapContainer, {
    zoom: 18.2, // slightly closer
    center: stadiumCenter,
    mapTypeId: 'satellite',
    disableDefaultUI: true,
    gestureHandling: 'cooperative', // Allow panning now that gates are anchored!
    tilt: 0
  });

  // Custom Overlay Class to bind HTML gates to geo-locations!
  class GateOverlay extends google.maps.OverlayView {
    constructor(position, elementId) {
      super();
      this.position = position;
      this.element = document.getElementById(elementId);
    }
    onAdd() {
      if(!this.element) return;
      this.element.style.position = 'absolute';
      this.getPanes().overlayMouseTarget.appendChild(this.element);
    }
    draw() {
      if(!this.element) return;
      const projection = this.getProjection();
      if (!projection) return;
      const pixel = projection.fromLatLngToDivPixel(this.position);
      if (pixel) {
        this.element.style.left = (pixel.x - 20) + 'px'; // Center element roughly
        this.element.style.top = (pixel.y - 15) + 'px';
      }
    }
    onRemove() {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }
  }

  // Realistic Crowd Density Data rigorously mapped EXACTLY inside the curved arc seating stands
  const generateHeatData = (startAngle, endAngle, density, midR) => {
    let pts = [];
    const ctrLat = 18.9388, ctrLng = 72.8258;
    let delta = (endAngle < startAngle ? endAngle + 360 : endAngle) - startAngle;
    
    // Spread 4 anchor points securely inside the zone arc
    for(let i=1; i<=3; i++) {
        let rad = (startAngle + delta * (i / 4)) * Math.PI / 180;
        let pLat = ctrLat - midR * Math.sin(rad);
        let pLng = ctrLng + midR * Math.cos(rad) * 1.05;
        pts.push({ location: new google.maps.LatLng(pLat, pLng), weight: density });
        // Add random scatter dots around exactly to simulate raw crowd fuzziness
        pts.push(new google.maps.LatLng(pLat + 0.0001, pLng + 0.0001));
    }
    return pts;
  };

  const R_MID = 0.00075; // Middle of the seating stands
  const heatmapData = [
    ...generateHeatData(180, 270, 1.5, R_MID), // Tendulkar (VIP / spread)
    ...generateHeatData(270, 330, 3.5, R_MID), // North Stand (High Density)
    ...generateHeatData(330, 30,  1.0, R_MID), // Gavaskar
    ...generateHeatData(150, 210, 1.0, R_MID), // Merchant
    ...generateHeatData(90, 150,  2.5, R_MID), // Garware (Congested)
    ...generateHeatData(60, 120,  3.0, 0.0006), // Grand Stand (Inner overlay)
    ...generateHeatData(30, 90,   1.2, R_MID)  // Divecha
  ];

  const heatmap = new google.maps.visualization.HeatmapLayer({
    data: heatmapData,
    map: map,
    radius: 35,
    opacity: 0.8,
    gradient: [
      'rgba(0, 255, 255, 0)',
      'rgba(0, 255, 255, 1)',
      'rgba(0, 191, 255, 1)',
      'rgba(0, 127, 255, 1)',
      'rgba(0, 63, 255, 1)',
      'rgba(0, 0, 255, 1)',
      'rgba(0, 0, 223, 1)',
      'rgba(0, 0, 191, 1)',
      'rgba(0, 0, 159, 1)',
      'rgba(0, 0, 127, 1)',
      'rgba(63, 0, 91, 1)',
      'rgba(127, 0, 63, 1)',
      'rgba(191, 0, 31, 1)',
      'rgba(255, 0, 0, 1)'
    ]
  });

  // ================= AI Recognition Zones (Stands & Gates) =================
  const standStyle = { strokeColor: '#FF0000', strokeOpacity: 0.8, strokeWeight: 2, fillColor: '#FF0000', fillOpacity: 0.05, map: map };
  const gateStyle = { strokeColor: '#00FF00', strokeOpacity: 0.9, strokeWeight: 3, fillColor: '#00FF00', fillOpacity: 0.15, map: map };

  // Helper function to draw curved stadium sections (arc polygons)
  const createArc = (startAngle, endAngle, innerR, outerR) => {
    let pts = [];
    const steps = 15;
    const ctrLat = 18.9388;
    const ctrLng = 72.8258;
    
    let endA = endAngle < startAngle ? endAngle + 360 : endAngle;
    let delta = endA - startAngle;

    // Outer arc layer
    for (let i = 0; i <= steps; i++) {
        let rad = (startAngle + delta * (i / steps)) * Math.PI / 180;
        pts.push({ lat: ctrLat - outerR * Math.sin(rad), lng: ctrLng + outerR * Math.cos(rad) * 1.05 });
    }
    // Inner arc layer
    for (let i = steps; i >= 0; i--) {
        let rad = (startAngle + delta * (i / steps)) * Math.PI / 180;
        pts.push({ lat: ctrLat - innerR * Math.sin(rad), lng: ctrLng + innerR * Math.cos(rad) * 1.05 });
    }
    return pts;
  };

  const R_IN = 0.0005;
  const R_OUT = 0.0010;

  // Perfectly Tightly Fit Curved Stand Polygons (Derived from Blueprint Angles)
  new google.maps.Polygon({ ...standStyle, paths: createArc(180, 270, R_IN, R_OUT) }); // A. Sachin Tendulkar Pavilion
  new google.maps.Polygon({ ...standStyle, paths: createArc(270, 330, R_IN, R_OUT) }); // B. North Stand
  new google.maps.Polygon({ ...standStyle, paths: createArc(330, 30, R_IN, R_OUT) }); // C. Sunil Gavaskar Pavilion
  new google.maps.Polygon({ ...standStyle, paths: createArc(150, 210, R_IN, R_OUT) }); // D. Vijay Merchant Pavilion
  new google.maps.Polygon({ ...standStyle, paths: createArc(90, 150, R_IN, R_OUT) }); // E. Garware Pavilion
  new google.maps.Polygon({ ...standStyle, paths: createArc(60, 120, R_IN + 0.0001, R_IN + 0.0004) }); // F. Grand Stand (Inner Overlay)
  new google.maps.Polygon({ ...standStyle, paths: createArc(30, 90, R_IN, R_OUT) }); // G. Divecha Stand

  // Tightly Fit Gate Rectangles precisely placed outside entrances (Circular distribution)
  const g1 = new google.maps.LatLng(18.9399, 72.8258); // Gate 1 North
  new google.maps.Polygon({ ...gateStyle, paths: [{lat: 18.9398, lng: 72.8257}, {lat: 18.9398, lng: 72.8259}, {lat: 18.9400, lng: 72.8259}, {lat: 18.9400, lng: 72.8257}]});
  
  const g2 = new google.maps.LatLng(18.9396, 72.8266); // Gate 2 North-East
  new google.maps.Polygon({ ...gateStyle, paths: [{lat: 18.9395, lng: 72.8265}, {lat: 18.9395, lng: 72.8267}, {lat: 18.9397, lng: 72.8267}, {lat: 18.9397, lng: 72.8265}]});
  
  const g3 = new google.maps.LatLng(18.9388, 72.8269); // Gate 3 East
  new google.maps.Polygon({ ...gateStyle, paths: [{lat: 18.9387, lng: 72.8268}, {lat: 18.9387, lng: 72.8270}, {lat: 18.9389, lng: 72.8270}, {lat: 18.9389, lng: 72.8268}]});
  
  const g4 = new google.maps.LatLng(18.9380, 72.8266); // Gate 4 South-East
  new google.maps.Polygon({ ...gateStyle, paths: [{lat: 18.9379, lng: 72.8265}, {lat: 18.9379, lng: 72.8267}, {lat: 18.9381, lng: 72.8267}, {lat: 18.9381, lng: 72.8265}]});
  
  const g5 = new google.maps.LatLng(18.9377, 72.8258); // Gate 5 South
  new google.maps.Polygon({ ...gateStyle, paths: [{lat: 18.9376, lng: 72.8257}, {lat: 18.9376, lng: 72.8259}, {lat: 18.9378, lng: 72.8259}, {lat: 18.9378, lng: 72.8257}]});
  
  const g6 = new google.maps.LatLng(18.9380, 72.8250); // Gate 6 South-West
  new google.maps.Polygon({ ...gateStyle, paths: [{lat: 18.9379, lng: 72.8249}, {lat: 18.9379, lng: 72.8251}, {lat: 18.9381, lng: 72.8251}, {lat: 18.9381, lng: 72.8249}]});
  
  const g7 = new google.maps.LatLng(18.9388, 72.8247); // Gate 7 West
  new google.maps.Polygon({ ...gateStyle, paths: [{lat: 18.9387, lng: 72.8246}, {lat: 18.9387, lng: 72.8248}, {lat: 18.9389, lng: 72.8248}, {lat: 18.9389, lng: 72.8246}]});
  
  const g8 = new google.maps.LatLng(18.9396, 72.8250); // Gate 8 VIP / North-West
  new google.maps.Polygon({ ...gateStyle, paths: [{lat: 18.9395, lng: 72.8249}, {lat: 18.9395, lng: 72.8251}, {lat: 18.9397, lng: 72.8251}, {lat: 18.9397, lng: 72.8249}]});
  
  // Anchor HTML Overlays dynamically to the map projection!
  new GateOverlay(g1, 'visual-gate-1').setMap(map);
  new GateOverlay(g2, 'visual-gate-2').setMap(map);
  new GateOverlay(g3, 'visual-gate-3').setMap(map);
  new GateOverlay(g4, 'visual-gate-4').setMap(map);
  new GateOverlay(g5, 'visual-gate-5').setMap(map);
  new GateOverlay(g6, 'visual-gate-6').setMap(map);
  new GateOverlay(g7, 'visual-gate-7').setMap(map);
  new GateOverlay(g8, 'visual-gate-8').setMap(map);
  
  mapInitialized = true;
  console.log("🗺️ Google Maps Initialized with AI Heatmap & Polygons");
};

// Start a watcher just in case the callback fires before this code parses
const initWatcher = setInterval(() => {
  if (window.google && window.google.maps) {
    window.initMap();
    if(mapInitialized) clearInterval(initWatcher);
  }
}, 200);
