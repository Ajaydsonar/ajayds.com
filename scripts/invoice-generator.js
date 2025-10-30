/**
 * Free Invoice Generator
 *
 * This script handles the functionality of the invoice generator page,
 * including template loading, live preview updates, line item management,
 * calculations, and PDF generation.
 *
 * @author Ajay Dharaj Sonar
 * @version 1.0.0
 * @license MIT
 */

// Initialize line items array
let lineItems = [];
let signatureDataURL = localStorage.getItem('invoiceSignature') || ''; // Load signature from local storage

// Set today's date on load
window.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoiceDate').value = today;

    // Set due date to 30 days from today
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    document.getElementById('dueDate').value = dueDate.toISOString().split('T')[0];

    // Generate initial invoice number
    document.getElementById('invoiceNumber').value = 'INV-' + Math.floor(1000 + Math.random() * 9000);

    // Add initial line item
    addLineItem();
    loadSignature(); // Load signature on DOMContentLoaded
    updatePreview();

    // Event listener for signature upload
    document.getElementById('signatureUpload').addEventListener('change', handleSignatureUpload);

    // Apply stored signature field visibility
    const signatureInputContainer = document.getElementById('signatureInputContainer');
    const toggleSignatureBtn = document.getElementById('toggleSignatureBtn');
    const signatureVisible = localStorage.getItem('signatureVisible');

    if (signatureVisible === 'false') {
        signatureInputContainer.style.display = 'none';
        toggleSignatureBtn.textContent = 'Show Signature';
    } else {
        signatureInputContainer.style.display = 'block';
        toggleSignatureBtn.textContent = 'Hide Signature';
    }
});

/**
 * Toggles the visibility of the signature input field and saves the state to local storage.
 */
function toggleSignatureField() {
    const signatureInputContainer = document.getElementById('signatureInputContainer');
    const toggleSignatureBtn = document.getElementById('toggleSignatureBtn');

    if (signatureInputContainer.style.display === 'none') {
        signatureInputContainer.style.display = 'block';
        toggleSignatureBtn.textContent = 'Hide Signature';
        localStorage.setItem('signatureVisible', 'true');
    } else {
        signatureInputContainer.style.display = 'none';
        toggleSignatureBtn.textContent = 'Show Signature';
        localStorage.setItem('signatureVisible', 'false');
    }
    updatePreview(); // Update preview to reflect visibility change
}

// Template data
const templates = {
    consulting: {
        business: {
            name: 'ABC Consulting Group',
            address: '123 Business Ave',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            phone: '(555) 123-4567',
            email: 'info@abcconsulting.com'
        },
        client: {
            name: 'Client Company LLC',
            address: '456 Client Street',
            city: 'Boston',
            state: 'MA',
            zip: '02101',
            email: 'billing@clientco.com'
        },
        items: [
            { description: 'Strategy Consultation (10 hours)', quantity: 1, rate: 1500 },
            { description: 'Business Analysis Report', quantity: 1, rate: 800 },
            { description: 'Implementation Plan', quantity: 1, rate: 600 }
        ],
        taxRate: 8.5,
        notes: 'Payment is due within 30 days. Thank you for your business!'
    },
    retail: {
        business: {
            name: 'Main Street Retail Store',
            address: '789 Main Street',
            city: 'Chicago',
            state: 'IL',
            zip: '60601',
            phone: '(555) 987-6543',
            email: 'sales@mainstreetstore.com'
        },
        client: {
            name: 'John Smith',
            address: '321 Customer Lane',
            city: 'Chicago',
            state: 'IL',
            zip: '60602',
            email: 'john.smith@email.com'
        },
        items: [
            { description: 'Product Item #1001', quantity: 5, rate: 29.99 },
            { description: 'Product Item #1002', quantity: 3, rate: 49.99 },
            { description: 'Product Item #1003', quantity: 2, rate: 79.99 }
        ],
        taxRate: 10.25,
        notes: 'All sales are final. Returns accepted within 30 days with receipt.'
    },
    freelance: {
        business: {
            name: 'Creative Designs by Jane',
            address: '555 Design Plaza',
            city: 'Los Angeles',
            state: 'CA',
            zip: '90001',
            phone: '(555) 234-5678',
            email: 'jane@creativedesigns.com'
        },
        client: {
            name: 'Tech Startup Inc',
            address: '100 Innovation Drive',
            city: 'San Francisco',
            state: 'CA',
            zip: '94101',
            email: 'accounts@techstartup.com'
        },
        items: [
            { description: 'Logo Design & Branding Package', quantity: 1, rate: 1200 },
            { description: 'Website Mockups (5 pages)', quantity: 1, rate: 800 },
            { description: 'Social Media Graphics Package', quantity: 1, rate: 400 }
        ],
        taxRate: 9.5,
        notes: '50% deposit paid. Remaining balance due upon project completion. Payment via bank transfer or PayPal.'
    },
    service: {
        business: {
            name: 'Premier Services LLC',
            address: '888 Service Road',
            city: 'Houston',
            state: 'TX',
            zip: '77001',
            phone: '(555) 345-6789',
            email: 'billing@premierservices.com'
        },
        client: {
            name: 'Property Management Co',
            address: '222 Property Lane',
            city: 'Austin',
            state: 'TX',
            zip: '78701',
            email: 'finance@propertymanage.com'
        },
        items: [
            { description: 'Monthly Maintenance Service', quantity: 1, rate: 500 },
            { description: 'Emergency Repair - HVAC', quantity: 3, rate: 150 },
            { description: 'Parts & Materials', quantity: 1, rate: 250 }
        ],
        taxRate: 8.25,
        notes: 'Net 30. Late payments subject to 1.5% monthly interest. Thank you for choosing Premier Services!'
    }
};

