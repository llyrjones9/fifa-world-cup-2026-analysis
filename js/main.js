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
            borderWidth: 1,
            pointRadius: 0,
            pointHoverRadius: 2,
            pointHitRadius: 6,
            tension: 0.3,
            fill: false,
        };
    });

    let currentSeries = 'champion';
    const chartLabels = data.labels.map(label => new Date(label));
    const maxRangeIndex = Math.max(chartLabels.length - 1, 0);
    const startRangeInput = document.getElementById('dateStartRange');
    const endRangeInput = document.getElementById('dateEndRange');
    const dualRangeFill = document.getElementById('dualRangeFill');
    const startRangeLabel = document.getElementById('dateRangeStartLabel');
    const endRangeLabel = document.getElementById('dateRangeEndLabel');

    startRangeInput.min = '0';
    startRangeInput.max = String(maxRangeIndex);
    endRangeInput.min = '0';
    endRangeInput.max = String(maxRangeIndex);

    const formatRangeDate = value => new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const updateDateRangeUI = (startIndex, endIndex) => {
        const safeStart = clamp(startIndex, 0, chartLabels.length - 1);
        const safeEnd = clamp(endIndex, 0, chartLabels.length - 1);
        const startValue = Math.min(safeStart, safeEnd);
        const endValue = Math.max(safeStart, safeEnd);

        startRangeInput.value = startValue;
        endRangeInput.value = endValue;

        const total = Math.max(chartLabels.length - 1, 1);
        const startPercent = (startValue / total) * 100;
        const endPercent = (endValue / total) * 100;
        dualRangeFill.style.left = `${startPercent}%`;
        dualRangeFill.style.width = `${Math.max(0, endPercent - startPercent)}%`;

        startRangeLabel.textContent = formatRangeDate(chartLabels[startValue]);
        endRangeLabel.textContent = formatRangeDate(chartLabels[endValue]);
    };

    const applyDateRange = () => {
        const startValue = parseInt(startRangeInput.value, 10);
        const endValue = parseInt(endRangeInput.value, 10);
        updateDateRangeUI(startValue, endValue);

        myChart.options.scales.x.min = chartLabels[parseInt(startRangeInput.value, 10)];
        myChart.options.scales.x.max = chartLabels[parseInt(endRangeInput.value, 10)];
        myChart.update('none');
    };

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

    startRangeInput.addEventListener('input', applyDateRange);
    endRangeInput.addEventListener('input', applyDateRange);

    resetZoomBtn.addEventListener('click', () => {
        myChart.resetZoom();
        updateDateRangeUI(0, chartLabels.length - 1);
        myChart.options.scales.x.min = chartLabels[0];
        myChart.options.scales.x.max = chartLabels[chartLabels.length - 1];
        myChart.update('none');
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

    updateDateRangeUI(0, maxRangeIndex);
    applyDateRange();
    }).catch(err => console.error('Error loading data:', err));
