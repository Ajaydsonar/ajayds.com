document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element Grab --- //
    const industrySelect = document.getElementById('industry');
    const fixedCostsEl = document.getElementById('fixedCosts');
    const pricePerUnitEl = document.getElementById('pricePerUnit');
    const variableCostPerUnitEl = document.getElementById('variableCostPerUnit');
    const unitsToSellEl = document.getElementById('unitsToSell');
    const desiredProfitEl = document.getElementById('desiredProfit');
    const profitSliderEl = document.getElementById('profitSlider');

    const breakEvenUnitsEl = document.getElementById('breakEvenUnits');
    const breakEvenRevenueEl = document.getElementById('breakEvenRevenue');
    const contributionMarginEl = document.getElementById('contributionMargin');
    const contributionMarginPercentageEl = document.getElementById('contributionMarginPercentage');
    const profitOrLossResultEl = document.getElementById('profitOrLossResult');
    const unitsForProfitEl = document.getElementById('unitsForProfit');

    const ctx = document.getElementById('breakEvenChart').getContext('2d');
    let breakEvenChart;

    const downloadPdfBtn = document.getElementById('downloadPdfBtn');

    const PRESETS = {
        retail: { fixedCosts: 12000, pricePerUnit: 75, variableCostPerUnit: 35 },
        restaurant: { fixedCosts: 25000, pricePerUnit: 45, variableCostPerUnit: 18 },
        service: { fixedCosts: 8000, pricePerUnit: 250, variableCostPerUnit: 50 },
        ecommerce: { fixedCosts: 7500, pricePerUnit: 120, variableCostPerUnit: 60 },
    };

    // --- Main Calculation & Update Logic --- //
    function updateCalculator() {
        const fixedCosts = parseFloat(fixedCostsEl.value) || 0;
        const pricePerUnit = parseFloat(pricePerUnitEl.value) || 0;
        const variableCostPerUnit = parseFloat(variableCostPerUnitEl.value) || 0;
        const unitsToSell = parseFloat(unitsToSellEl.value) || 0;
        const desiredProfit = parseFloat(desiredProfitEl.value) || 0;

        // 1. Contribution Margin
        const contributionMargin = pricePerUnit - variableCostPerUnit;
        const contributionMarginPercentage = pricePerUnit > 0 ? (contributionMargin / pricePerUnit) * 100 : 0;
        contributionMarginEl.textContent = formatCurrency(contributionMargin);
        contributionMarginPercentageEl.textContent = `${contributionMarginPercentage.toFixed(1)}%`;

        let breakEvenUnits = 0;
        // 2. Break-Even Point
        if (contributionMargin > 0) {
            breakEvenUnits = fixedCosts / contributionMargin;
        }
        const breakEvenRevenue = breakEvenUnits * pricePerUnit;

        if (breakEvenUnits > 0 && isFinite(breakEvenUnits)) {
            breakEvenUnitsEl.textContent = Math.ceil(breakEvenUnits).toLocaleString();
            breakEvenRevenueEl.textContent = formatCurrency(breakEvenRevenue);
        } else {
            breakEvenUnitsEl.textContent = '--';
            breakEvenRevenueEl.textContent = '--';
        }

        // 3. Profit/Loss Forecast
        if (unitsToSell > 0) {
            const projectedProfit = (unitsToSell * contributionMargin) - fixedCosts;
            profitOrLossResultEl.textContent = formatCurrency(projectedProfit);
            if (projectedProfit >= 0) {
                profitOrLossResultEl.className = 'mt-3 text-center p-3 rounded-lg text-lg font-bold bg-green-100 text-green-800';
            } else {
                profitOrLossResultEl.className = 'mt-3 text-center p-3 rounded-lg text-lg font-bold bg-red-100 text-red-800';
            }
        } else {
            profitOrLossResultEl.textContent = '--';
            profitOrLossResultEl.className = 'mt-3 text-center p-3 rounded-lg text-lg font-bold bg-gray-100 text-gray-800';
        }

        // 4. Profit Goal
        let unitsForProfit = 0;
        if (contributionMargin > 0) {
            unitsForProfit = (fixedCosts + desiredProfit) / contributionMargin;
        }
        unitsForProfitEl.textContent = (unitsForProfit > 0 && isFinite(unitsForProfit)) ? Math.ceil(unitsForProfit).toLocaleString() : '--';

        // 5. Update Chart
        updateChart(fixedCosts, pricePerUnit, variableCostPerUnit, breakEvenUnits, unitsToSell);
    }

    // --- Chart Logic --- //
    function updateChart(fixedCosts, pricePerUnit, variableCostPerUnit, breakEvenUnits, unitsToSell) {
        const maxUnits = Math.max(breakEvenUnits * 2, unitsToSell * 1.5, 100);
        const step = Math.ceil(maxUnits / 10);
        const labels = Array.from({ length: 11 }, (_, i) => i * step);

        breakEvenChart.data.labels = labels;
        breakEvenChart.data.datasets[0].data = labels.map(units => units * pricePerUnit);
        breakEvenChart.data.datasets[1].data = labels.map(units => fixedCosts + (units * variableCostPerUnit));

        // Update annotations
        breakEvenChart.options.plugins.annotation.annotations.breakEvenLine.value = breakEvenUnits > 0 && isFinite(breakEvenUnits) ? breakEvenUnits : undefined;
        breakEvenChart.options.plugins.annotation.annotations.salesLine.value = unitsToSell > 0 ? unitsToSell : undefined;

        breakEvenChart.update();
    }

    // --- Event Handlers --- //
    function handlePresetChange() {
        const preset = PRESETS[industrySelect.value];
        if (preset) {
            fixedCostsEl.value = preset.fixedCosts;
            pricePerUnitEl.value = preset.pricePerUnit;
            variableCostPerUnitEl.value = preset.variableCostPerUnit;
        }
        updateCalculator();
    }

    function handleProfitGoalSync(source) {
        if (source === 'slider') {
            desiredProfitEl.value = profitSliderEl.value;
        } else {
            profitSliderEl.value = desiredProfitEl.value;
        }
        updateCalculator();
    }
    
    // --- Utility Functions --- //
    function formatCurrency(value) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
    }

    // --- Chart & Event Listener Initialization --- //
    function init() {
        breakEvenChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    { label: 'Total Revenue', data: [], borderColor: '#16a34a', tension: 0.1, fill: false },
                    { label: 'Total Costs', data: [], borderColor: '#dc2626', tension: 0.1, fill: false },
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { x: { title: { display: true, text: 'Units Sold' } }, y: { title: { display: true, text: 'Revenue / Costs ($)' }, beginAtZero: true } },
                plugins: {
                    tooltip: { mode: 'index', intersect: false },
                    legend: { position: 'top' },
                    annotation: {
                        annotations: {
                            breakEvenLine: {
                                type: 'line',
                                scaleID: 'x',
                                value: undefined,
                                borderColor: '#f59e0b',
                                borderWidth: 2,
                                borderDash: [6, 6],
                                label: { content: 'Break-Even', enabled: true, position: 'start' }
                            },
                            salesLine: {
                                type: 'line',
                                scaleID: 'x',
                                value: undefined,
                                borderColor: '#3b82f6',
                                borderWidth: 2,
                                label: { content: 'Your Sales', enabled: true, position: 'end' }
                            }
                        }
                    }
                }
            }
        });

        industrySelect.addEventListener('change', handlePresetChange);
        [fixedCostsEl, pricePerUnitEl, variableCostPerUnitEl, unitsToSellEl].forEach(el => el.addEventListener('input', updateCalculator));
        desiredProfitEl.addEventListener('input', () => handleProfitGoalSync('text'));
        profitSliderEl.addEventListener('input', () => handleProfitGoalSync('slider'));
        downloadPdfBtn.addEventListener('click', generatePDF);
        
        updateCalculator();
    }

    // --- PDF Generation --- //
    function generatePDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const fixedCosts = fixedCostsEl.value || '0';
        const pricePerUnit = pricePerUnitEl.value || '0';
        const variableCostPerUnit = variableCostPerUnitEl.value || '0';

        // --- PDF Styling & Content --- //
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text("Break-Even Analysis Report", 105, 20, { align: 'center' });

        // Inputs Section
        doc.setFontSize(14);
        doc.text("Your Inputs", 14, 40);
        doc.setLineWidth(0.5);
        doc.line(14, 42, 196, 42);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Total Fixed Costs: ${formatCurrency(parseFloat(fixedCosts))}`, 14, 50);
        doc.text(`Selling Price Per Unit: ${formatCurrency(parseFloat(pricePerUnit))}`, 14, 58);
        doc.text(`Variable Cost Per Unit: ${formatCurrency(parseFloat(variableCostPerUnit))}`, 14, 66);

        // Results Section
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text("Calculated Results", 14, 80);
        doc.line(14, 82, 196, 82);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Break-Even Point (in Units): ${breakEvenUnitsEl.textContent} units`, 14, 90);
        doc.text(`Break-Even Point (in Revenue): ${breakEvenRevenueEl.textContent}`, 14, 98);
        doc.text(`Contribution Margin Per Unit: ${contributionMarginEl.textContent}`, 14, 106);
        doc.text(`Contribution Margin Percentage: ${contributionMarginPercentageEl.textContent}`, 14, 114);

        // Chart Image
        const chartImage = breakEvenChart.toBase64Image();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text("Break-Even Chart", 105, 130, { align: 'center' });
        doc.addImage(chartImage, 'PNG', 14, 135, 180, 90);

        // Watermark
        const watermarkText = "Ajayds.com";
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150);
        const textWidth = doc.getTextWidth(watermarkText);
        const centerX = (doc.internal.pageSize.getWidth() / 2) - (textWidth / 2);
        doc.textWithLink(watermarkText, centerX, 285, { url: "https://ajayds.com/" });

        // --- Save PDF --- //
        doc.save("break-even-analysis-report.pdf");
    }

    init();
});