// Load template function
function loadTemplate(templateName) {
    const template = templates[templateName];
    if (!template) return;

    // Load business info
    document.getElementById('businessName').value = template.business.name;
    document.getElementById('businessAddress').value = template.business.address;
    document.getElementById('businessCity').value = template.business.city;
    document.getElementById('businessState').value = template.business.state;
    document.getElementById('businessZip').value = template.business.zip;
    document.getElementById('businessPhone').value = template.business.phone;
    document.getElementById('businessEmail').value = template.business.email;

    // Load client info
    document.getElementById('clientName').value = template.client.name;
    document.getElementById('clientAddress').value = template.client.address;
    document.getElementById('clientCity').value = template.client.city;
    document.getElementById('clientState').value = template.client.state;
    document.getElementById('clientZip').value = template.client.zip;
    document.getElementById('clientEmail').value = template.client.email;

    // Load line items
    lineItems = [...template.items];
    renderLineItems();

    // Load tax rate and notes
    document.getElementById('taxRate').value = template.taxRate;
    document.getElementById('notes').value = template.notes;

    calculateTotals();
    updatePreview();
}

// Clear form function
function clearForm() {
    // Clear business info
    document.getElementById('businessName').value = '';
    document.getElementById('businessAddress').value = '';
    document.getElementById('businessCity').value = '';
    document.getElementById('businessState').value = '';
    document.getElementById('businessZip').value = '';
    document.getElementById('businessPhone').value = '';
    document.getElementById('businessEmail').value = '';

    // Clear client info
    document.getElementById('clientName').value = '';
    document.getElementById('clientAddress').value = '';
    document.getElementById('clientCity').value = '';
    document.getElementById('clientState').value = '';
    document.getElementById('clientZip').value = '';
    document.getElementById('clientEmail').value = '';

    // Reset line items
    lineItems = [];
    addLineItem();

    // Reset tax and notes
    document.getElementById('taxRate').value = 0;
    document.getElementById('notes').value = '';

    calculateTotals();
    updatePreview();
}

// Add line item
function addLineItem() {
    lineItems.push({ description: '', quantity: 1, rate: 0 });
    renderLineItems();
}

// Remove line item
function removeLineItem(index) {
    lineItems.splice(index, 1);
    if (lineItems.length === 0) {
        addLineItem();
    }
    renderLineItems();
}

