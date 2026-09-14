/* EV Market 2026 — interactions + charts */

// ---- scroll progress ----
const bar = document.getElementById('progress');
const onScroll = () => {
  const h = document.documentElement;
  const pct = h.scrollTop / (h.scrollHeight - h.clientHeight) * 100;
  bar.style.width = pct + '%';
};
document.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---- reveal on scroll ----
document.querySelectorAll('.section .wrap > *, .card, .w, .chartbox').forEach(el => el.classList.add('reveal'));
const reveals = [...document.querySelectorAll('.reveal')];
const show = el => el.classList.add('in');
const revealAll = () => reveals.forEach(show);

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
  }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
  reveals.forEach(el => {
    // anything already at or above the fold (e.g. page loaded deep-linked or
    // restored mid-scroll) never intersects again — show it straight away.
    if (el.getBoundingClientRect().top < window.innerHeight) show(el);
    else io.observe(el);
  });
  // failsafe: content must never stay invisible, whatever the observer does.
  window.addEventListener('load', () => setTimeout(revealAll, 1200));
  setTimeout(revealAll, 3000);
} else {
  revealAll();
}

// ---- counting hero stats ----
const countUp = el => {
  const target = parseFloat(el.dataset.count);
  const dec = parseInt(el.dataset.dec || '0', 10);
  const dur = 1400;
  const t0 = performance.now();
  const tick = now => {
    const p = Math.min((now - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * eased).toFixed(dec);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
const heroIO = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { countUp(e.target); heroIO.unobserve(e.target); } });
}, { threshold: 0.6 });
document.querySelectorAll('.num[data-count]').forEach(el => heroIO.observe(el));

// ---- charts ----
if (window.Chart) {
  const ink = '#e9edf3', mut = '#93a0b4', grid = 'rgba(255,255,255,.07)';
  Chart.defaults.color = mut;
  Chart.defaults.font.family = "Inter, system-ui, sans-serif";
  Chart.defaults.font.size = 12;

  const baseScales = (yTitle) => ({
    x: { grid: { display: false }, border: { color: grid }, ticks: { color: mut } },
    y: {
      grid: { color: grid }, border: { display: false },
      ticks: { color: mut }, title: { display: !!yTitle, text: yTitle, color: mut, font: { size: 11 } }
    }
  });
  const noLegend = { legend: { display: false } };
  const tip = {
    backgroundColor: '#11161f', borderColor: 'rgba(255,255,255,.12)', borderWidth: 1,
    titleColor: ink, bodyColor: ink, padding: 10, displayColors: false
  };

  // 1. Global sales
  new Chart(document.getElementById('chartGlobal'), {
    type: 'bar',
    data: {
      labels: ['2021', '2022', '2023', '2024', '2025', '2026E'],
      datasets: [{
        data: [6.6, 10.5, 14.2, 17.5, 21.0, 23.3],
        backgroundColor: ctx => ctx.dataIndex === 5 ? '#3ddc84' : 'rgba(61,220,132,.32)',
        borderRadius: 6, borderSkipped: false, barPercentage: 0.66
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { ...noLegend, tooltip: { ...tip, callbacks: { label: c => c.parsed.y + 'M units' } } },
      scales: baseScales('million units')
    }
  });

  // 2. Regional divergence
  new Chart(document.getElementById('chartRegions'), {
    type: 'bar',
    data: {
      labels: ['Rest of World', 'Europe', 'Global', 'China', 'North America'],
      datasets: [{
        data: [92, 24, -3, -20, -33],
        backgroundColor: ['#3ddc84', '#4da3ff', '#8d97a8', '#ff9f6b', '#ff6b6b'],
        borderRadius: 6, borderSkipped: false, barPercentage: 0.62
      }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { ...noLegend, tooltip: { ...tip, callbacks: { label: c => (c.parsed.x > 0 ? '+' : '') + c.parsed.x + '% year-on-year' } } },
      scales: {
        x: { grid: { color: grid }, border: { display: false }, ticks: { color: mut, callback: v => v + '%' } },
        y: { grid: { display: false }, border: { display: false }, ticks: { color: ink, font: { size: 13 } } }
      }
    }
  });

  // 3. Players
  new Chart(document.getElementById('chartPlayers'), {
    type: 'doughnut',
    data: {
      labels: ['BYD (incl. PHEV)', 'Tesla (BEV)', 'All others'],
      datasets: [{
        data: [2.25, 1.63, 2.0],
        backgroundColor: ['#ff6b6b', '#4da3ff', 'rgba(255,255,255,.14)'],
        borderColor: '#0c1016', borderWidth: 3, hoverOffset: 8
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '62%',
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, padding: 16, color: mut, usePointStyle: true } },
        tooltip: { ...tip, displayColors: true, callbacks: { label: c => ' ' + c.parsed + 'M vehicles' } }
      }
    }
  });

  // 4. LFP share
  new Chart(document.getElementById('chartBatt'), {
    type: 'line',
    data: {
      labels: ['2022', '2023', '2024', '2025', '2026E', '2030F'],
      datasets: [{
        data: [31, 36, 41, 45, 47, 50],
        borderColor: '#3ddc84', borderWidth: 3, tension: .35,
        pointBackgroundColor: '#07090d', pointBorderColor: '#3ddc84', pointBorderWidth: 2.5, pointRadius: 5,
        fill: true,
        backgroundColor: c => {
          const { ctx, chartArea } = c.chart;
          if (!chartArea) return 'rgba(61,220,132,.12)';
          const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, 'rgba(61,220,132,.30)');
          g.addColorStop(1, 'rgba(61,220,132,0)');
          return g;
        }
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { ...noLegend, tooltip: { ...tip, callbacks: { label: c => c.parsed.y + '% of EV battery market' } } },
      scales: {
        x: { grid: { display: false }, border: { color: grid }, ticks: { color: mut } },
        y: { min: 20, max: 60, grid: { color: grid }, border: { display: false }, ticks: { color: mut, callback: v => v + '%' } }
      }
    }
  });

  // 5. Charging market
  new Chart(document.getElementById('chartCharge'), {
    type: 'bar',
    data: {
      labels: ['2026', '2028F', '2030F', '2033F'],
      datasets: [{
        data: [37.4, 55, 82, 136.4],
        backgroundColor: ctx => {
          const { ctx: c, chartArea } = ctx.chart;
          if (!chartArea) return '#4da3ff';
          const g = c.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          g.addColorStop(0, 'rgba(77,163,255,.25)');
          g.addColorStop(1, '#4da3ff');
          return g;
        },
        borderRadius: 6, borderSkipped: false, barPercentage: 0.6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { ...noLegend, tooltip: { ...tip, callbacks: { label: c => '$' + c.parsed.y + 'B' } } },
      scales: {
        x: { grid: { display: false }, border: { color: grid }, ticks: { color: mut } },
        y: { grid: { color: grid }, border: { display: false }, ticks: { color: mut, callback: v => '$' + v + 'B' } }
      }
    }
  });
}
