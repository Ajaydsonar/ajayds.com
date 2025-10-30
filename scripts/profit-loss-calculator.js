const revenueList = document.getElementById("revenueList");
const expenseList = document.getElementById("expenseList");
const summaryTable = document.getElementById("summaryTable");

let revenues = [
    { category: "Product Sales", amount: 8000 },
    { category: "Service Income", amount: 3000 },
    { category: "Affiliate Revenue", amount: 1500 }
];

let expenses = [
    { category: "Rent", amount: 2000 },
    { category: "Salaries", amount: 2500 },
    { category: "Marketing", amount: 1000 }
];

const breakdownCtx = document.getElementById("breakdownChart").getContext("2d");
const distributionCtx = document.getElementById("distributionChart").getContext("2d");
const profitBreakdownCtx = document.getElementById("profitBreakdownChart").getContext("2d");

const breakdownChart = new Chart(breakdownCtx, {
    type: "bar",
    data: {
        labels: ["Revenue", "Expenses", "Net Profit"],
        datasets: [{
            label: "Amount ($)",
            data: [0, 0, 0],
            backgroundColor: ["#16a34a", "#ef4444", "#10b981"]
        }]
    },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
});

const distributionChart = new Chart(distributionCtx, {
    type: "doughnut",
    data: {
        labels: [], datasets: [{
            data: [], backgroundColor: [
                "#b91c1c",
                "#991b1b",
                "#7f1d1d",
                "#dc2626",
                "#ef4444",
                "#f87171",
                "#fecaca",
                "#fee2e2",
                "#fca5a5",
            ]
        }]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
});

const profitBreakdownChart = new Chart(profitBreakdownCtx, {
    type: "pie",
    data: {
        labels: [], datasets: [{
            data: [], backgroundColor: [
                "#15803d",
                "#166534",
                "#dcfce7",
                "#22c55e",
                "#16a34a",
                "#bbf7d0",
                "#4ade80",
                "#86efac",
                "#14532d",
            ]
        }]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
});

function renderInputs() {
    revenueList.innerHTML = revenues.map((r, i) => `
<div class="flex items-center gap-2 bg-green-50 p-2 rounded">
<input type="text" value="${r.category}" placeholder="Category"
class="w-[55%] border p-1.5 rounded "
oninput="updateRevenue(${i}, 'category', this.value)">
<input type="number" value="${r.amount}"
class="w-[25%] border p-1.5 rounded  text-right"
oninput="updateRevenue(${i}, 'amount', this.value)">
<button onclick="removeRevenue(${i})"
class="text-red-500 hover:bg-red-200 rounded-sm font-bold text-sm p-2 ml-4 font-semibold ">✕</button>
</div>`).join("");

    expenseList.innerHTML = expenses.map((e, i) => `
<div class="flex items-center gap-2 bg-red-50 p-2 rounded">
<input type="text" value="${e.category}" placeholder="Category"
class="w-[55%] border p-1.5 rounded "
oninput="updateExpense(${i}, 'category', this.value)">
<input type="number" value="${e.amount}"
class="w-[25%] border p-1.5 rounded  text-right"
oninput="updateExpense(${i}, 'amount', this.value)">
<button onclick="removeExpense(${i})"
class="text-red-500 hover:bg-red-200 rounded-sm font-bold text-sm p-2 ml-4 font-semibold">✕</button>
</div>`).join("");


    updateCharts();
}

function updateRevenue(i, key, value) {
    revenues[i][key] = key === "amount" ? parseFloat(value) || 0 : value;
    updateCharts();
}

function updateExpense(i, key, value) {
    expenses[i][key] = key === "amount" ? parseFloat(value) || 0 : value;
    updateCharts();
}

function removeRevenue(i) {
    revenues.splice(i, 1);
    renderInputs();
}

function removeExpense(i) {
    expenses.splice(i, 1);
    renderInputs();
}

document.getElementById("addRevenue").addEventListener("click", () => {
    revenues.push({ category: "", amount: 0 });
    renderInputs();
});

document.getElementById("addExpense").addEventListener("click", () => {
    expenses.push({ category: "", amount: 0 });
    renderInputs();
});

function updateCharts() {
    const totalRevenue = revenues.reduce((a, b) => a + (b.amount || 0), 0);
    const totalExpenses = expenses.reduce((a, b) => a + (b.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    breakdownChart.data.datasets[0].data = [totalRevenue, totalExpenses, netProfit];
    breakdownChart.update();

    distributionChart.data.labels = expenses.map(e => e.category || "Unnamed");
    distributionChart.data.datasets[0].data = expenses.map(e => e.amount);
    distributionChart.update();

    profitBreakdownChart.data.labels = revenues.map(r => r.category || "Unnamed");
    profitBreakdownChart.data.datasets[0].data = revenues.map(r => r.amount);
    profitBreakdownChart.update();

    document.getElementById("totalRevenue").textContent = `$${totalRevenue.toLocaleString()}`;
    document.getElementById("totalExpenses").textContent = `$${totalExpenses.toLocaleString()}`;
    document.getElementById("netProfit").textContent = `$${netProfit.toLocaleString()}`;

    summaryTable.innerHTML = `
${revenues.map(r => `<tr><td class="px-3 py-2 border-b text-gray-700">${r.category}</td><td class="text-right px-3 py-2 border-b text-green-700">$${r.amount}</td></tr>`).join("")}
${expenses.map(e => `<tr><td class="px-3 py-2 border-b text-gray-700">${e.category}</td><td class="text-right px-3 py-2 border-b text-red-700">$${e.amount}</td></tr>`).join("")}
`;
}

// Download PDF
document.getElementById("downloadPDF").addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Financial Summary", 14, 15);

    // Revenue Section
    let y = 30;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 163, 74); // Green color
    doc.text("REVENUE STREAMS", 14, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    revenues.forEach((r) => {
        doc.text(r.category || "Unnamed", 20, y);
        doc.text(`$${r.amount.toLocaleString()}`, 150, y, { align: "right" });
        y += 7;
    });

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 163, 74);
    doc.text("Total Revenue: " + document.getElementById("totalRevenue").innerText, 14, y);

    // Expense Section
    y += 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(239, 68, 68); // Red color
    doc.text("EXPENSE CATEGORIES", 14, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    expenses.forEach((e) => {
        doc.text(e.category || "Unnamed", 20, y);
        doc.text(`$${e.amount.toLocaleString()}`, 150, y, { align: "right" });
        y += 7;
    });

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(239, 68, 68);
    doc.text("Total Expenses: " + document.getElementById("totalExpenses").innerText, 14, y);

    // Net Profit
    y += 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129); // Emerald color
    doc.text("NET PROFIT: " + document.getElementById("netProfit").innerText, 14, y);

    // ===== ADDED PDF WATERMARK =====
    y += 20; // Add some space
    //   doc.setFontSize(10);
    //   doc.setFont("helvetica", "normal");
    //   doc.setTextColor(150, 150, 150); // Gray color

    const watermarkText = "Ajayds.com";
    // Calculate center position
    const textWidth = doc.getTextWidth(watermarkText);
    const centerX = (doc.internal.pageSize.getWidth() / 2) - (textWidth / 2);

    doc.textWithLink(watermarkText, centerX, y, { url: "https://ajayds.com" });
    // Draw underline (same width as text)
    const underlineY = y + 1.5; // a bit below the text baseline
    doc.setDrawColor(16, 185, 129); // same gray as text
    doc.setLineWidth(0.3); // thin line
    doc.line(centerX, underlineY, centerX + textWidth, underlineY);
    // ===============================


    doc.save("financial_summary.pdf");
});
renderInputs();