// Update line item
function updateLineItem(index, field, value) {
    if (field === 'quantity' || field === 'rate') {
        lineItems[index][field] = parseFloat(value) || 0;
    } else {
        lineItems[index][field] = value;
    }
    calculateTotals();
    updateLineAmount(index);
    updatePreview();
}

// Update line amount display
function updateLineAmount(index) {
    const amount = lineItems[index].quantity * lineItems[index].rate;
    document.getElementById(`amount-${index}`).textContent = '$' + amount.toFixed(2);
}

// Render line items
function renderLineItems() {
    const tbody = document.getElementById('lineItemsTable');
    tbody.innerHTML = lineItems.map((item, index) => `
        <tr class="border-b hover:bg-gray-50">
            <td class="px-2 py-2">
                <input type="text" value="${item.description}" 
                    placeholder="Item description" 
                    class="w-full border border-gray-300 p-1.5 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    onchange="updateLineItem(${index}, 'description', this.value)">
            </td>
            <td class="px-2 py-2">
                <input type="number" value="${item.quantity}" min="0" step="0.01"
                    class="w-full border border-gray-300 p-1.5 rounded text-right focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    onchange="updateLineItem(${index}, 'quantity', this.value)">
            </td>
            <td class="px-2 py-2">
                <input type="number" value="${item.rate}" min="0" step="0.01"
                    class="w-full border border-gray-300 p-1.5 rounded text-right focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    onchange="updateLineItem(${index}, 'rate', this.value)">
            </td>
            <td class="px-2 py-2 text-right font-semibold" id="amount-${index}">
                $${(item.quantity * item.rate).toFixed(2)}
            </td>
            <td class="px-2 py-2 text-center">
                <button onclick="removeLineItem(${index})" 
                    class="text-red-500 hover:bg-red-100 rounded px-2 py-1 font-bold">✕</button>
            </td>
        </tr>
    `).join('');

    calculateTotals();
    updatePreview();
}

// Calculate totals
function calculateTotals() {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    document.getElementById('preview-subtotal').textContent = '$' + subtotal.toFixed(2);
    document.getElementById('preview-taxAmount').textContent = '$' + taxAmount.toFixed(2);
    document.getElementById('preview-total').textContent = '$' + total.toFixed(2);
}

