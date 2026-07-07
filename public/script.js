// ========== Configuration ========== 
const API_BASE_URL = '/api';

// ========== State Management =========
let currentMasterData = null;
let currentMeasurementId = null;

// ========== Initialization =========
document.addEventListener('DOMContentLoaded', () => {
    setupTabNavigation();
    loadMasterData();
    setDefaultDates();
});

// ========== Tab Navigation =========
function setupTabNavigation() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabName = e.currentTarget.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('historyDate').value = today;
    document.getElementById('reportDate').value = today;
}

// ========== Master Data Loading =========
async function loadMasterData() {
    try {
        const response = await fetch(`${API_BASE_URL}/master-data`);
        if (!response.ok) throw new Error('Failed to load master data');
        
        const masterData = await response.json();
        const select = document.getElementById('partSelect');
        select.innerHTML = '<option value="">-- 部品を選択してください --</option>';

        masterData.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.item_name;
            select.appendChild(option);
        });

        // Add change event listener
        select.addEventListener('change', updateMasterDataInfo);
    } catch (error) {
        console.error('Error loading master data:', error);
        showMessage('マスターデータの読み込みに失敗しました', 'error', 'measurement');
    }
}

// ========== Master Data Display =========
async function updateMasterDataInfo() {
    const select = document.getElementById('partSelect');
    const selectedId = select.value;

    if (!selectedId) {
        document.getElementById('masterDataInfo').style.display = 'none';
        currentMasterData = null;
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/master-data/${selectedId}`);
        if (!response.ok) throw new Error('Failed to load master data');
        
        currentMasterData = await response.json();

        const standardValue = currentMasterData.standard_value;
        const tolerancePlus = currentMasterData.tolerance_plus;
        const toleranceMinus = currentMasterData.tolerance_minus;

        document.getElementById('standardValue').textContent = standardValue.toFixed(2);
        document.getElementById('toleranceRange').textContent = 
            `${(standardValue - toleranceMinus).toFixed(2)} ~ ${(standardValue + tolerancePlus).toFixed(2)}`;

        document.getElementById('masterDataInfo').style.display = 'block';
    } catch (error) {
        console.error('Error loading master data:', error);
        showMessage('マスターデータの読み込みに失敗しました', 'error', 'measurement');
    }
}

// ========== Measurement Recording =========
async function recordMeasurement() {
    const select = document.getElementById('partSelect');
    const measuredValue = parseFloat(document.getElementById('measuredValue').value);

    // Validation
    if (!select.value) {
        showMessage('部品を選択してください', 'error', 'measurement');
        return;
    }

    if (isNaN(measuredValue) || measuredValue < 0) {
        showMessage('正の数値を入力してください', 'error', 'measurement');
        return;
    }

    if (!currentMasterData) {
        showMessage('マスターデータが読み込まれていません', 'error', 'measurement');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/measurements/record`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                masterDataId: parseInt(select.value),
                measuredValue: measuredValue
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to record measurement');

        currentMeasurementId = result.measurement.id;
        displayResult(result);
        hideRetakeForm();
    } catch (error) {
        console.error('Error recording measurement:', error);
        showMessage('測定値の記録に失敗しました: ' + error.message, 'error', 'measurement');
    }
}

// ========== Result Display =========
function displayResult(result) {
    const resultContainer = document.getElementById('resultContainer');
    const resultBox = document.getElementById('resultBox');
    const resultText = document.getElementById('resultText');
    const resultDetails = document.getElementById('resultDetails');

    const judgment = result.judgment;
    const measuredValue = result.measurement.measured_value;
    const standardValue = result.masterData.standard_value;
    const itemName = result.masterData.item_name;
    const tolerancePlus = result.masterData.tolerance_plus;
    const toleranceMinus = result.masterData.tolerance_minus;

    // Update classes and styling
    resultBox.className = 'result-box ' + (judgment === 'OK' ? 'ok' : 'ng');

    // Update text
    resultText.textContent = judgment === 'OK' ? '✓ 合格' : '✗ 不合格';
    resultDetails.innerHTML = `
        <p><strong>部品名:</strong> ${itemName}</p>
        <p><strong>測定値:</strong> ${measuredValue.toFixed(2)} mm</p>
        <p><strong>基準値:</strong> ${standardValue.toFixed(2)} mm</p>
        <p><strong>許容範囲:</strong> ${(standardValue - toleranceMinus).toFixed(2)} ~ ${(standardValue + tolerancePlus).toFixed(2)} mm</p>
    `;

    resultContainer.style.display = 'block';
    document.getElementById('measuredValue').disabled = true;
    document.getElementById('partSelect').disabled = true;
}

// ========== Retake Functionality =========
function showRetakeForm() {
    document.getElementById('retakeContainer').style.display = 'block';
    document.getElementById('retakeMeasuredValue').focus();
}

