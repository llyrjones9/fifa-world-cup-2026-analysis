const COLORS = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
    '#9b59b6', '#1abc9c', '#e67e22', '#2c3e50'
];

Promise.all([
    fetch('assets/data/data.json').then(r => r.json()),
    fetch('assets/data/chart_data.json').then(r => r.json())
]).then(([meta, chartData]) => {
    document.getElementById('subtitle').textContent = meta.subtitle;

    const datasets = chartData.datasets.flatMap((ds, i) => {
        const color = COLORS[i % COLORS.length];
        return [
            {
                label: ds.name,
                data: ds.total,
                borderColor: color,
                backgroundColor: color + '22',
                borderWidth: 2.5,
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.3,
                fill: false,
            },
            {
                label: '_' + ds.name,
                data: ds.champion,
                borderColor: color,
                backgroundColor: 'transparent',
                borderWidth: 1.5,
                borderDash: [6, 4],
                pointRadius: 3,
                pointHoverRadius: 5,
                tension: 0.3,
                fill: false,
            }
        ];
    });

    const myChart = new Chart(document.getElementById('sweepChart'), {
        type: 'line',
        data: { labels: chartData.labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: { size: 13 },
                        filter: item => !item.text.startsWith('_')
                    },
                    onClick: (e, legendItem, legend) => {
                        const chart = legend.chart;
                        const name = legendItem.text;
                        chart.data.datasets.forEach((ds, i) => {
                            if (ds.label === name || ds.label === '_' + name) {
                                const meta = chart.getDatasetMeta(i);
                                meta.hidden = !meta.hidden;
                            }
                        });
                        chart.update();
                    }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const name = ctx.dataset.label.replace(/^_/, '');
                            const type = ctx.dataset.label.startsWith('_') ? 'Champion' : 'Total';
                            return ` ${name} (${type}): £${ctx.parsed.y.toFixed(2)}`;
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

    const btn = document.getElementById('toggleChampion');
    let champHidden = false;
    btn.addEventListener('click', () => {
        champHidden = !champHidden;
        myChart.data.datasets.forEach((ds, i) => {
            if (ds.label.startsWith('_')) {
                myChart.getDatasetMeta(i).hidden = champHidden;
            }
        });
        myChart.update();
        btn.textContent = champHidden ? 'Show Champion Lines' : 'Hide Champion Lines';
    });
}).catch(err => console.error('Error loading data:', err));
