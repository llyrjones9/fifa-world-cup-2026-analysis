const COLORS = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
    '#9b59b6', '#1abc9c', '#e67e22', '#2c3e50'
];

fetch('assets/data/chart-data.json')
    .then(r => r.json())
    .then(data => {
    const zoomPlugin = window.zoomPlugin || window['chartjs-plugin-zoom'];
    if (zoomPlugin) {
        Chart.register(zoomPlugin);
    }

    document.getElementById('subtitle').textContent = data['subtitle-win'][0];
    document.getElementById('subtitle-final').textContent = data['subtitle-final'][0];

    const datasets = data.datasets.map((ds, i) => {
        const color = COLORS[i % COLORS.length];
        return {
            label: ds.name,
            data: ds.champion,
            totalData: ds.total,
            championData: ds.champion,
            borderColor: color,
            backgroundColor: color + '22',
            borderWidth: 2.5,
            pointRadius: 1,
            pointHoverRadius: 4,
            tension: 0.3,
            fill: false,
        };
    });

    let currentSeries = 'champion';

    const myChart = new Chart(document.getElementById('sweepChart'), {
        type: 'line',
        data: { labels: data.labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        threshold: 10
                    },
                    zoom: {
                        drag: {
                            enabled: true,
                            backgroundColor: 'rgba(52, 152, 219, 0.15)',
                            borderColor: 'rgba(52, 152, 219, 0.8)',
                            borderWidth: 1
                        },
                        wheel: { enabled: false },
                        pinch: { enabled: false },
                        mode: 'xy'
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: { size: 13 }
                    }
                },
                title: {
                    display: true,
                    text: 'Stake Value: Champion Only',
                    font: { size: 16 }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const name = ctx.dataset.label;
                            return ` ${name}: £${ctx.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: { callback: v => '£' + v.toFixed(2) },
                    title: { display: true, text: 'Value (£)', font: { size: 13 } }
                },
                x: {
                    type: 'time',
                    time: {
                        tooltipFormat: 'd MMM HH:mm:ss',
                        displayFormats: { second: 'HH:mm:ss', minute: 'd MMM HH:mm', hour: 'd MMM HH:mm', day: 'd MMM' }
                    },
                    title: { display: true, text: 'Date', font: { size: 13 } }
                }
            }
        }
    });

    const btn = document.getElementById('toggleSeries');
    const resetZoomBtn = document.getElementById('resetZoom');

    resetZoomBtn.addEventListener('click', () => {
        myChart.resetZoom();
    });

    btn.addEventListener('click', () => {
        currentSeries = currentSeries === 'champion' ? 'total' : 'champion';
        myChart.data.datasets.forEach(ds => {
            ds.data = currentSeries === 'champion' ? ds.championData : ds.totalData;
        });
        myChart.options.plugins.title.text = currentSeries === 'champion' ? 'Stake Value: Champion Only' : 'Stake Value: Total';
        btn.textContent = currentSeries === 'champion' ? 'View Total Stake Value' : 'View Champion Stake Value';
        myChart.update();
    });
    }).catch(err => console.error('Error loading data:', err));