function hideRetakeForm() {
    document.getElementById('retakeContainer').style.display = 'none';
    document.getElementById('retakeMeasuredValue').value = '';
}

function cancelRetake() {
    hideRetakeForm();
    resetForm();
}

async function recordRetakeMeasurement() {
    const select = document.getElementById('partSelect');
    const retakeMeasuredValue = parseFloat(document.getElementById('retakeMeasuredValue').value);

    if (isNaN(retakeMeasuredValue) || retakeMeasuredValue < 0) {
        showMessage('正の数値を入力してください', 'error', 'measurement');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/measurements/retake`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                masterDataId: parseInt(select.value),
                measuredValue: retakeMeasuredValue,
                originalMeasurementId: currentMeasurementId
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to record retake');

        displayResult(result);
        hideRetakeForm();
        showMessage('再測定を記録しました', 'success', 'measurement');
    } catch (error) {
        console.error('Error recording retake:', error);
        showMessage('再測定の記録に失敗しました: ' + error.message, 'error', 'measurement');
    }
}

function resetForm() {
    document.getElementById('measuredValue').value = '';
    document.getElementById('measuredValue').disabled = false;
    document.getElementById('partSelect').disabled = false;
    document.getElementById('partSelect').value = '';
    document.getElementById('masterDataInfo').style.display = 'none';
    document.getElementById('resultContainer').style.display = 'none';
    document.getElementById('retakeContainer').style.display = 'none';
    hideRetakeForm();
    currentMasterData = null;
    currentMeasurementId = null;
}

// ========== History Loading =========
async function loadHistory() {
    const date = document.getElementById('historyDate').value;

    if (!date) {
        showMessage('日付を選択してください', 'error', 'history');
        return;
    }

    try {
        // Fetch measurements
        const measurementsResponse = await fetch(`${API_BASE_URL}/measurements/date/${date}`);
        if (!measurementsResponse.ok) throw new Error('Failed to fetch measurements');
        const measurements = await measurementsResponse.json();

        // Fetch statistics
        const statsResponse = await fetch(`${API_BASE_URL}/reports/stats/${date}`);
        if (!statsResponse.ok) throw new Error('Failed to fetch statistics');
        const stats = await statsResponse.json();

        displayHistory(measurements, stats);
    } catch (error) {
        console.error('Error loading history:', error);
        showMessage('履歴の読み込みに失敗しました', 'error', 'history');
    }
}

// ========== History Display =========
function displayHistory(measurements, stats) {
    const tableBody = document.getElementById('historyTableBody');
    const table = document.getElementById('historyTable');
    const tableWrapper = document.getElementById('tableWrapper');
    const statsContainer = document.getElementById('statisticsContainer');
    const noDataMessage = document.getElementById('noDataMessage');

    // Hide all initially
    tableWrapper.style.display = 'none';
    statsContainer.style.display = 'none';
    noDataMessage.style.display = 'none';

    if (measurements.length === 0) {
        noDataMessage.style.display = 'block';
        return;
    }

    // Update statistics
    document.getElementById('statTotal').textContent = stats.total || 0;
    document.getElementById('statOK').textContent = stats.ok_count || 0;
    document.getElementById('statNG').textContent = stats.ng_count || 0;
    document.getElementById('statRetake').textContent = stats.retake_count || 0;
    statsContainer.style.display = 'block';

    // Clear and update table
    tableBody.innerHTML = '';
    measurements.forEach(m => {
        const row = document.createElement('tr');
        const timestamp = new Date(m.measurement_date).toLocaleString('ja-JP');
        const retakeText = m.is_retake ? 'はい' : 'いいえ';
        const toleranceRange = `${(m.standard_value - m.tolerance_minus).toFixed(2)} ~ ${(m.standard_value + m.tolerance_plus).toFixed(2)}`;

        row.innerHTML = `
            <td>${m.item_name || 'N/A'}</td>
            <td><strong>${m.measured_value.toFixed(2)}</strong></td>
            <td>${m.standard_value.toFixed(2)}</td>
            <td>${toleranceRange}</td>
            <td><span class="judgment ${m.judgment}">${m.judgment}</span></td>
            <td>${retakeText}</td>
            <td>${timestamp}</td>
        `;
        tableBody.appendChild(row);
    });

    tableWrapper.style.display = 'block';
}

// ========== Report Generation =========
async function downloadReport() {
    const date = document.getElementById('reportDate').value;

    if (!date) {
        showMessage('日付を選択してください', 'error', 'report');
        return;
    }

    try {
        window.location.href = `${API_BASE_URL}/reports/daily/${date}`;
        showMessage('PDFをダウンロード中...', 'info', 'report');
    } catch (error) {
        console.error('Error downloading report:', error);
        showMessage('PDFのダウンロードに失敗しました', 'error', 'report');
    }
}

// ========== Report Preview =========
async function previewReport() {
    const date = document.getElementById('reportDate').value;

    if (!date) {
        showMessage('日付を選択してください', 'error', 'report');
        return;
    }

    try {
        // Fetch measurements
        const measurementsResponse = await fetch(`${API_BASE_URL}/measurements/date/${date}`);
        if (!measurementsResponse.ok) throw new Error('Failed to fetch measurements');
        const measurements = await measurementsResponse.json();

        // Fetch statistics
        const statsResponse = await fetch(`${API_BASE_URL}/reports/stats/${date}`);
        if (!statsResponse.ok) throw new Error('Failed to fetch statistics');
        const stats = await statsResponse.json();

        // Generate preview
        const previewHTML = generatePreviewHTML(date, measurements, stats);
        document.getElementById('previewContent').innerHTML = previewHTML;
        document.getElementById('reportPreview').style.display = 'block';
    } catch (error) {
        console.error('Error previewing report:', error);
        showMessage('プレビューの読み込みに失敗しました', 'error', 'report');
    }
}

// ========== Preview HTML Generation =========
function generatePreviewHTML(date, measurements, stats) {
    let html = `
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="font-size: 24px; margin-bottom: 10px;">📄 日次測定報告書</h2>
            <p style="color: #999;">報告日: <strong>${date}</strong></p>
        </div>
        
        <h3 style="margin-top: 30px; margin-bottom: 15px;">📊 統計情報</h3>
        <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse;">
            <tr>
                <td style="border: 1px solid #ddd; padding: 12px; font-weight: 600; width: 50%;">合計測定数</td>
                <td style="border: 1px solid #ddd; padding: 12px; font-weight: 700; font-size: 18px;">${stats.total || 0}</td>
            </tr>
            <tr style="background: #f9f9f9;">
                <td style="border: 1px solid #ddd; padding: 12px; font-weight: 600;">OK件数</td>
                <td style="border: 1px solid #ddd; padding: 12px; font-weight: 700; color: #28a745; font-size: 18px;">${stats.ok_count || 0}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #ddd; padding: 12px; font-weight: 600;">NG件数</td>
                <td style="border: 1px solid #ddd; padding: 12px; font-weight: 700; color: #dc3545; font-size: 18px;">${stats.ng_count || 0}</td>
            </tr>
            <tr style="background: #f9f9f9;">
                <td style="border: 1px solid #ddd; padding: 12px; font-weight: 600;">再測定件数</td>
                <td style="border: 1px solid #ddd; padding: 12px; font-weight: 700; color: #ffc107; font-size: 18px;">${stats.retake_count || 0}</td>
            </tr>
        </table>
        
        <h3 style="margin-top: 30px; margin-bottom: 15px;">📋 測定詳細</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #667eea; color: white;">
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: 600;">部品名</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: 600;">測定値 (mm)</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: 600;">基準値 (mm)</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: 600;">許容範囲 (mm)</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: 600;">判定</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: 600;">再測定</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: 600;">測定時刻</th>
                </tr>
            </thead>
            <tbody>
    `;

    measurements.forEach((m, index) => {
        const timestamp = new Date(m.measurement_date).toLocaleString('ja-JP');
        const retakeText = m.is_retake ? 'はい' : 'いいえ';
        const toleranceRange = `${(m.standard_value - m.tolerance_minus).toFixed(2)} ~ ${(m.standard_value + m.tolerance_plus).toFixed(2)}`;
        const judgmentColor = m.judgment === 'OK' ? '#28a745' : '#dc3545';
        const bgColor = index % 2 === 0 ? 'white' : '#f9f9f9';

        html += `
            <tr style="background: ${bgColor};">
                <td style="border: 1px solid #ddd; padding: 12px;">${m.item_name}</td>
                <td style="border: 1px solid #ddd; padding: 12px; font-weight: 600;">${m.measured_value.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${m.standard_value.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${toleranceRange}</td>
                <td style="border: 1px solid #ddd; padding: 12px; color: ${judgmentColor}; font-weight: 600;">${m.judgment}</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${retakeText}</td>
                <td style="border: 1px solid #ddd; padding: 12px; font-size: 12px;">${timestamp}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
        <div style="text-align: right; margin-top: 30px; color: #999; font-size: 12px;">
            <p>生成日時: ${new Date().toLocaleString('ja-JP')}</p>
        </div>
    `;

    return html;
}

// ========== Message Display =========
function showMessage(message, type, section = null) {
    let messageElement;
    
    if (section) {
        messageElement = document.getElementById(`${section}Message`);
    }
    
    if (!messageElement) {
        messageElement = document.getElementById('reportMessage');
    }

    messageElement.textContent = message;
    messageElement.className = `message-box ${type}`;
    messageElement.style.display = 'block';

    // Auto hide after 4 seconds
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 4000);
}

// ========== Utility Functions =========
function formatDate(date) {
    return new Date(date).toLocaleDateString('ja-JP');
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString('ja-JP');
}