// Update live preview
function updatePreview() {
    // Business info
    const businessName = document.getElementById('businessName').value || 'Your Business Name';
    const businessAddress = document.getElementById('businessAddress').value;
    const businessCity = document.getElementById('businessCity').value;
    const businessState = document.getElementById('businessState').value;
    const businessZip = document.getElementById('businessZip').value;
    const businessPhone = document.getElementById('businessPhone').value;
    const businessEmail = document.getElementById('businessEmail').value;

    document.getElementById('preview-businessName').textContent = businessName;
    document.getElementById('preview-businessAddress').textContent = businessAddress;

    let cityState = '';
    if (businessCity || businessState || businessZip) {
        cityState = `${businessCity}${businessCity && (businessState || businessZip) ? ', ' : ''}${businessState} ${businessZip}`.trim();
    }
    document.getElementById('preview-businessCityState').textContent = cityState;
    document.getElementById('preview-businessPhone').textContent = businessPhone;
    document.getElementById('preview-businessEmail').textContent = businessEmail;

    // Invoice details
    document.getElementById('preview-invoiceNumber').textContent = document.getElementById('invoiceNumber').value || 'INV-0000';
    document.getElementById('preview-invoiceDate').textContent = document.getElementById('invoiceDate').value || '-';
    document.getElementById('preview-dueDate').textContent = document.getElementById('dueDate').value || '-';

    // Client info
    const clientName = document.getElementById('clientName').value || 'Client Name';
    const clientAddress = document.getElementById('clientAddress').value;
    const clientCity = document.getElementById('clientCity').value;
    const clientState = document.getElementById('clientState').value;
    const clientZip = document.getElementById('clientZip').value;
    const clientEmail = document.getElementById('clientEmail').value;

    document.getElementById('preview-clientName').textContent = clientName;
    document.getElementById('preview-clientAddress').textContent = clientAddress;

    let clientCityState = '';
    if (clientCity || clientState || clientZip) {
        clientCityState = `${clientCity}${clientCity && (clientState || clientZip) ? ', ' : ''}${clientState} ${clientZip}`.trim();
    }
    document.getElementById('preview-clientCityState').textContent = clientCityState;
    document.getElementById('preview-clientEmail').textContent = clientEmail;

    // Line items
    const previewItems = document.getElementById('preview-items');
    if (lineItems.length === 0 || lineItems.every(item => !item.description && item.quantity === 0 && item.rate === 0)) {
        previewItems.innerHTML = '<tr><td colspan="4" class="py-8 text-center text-gray-400 italic">No items added yet</td></tr>';
    } else {
        previewItems.innerHTML = lineItems.map(item => {
            if (!item.description && item.quantity === 0 && item.rate === 0) return '';
            return `
                <tr class="hover:bg-gray-50">
                    <td class="py-3 px-3 text-gray-700">${item.description || 'Unnamed Item'}</td>
                    <td class="py-3 px-3 text-center text-gray-700">${item.quantity}</td>
                    <td class="py-3 px-3 text-right text-gray-700">$${item.rate.toFixed(2)}</td>
                    <td class="py-3 px-3 text-right text-gray-800 font-semibold">$${(item.quantity * item.rate).toFixed(2)}</td>
                </tr>
            `;
        }).join('');
    }

    // Totals
    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    document.getElementById('preview-subtotal').textContent = '$' + subtotal.toFixed(2);
    document.getElementById('preview-taxRate').textContent = taxRate.toFixed(1);
    document.getElementById('preview-taxAmount').textContent = '$' + taxAmount.toFixed(2);
    document.getElementById('preview-total').textContent = '$' + total.toFixed(2);

    // Signature Preview
    const previewSignature = document.getElementById('preview-signature');
    const previewSignatureSection = document.getElementById('preview-signature-section');
    const signatureVisible = localStorage.getItem('signatureVisible');

    if (signatureDataURL && signatureVisible !== 'false') {
        previewSignature.src = signatureDataURL;
        previewSignatureSection.style.display = 'block';
    } else {
        previewSignature.src = '';
        previewSignatureSection.style.display = 'none';
    }

    // Notes
    const notes = document.getElementById('notes').value;
    const notesSection = document.getElementById('preview-notes-section');
    if (notes) {
        notesSection.style.display = 'block';
        document.getElementById('preview-notes').textContent = notes;
    } else {
        notesSection.style.display = 'none';
    }
}

/**
 * Handles signature file upload.
 * @param {Event} event - The change event from the file input.
 */
function handleSignatureUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            signatureDataURL = e.target.result;
            localStorage.setItem('invoiceSignature', signatureDataURL);
            updatePreview();
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Loads signature from local storage and displays it.
 */
function loadSignature() {
    const storedSignature = localStorage.getItem('invoiceSignature');
    if (storedSignature) {
        signatureDataURL = storedSignature;
        document.getElementById('preview-signature').src = signatureDataURL;
        document.getElementById('preview-signature-section').style.display = 'block';
    } else {
        document.getElementById('preview-signature').src = ''; // Clear src if no signature
        document.getElementById('preview-signature-section').style.display = 'none';
    }
}

/**
 * Clears the signature from preview and local storage.
 */
function clearSignature() {
    signatureDataURL = '';
    localStorage.removeItem('invoiceSignature');
    document.getElementById('signatureUpload').value = ''; // Clear file input
    updatePreview();
}

