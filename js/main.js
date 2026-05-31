const COLORS = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
    '#9b59b6', '#1abc9c', '#e67e22', '#2c3e50'
];

fetch('assets/data/chart-data.json')
    .then(r => r.json())
    .then(data => {
    document.getElementById('subtitle').textContent = data.subtitle;

    const datasets = data.datasets.flatMap((ds, i) => {
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
        data: { labels: data.labels, datasets },
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
                        const solidIdx = chart.data.datasets.findIndex(d => d.label === name);
                        const solidMeta = chart.getDatasetMeta(solidIdx);
                        solidMeta.hidden = !solidMeta.hidden;
                        const champIdx = chart.data.datasets.findIndex(d => d.label === '_' + name);
                        if (champIdx !== -1) {
                            chart.getDatasetMeta(champIdx).hidden = solidMeta.hidden || champHidden;
                        }
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
                const playerName = ds.label.slice(1);
                const solidIdx = myChart.data.datasets.findIndex(d => d.label === playerName);
                const playerHidden = solidIdx !== -1 && myChart.getDatasetMeta(solidIdx).hidden;
                myChart.getDatasetMeta(i).hidden = champHidden || playerHidden;
            }
        });
        myChart.update();
        btn.textContent = champHidden ? 'Show Champion Lines' : 'Hide Champion Lines';
    });
    }).catch(err => console.error('Error loading data:', err));
