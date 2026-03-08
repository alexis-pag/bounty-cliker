/**
 * chart-system.js
 * Manages the Chart.js instance for the trading dashboard.
 */

export class ChartSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chart = null;
        this.mode = 'line'; // 'line' or 'candle'
    }

    initialize(history) {
        const labels = history.map((_, i) => i);
        
        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Price',
                    data: history,
                    borderColor: '#089981',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.1,
                    fill: 'start',
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return null;
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, 'rgba(8, 153, 129, 0.2)');
                        gradient.addColorStop(1, 'rgba(8, 153, 129, 0)');
                        return gradient;
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#1e222d',
                        titleColor: '#787b86',
                        bodyColor: '#d1d4dc',
                        borderColor: '#2a2e39',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { display: false }
                    },
                    y: {
                        position: 'right',
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#787b86', font: { size: 10 } }
                    }
                },
                animation: { duration: 0 }
            }
        });
    }

    update(history) {
        if (!this.chart) return;
        
        const lastPrice = history[history.length - 1];
        const prevPrice = history[history.length - 2] || lastPrice;
        
        // Update color based on movement
        const color = lastPrice >= prevPrice ? '#089981' : '#f23645';
        this.chart.data.datasets[0].borderColor = color;
        
        // Update data
        this.chart.data.labels = history.map((_, i) => i);
        this.chart.data.datasets[0].data = history;
        
        // Update background gradient color
        this.chart.data.datasets[0].backgroundColor = (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            const rgb = lastPrice >= prevPrice ? '8, 153, 129' : '242, 54, 69';
            gradient.addColorStop(0, `rgba(${rgb}, 0.2)`);
            gradient.addColorStop(1, `rgba(${rgb}, 0)`);
            return gradient;
        };

        this.chart.update('none');
    }

    setMode(mode) {
        this.mode = mode;
        // In a real financial chart we'd switch datasets or types.
        // For this game, we'll stick to a polished line chart for now
        // but can add candle logic if we want to simulate with bars.
    }
}