// Download PDF
function downloadPDF() {
    // Validate required fields
    const businessName = document.getElementById('businessName').value;
    const clientName = document.getElementById('clientName').value;
    const invoiceNumber = document.getElementById('invoiceNumber').value;

    if (!businessName || !clientName || !invoiceNumber) {
        alert('Please fill in Business Name, Client Name, and Invoice Number before downloading.');
        return;
    }

    if (lineItems.length === 0 || lineItems.every(item => !item.description)) {
        alert('Please add at least one line item with a description.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Header - Business Info
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(businessName, 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let y = 27;

    const businessAddress = document.getElementById('businessAddress').value;
    const businessCity = document.getElementById('businessCity').value;
    const businessState = document.getElementById('businessState').value;
    const businessZip = document.getElementById('businessZip').value;
    const businessPhone = document.getElementById('businessPhone').value;
    const businessEmail = document.getElementById('businessEmail').value;

    if (businessAddress) {
        doc.text(businessAddress, 14, y);
        y += 5;
    }
    if (businessCity || businessState || businessZip) {
        doc.text(`${businessCity}, ${businessState} ${businessZip}`.trim(), 14, y);
        y += 5;
    }
    if (businessPhone) {
        doc.text(businessPhone, 14, y);
        y += 5;
    }
    if (businessEmail) {
        doc.text(businessEmail, 14, y);
        y += 5;
    }

    // Invoice Title and Number
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 163, 74);
    doc.text('INVOICE', 140, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice #: ${invoiceNumber}`, 140, 28);
    doc.text(`Date: ${document.getElementById('invoiceDate').value}`, 140, 33);
    doc.text(`Due Date: ${document.getElementById('dueDate').value}`, 140, 38);

    // Bill To Section
    y = 55;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 14, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(clientName, 14, y);
    y += 5;

    const clientAddress = document.getElementById('clientAddress').value;
    const clientCity = document.getElementById('clientCity').value;
    const clientState = document.getElementById('clientState').value;
    const clientZip = document.getElementById('clientZip').value;
    const clientEmail = document.getElementById('clientEmail').value;

    if (clientAddress) {
        doc.text(clientAddress, 14, y);
        y += 5;
    }
    if (clientCity || clientState || clientZip) {
        doc.text(`${clientCity}, ${clientState} ${clientZip}`.trim(), 14, y);
        y += 5;
    }
    if (clientEmail) {
        doc.text(clientEmail, 14, y);
        y += 5;
    }

    // Line Items Table
    y += 10;
    const tableData = lineItems
        .filter(item => item.description)
        .map(item => [
            item.description,
            item.quantity.toString(),
            '$' + item.rate.toFixed(2),
            '$' + (item.quantity * item.rate).toFixed(2)
        ]);

    doc.autoTable({
        startY: y,
        head: [['Description', 'Quantity', 'Rate', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [22, 163, 74],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 10
        },
        columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right' }
        }
    });

    // Totals
    let finalY = doc.lastAutoTable.finalY + 10;
    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    doc.setFontSize(10);
    doc.text('Subtotal:', 140, finalY);
    doc.text('$' + subtotal.toFixed(2), 190, finalY, { align: 'right' });

    doc.text(`Tax (${taxRate}%):`, 140, finalY + 6);
    doc.text('$' + taxAmount.toFixed(2), 190, finalY + 6, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', 140, finalY + 14);
    doc.text('$' + total.toFixed(2), 190, finalY + 14, { align: 'right' });

    // Signature
    if (signatureDataURL) {
        finalY += 25; // Add some space
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Authorized Signature:', 14, finalY);
        doc.addImage(signatureDataURL, 'PNG', 14, finalY + 5, 80, 30); // Adjust position and size as needed
        finalY += 40; // Adjust Y position after adding image
    }

    // Notes
    const notes = document.getElementById('notes').value;
    if (notes) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const notesY = finalY + 25;
        doc.text('Notes:', 14, notesY);
        const splitNotes = doc.splitTextToSize(notes, 180);
        doc.text(splitNotes, 14, notesY + 5);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);

    // Watermark
    const watermarkText = 'Invoice created with Ajayds.com';
    const textWidth = doc.getTextWidth(watermarkText);
    const centerX = (doc.internal.pageSize.getWidth() / 2) - (textWidth / 2);
    doc.textWithLink(watermarkText, centerX, pageHeight - 15, { url: 'https://ajayds.com' });
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.3);
    doc.line(centerX, pageHeight - 13.5, centerX + textWidth, pageHeight - 13.5);

    // Save
    doc.save(`Invoice-${invoiceNumber}.pdf`);
}