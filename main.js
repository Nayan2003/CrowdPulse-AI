// Dummy Data & Real-Time Simulation for CrowdPulse-AI Dashboard
const fullAlertHistory = [];

const gates = [
  { id: 'Gate 1 (VIP)', status: 'good', flowRate: '12 ppl/min', wait: '2m', diverted: false },
  { id: 'Gate 2 (General)', status: 'danger', flowRate: '45 ppl/min', wait: '18m', diverted: true },
  { id: 'Gate 3 (General)', status: 'warn', flowRate: '30 ppl/min', wait: '8m', diverted: false },
  { id: 'Gate 4 (General)', status: 'good', flowRate: '15 ppl/min', wait: '3m', diverted: false },
  { id: 'Gate 5 (Emergency)', status: 'good', flowRate: '0 ppl/min', wait: '0m', diverted: false },
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
  overviewContainer.innerHTML = gates.slice(0,4).map(gate => `
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

// Init
document.addEventListener('DOMContentLoaded', () => {
  renderGates();
  renderFood();
  addAlert("System Initialization Complete. AI Models active.");
  updateHeatmaps();
  simulateRealTimeUpdates();

  // Trigger alert button
  document.getElementById('btn-trigger-alert').addEventListener('click', () => {
    addAlert("MANUAL OVERRIDE: Evacuation protocol standby.", true);
  });
});
