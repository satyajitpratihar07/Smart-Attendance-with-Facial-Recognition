// =================================
// Admin Export Module
// Excel, PDF, and Copy to Clipboard
// =================================

// Get filtered records (same logic as loadAttendanceRecords)
function getFilteredRecords() {
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];

    // Get filter values
    const classFilter = document.getElementById('classFilter').value;
    const dateFrom = document.getElementById('dateFromFilter').value;
    const dateTo = document.getElementById('dateToFilter').value;
    const searchQuery = document.getElementById('studentSearch').value.toLowerCase();

    // Apply filters
    let filteredRecords = attendance.filter(record => {
        if (classFilter && record.class !== classFilter) return false;
        if (dateFrom && record.date < dateFrom) return false;
        if (dateTo && record.date > dateTo) return false;

        if (searchQuery) {
            const nameMatch = record.studentName.toLowerCase().includes(searchQuery);
            const rollMatch = record.rollNumber.toLowerCase().includes(searchQuery);
            if (!nameMatch && !rollMatch) return false;
        }

        return true;
    });

    // Sort by date and time
    filteredRecords.sort((a, b) => {
        if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
        }
        return a.time.localeCompare(b.time);
    });

    return filteredRecords;
}

// Export to Excel
function exportToExcel() {
    const records = getFilteredRecords();

    if (records.length === 0) {
        showToast('No records to export', 'error');
        return;
    }

    // Prepare data for Excel
    const data = records.map(record => ({
        'Date': record.date,
        'Name': record.studentName,
        'Roll Number': record.rollNumber,
        'College ID': record.collegeId,
        'Class': record.class,
        'Time': record.time
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

    // Generate filename
    const date = new Date().toISOString().split('T')[0];
    const filename = `attendance_${date}.xlsx`;

    // Download
    XLSX.writeFile(wb, filename);

    showToast('Excel file downloaded successfully', 'success');
}

// Export to PDF
function exportToPDF() {
    const records = getFilteredRecords();

    if (records.length === 0) {
        showToast('No records to export', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text('Attendance Report', 14, 20);

    // Add date
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    // Get filter info
    const classFilter = document.getElementById('classFilter').value;
    const dateFrom = document.getElementById('dateFromFilter').value;
    const dateTo = document.getElementById('dateToFilter').value;

    let filterText = 'Filters: ';
    if (classFilter) filterText += `Class: ${classFilter} | `;
    if (dateFrom) filterText += `From: ${dateFrom} | `;
    if (dateTo) filterText += `To: ${dateTo}`;
    if (filterText !== 'Filters: ') {
        doc.setFontSize(9);
        doc.text(filterText, 14, 34);
    }

    // Prepare table data
    const tableData = records.map(record => [
        record.date,
        record.studentName,
        record.rollNumber,
        record.collegeId,
        record.class,
        record.time
    ]);

    // Add table
    doc.autoTable({
        startY: filterText !== 'Filters: ' ? 38 : 32,
        head: [['Date', 'Name', 'Roll Number', 'College ID', 'Class', 'Time']],
        body: tableData,
        theme: 'grid',
        styles: {
            fontSize: 8,
            cellPadding: 2
        },
        headStyles: {
            fillColor: [102, 126, 234],
            textColor: 255,
            fontStyle: 'bold'
        }
    });

    // Generate filename
    const date = new Date().toISOString().split('T')[0];
    const filename = `attendance_${date}.pdf`;

    // Download
    doc.save(filename);

    showToast('PDF file downloaded successfully', 'success');
}

// Copy to clipboard
function copyToClipboard() {
    const records = getFilteredRecords();

    if (records.length === 0) {
        showToast('No records to copy', 'error');
        return;
    }

    // Create tab-separated text
    let text = 'Date\tName\tRoll Number\tCollege ID\tClass\tTime\n';

    records.forEach(record => {
        text += `${record.date}\t${record.studentName}\t${record.rollNumber}\t${record.collegeId}\t${record.class}\t${record.time}\n`;
    });

    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
        showToast('Records copied to clipboard', 'success');
    }).catch(err => {
        console.error('Error copying to clipboard:', err);
        showToast('Error copying to clipboard', 'error');
    });
}

// Setup event listeners
document.addEventListener('DOMContentLoaded', () => {
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const copyRecordsBtn = document.getElementById('copyRecordsBtn');

    if (exportExcelBtn) exportExcelBtn.addEventListener('click', exportToExcel);
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportToPDF);
    if (copyRecordsBtn) copyRecordsBtn.addEventListener('click', copyToClipboard);
});

// Export functions
window.exportToExcel = exportToExcel;
window.exportToPDF = exportToPDF;
window.copyToClipboard = copyToClipboard;
