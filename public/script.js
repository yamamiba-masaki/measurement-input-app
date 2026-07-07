// ========== Configuration ==========
const API_BASE_URL = '/api';

// ========== State Management =========
let currentPart = null;
let currentLocations = [];
let currentLocation = null;
let currentMeasurementId = null;
let completionStatus = {};

// ========== Initialization =========
document.addEventListener('DOMContentLoaded', () => {
    setupTabNavigation();
    loadParts();
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
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('historyDate').value = today;
    document.getElementById('reportDate').value = today;
}

// ========== Parts Loading =========
async function loadParts() {
    try {
        const response = await fetch(`${API_BASE_URL}/master-data`);
        if (!response.ok) throw new Error('Failed to load parts');
        
        const parts = await response.json();
        const select = document.getElementById('partSelect');
        select.innerHTML = '<option value="">-- 部品を選択してください --</option>';

        parts.forEach(part => {
            const option = document.createElement('option');
            option.value = part.id;
            option.textContent = part.part_name;
            select.appendChild(option);
        });

        select.addEventListener('change', loadPartLocations);
    } catch (error) {
        console.error('Error loading parts:', error);
        showMessage('部品データの読み込みに失敗しました', 'error', 'measurement');
    }
}

// ========== Load Locations for Selected Part =========
async function loadPartLocations() {
    const partSelect = document.getElementById('partSelect');
    const partId = partSelect.value;

    if (!partId) {
        document.getElementById('partInfoBox').style.display = 'none';
        document.getElementById('measurementVisualsContainer').style.display = 'none';
        document.getElementById('measurementFormContainer').style.display = 'none';
        return;
    }

    try {
        // Load part details
        const partResponse = await fetch(`${API_BASE_URL}/master-data/${partId}`);
        if (!partResponse.ok) throw new Error('Failed to load part');
        currentPart = await partResponse.json();

        // Load locations
        const locationsResponse = await fetch(`${API_BASE_URL}/master-data/${partId}/locations`);
        if (!locationsResponse.ok) throw new Error('Failed to load locations');
        currentLocations = await locationsResponse.json();

        // Load completion status
        const today = new Date().toISOString().split('T')[0];
        const statusResponse = await fetch(`${API_BASE_URL}/measurements/part/${partId}/status/${today}`);
        if (statusResponse.ok) {
            completionStatus = {};
            const status = await statusResponse.json();
            status.forEach(s => {
                completionStatus[s.id] = s.status || 'PENDING';
            });
        }

        // Display part info
        displayPartInfo();

        // Create visualization
        createVisualization();

        // Show containers
        document.getElementById('partInfoBox').style.display = 'block';
        document.getElementById('measurementVisualsContainer').style.display = 'block';
    } catch (error) {
        console.error('Error loading locations:', error);
        showMessage('部品情報の読み込みに失敗しました', 'error', 'measurement');
    }
}

// ========== Display Part Info =========
function displayPartInfo() {
    document.getElementById('partNameDisplay').textContent = currentPart.part_name;
    document.getElementById('partCategoryDisplay').textContent = currentPart.part_category;
    document.getElementById('partLocationsCountDisplay').textContent = `${currentLocations.length}箇所`;
}

// ========== Create Visualization =========
function createVisualization() {
    const svg = document.getElementById('measurementSVG');
    svg.innerHTML = '<rect width="400" height="300" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>';

    // Add measurement points
    currentLocations.forEach(location => {
        const x = location.position_x || 50 + (location.location_number - 1) * 50;
        const y = location.position_y || 150;
        const status = completionStatus[location.id] || 'PENDING';

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', `measurement-point ${status.toLowerCase()}`);
        group.setAttribute('id', `location-${location.id}`);
        group.onclick = () => selectLocation(location);

        // Circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', 6);
        circle.setAttribute('fill', getStatusColor(status));
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', 2);

        // Label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y + 20);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '12');
        text.setAttribute('fill', '#333');
        text.textContent = location.location_number;

        group.appendChild(circle);
        group.appendChild(text);
        svg.appendChild(group);
    });

    // Display location progress
    displayLocationProgress();
}

function getStatusColor(status) {
    switch (status) {
        case 'OK': return '#28a745';
        case 'NG': return '#dc3545';
        default: return '#ccc';
    }
}

function displayLocationProgress() {
    const container = document.getElementById('locationProgress');
    container.innerHTML = '';

    currentLocations.forEach(location => {
        const status = completionStatus[location.id] || 'PENDING';
        const badge = document.createElement('div');
        badge.className = `location-badge ${status.toLowerCase()}`;
        badge.innerHTML = `<strong>${location.location_number}</strong><br>${location.location_name}`;
        container.appendChild(badge);
    });
}

// ========== Select Location =========
function selectLocation(location) {
    currentLocation = location;
    currentMeasurementId = null;
    document.getElementById('currentLocationName').textContent = `${location.location_number}. ${location.location_name}`;
    document.getElementById('currentStandardValue').textContent = location.standard_value.toFixed(2);
    document.getElementById('currentToleranceRange').textContent = 
        `${(location.standard_value - location.tolerance_minus).toFixed(2)} ~ ${(location.standard_value + location.tolerance_plus).toFixed(2)}`;
    
    document.getElementById('measuredValue').value = '';
    document.getElementById('measuredValue').focus();
    document.getElementById('measurementFormContainer').style.display = 'block';
    document.getElementById('resultContainer').style.display = 'none';
    document.getElementById('retakeContainer').style.display = 'none';
}

function cancelMeasurement() {
    document.getElementById('measurementFormContainer').style.display = 'none';
    currentLocation = null;
}

// ========== Record Measurement =========
async function recordMeasurement() {
    if (!currentLocation) {
        showMessage('測定箇所を選択してください', 'error', 'measurement');
        return;
    }

    const measuredValue = parseFloat(document.getElementById('measuredValue').value);

    if (isNaN(measuredValue) || measuredValue < 0) {
        showMessage('正の数値を入力してください', 'error', 'measurement');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/measurements/record`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                locationId: currentLocation.id,
                measuredValue: measuredValue
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to record measurement');

        currentMeasurementId = result.measurement.id;
        completionStatus[currentLocation.id] = result.judgment;
        displayResult(result);
        createVisualization();
    } catch (error) {
        console.error('Error:', error);
        showMessage('測定値の記録に失敗しました: ' + error.message, 'error', 'measurement');
    }
}

// ========== Display Result =========
function displayResult(result) {
    const resultBox = document.getElementById('resultBox');
    const resultText = document.getElementById('resultText');
    const resultDetails = document.getElementById('resultDetails');

    const judgment = result.judgment;
    const measuredValue = result.measurement.measured_value;
    const location = result.location;

    resultBox.className = `result-box ${judgment === 'OK' ? 'ok' : 'ng'}`;
    resultText.textContent = judgment === 'OK' ? '✓ 合格' : '✗ 不合格';
    resultDetails.innerHTML = `
        <p><strong>測定箇所:</strong> ${location.location_name}</p>
        <p><strong>測定値:</strong> ${measuredValue.toFixed(2)} mm</p>
        <p><strong>基準値:</strong> ${location.standard_value.toFixed(2)} mm</p>
        <p><strong>許容範囲:</strong> ${(location.standard_value - location.tolerance_minus).toFixed(2)} ~ ${(location.standard_value + location.tolerance_plus).toFixed(2)} mm</p>
    `;

    document.getElementById('measurementFormContainer').style.display = 'none';
    document.getElementById('resultContainer').style.display = 'block';
}

// ========== Next Measurement =========
function nextMeasurement() {
    document.getElementById('resultContainer').style.display = 'none';
    document.getElementById('retakeContainer').style.display = 'none';
    document.getElementById('measurementFormContainer').style.display = 'none';
    currentLocation = null;
    currentMeasurementId = null;
}

// ========== Retake Functions =========
function showRetakeForm() {
    document.getElementById('retakeMeasuredValue').value = '';
    document.getElementById('retakeMeasuredValue').focus();
    document.getElementById('retakeContainer').style.display = 'block';
}

function cancelRetake() {
    document.getElementById('retakeContainer').style.display = 'none';
}

async function recordRetakeMeasurement() {
    if (!currentLocation || !currentMeasurementId) return;

    const retakeMeasuredValue = parseFloat(document.getElementById('retakeMeasuredValue').value);

    if (isNaN(retakeMeasuredValue) || retakeMeasuredValue < 0) {
        showMessage('正の数値を入力してください', 'error', 'measurement');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/measurements/retake`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                locationId: currentLocation.id,
                measuredValue: retakeMeasuredValue,
                originalMeasurementId: currentMeasurementId
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        completionStatus[currentLocation.id] = result.judgment;
        displayResult(result);
        document.getElementById('retakeContainer').style.display = 'none';
        createVisualization();
        showMessage('再測定を記録しました', 'success', 'measurement');
    } catch (error) {
        console.error('Error:', error);
        showMessage('再測定の記録に失敗しました: ' + error.message, 'error', 'measurement');
    }
}

// ========== History Loading =========
async function loadHistory() {
    const date = document.getElementById('historyDate').value;
    if (!date) {
        showMessage('日付を選択してください', 'error', 'history');
        return;
    }

    try {
        const measurementsResponse = await fetch(`${API_BASE_URL}/measurements/date/${date}`);
        const measurements = await measurementsResponse.json();

        const statsResponse = await fetch(`${API_BASE_URL}/reports/stats/${date}`);
        const stats = await statsResponse.json();

        displayHistory(measurements, stats);
    } catch (error) {
        console.error('Error:', error);
        showMessage('履歴の読み込みに失敗しました', 'error', 'history');
    }
}

function displayHistory(measurements, stats) {
    const tableBody = document.getElementById('historyTableBody');
    const tableWrapper = document.getElementById('tableWrapper');
    const statsContainer = document.getElementById('statisticsContainer');
    const noDataMessage = document.getElementById('noDataMessage');

    tableWrapper.style.display = 'none';
    statsContainer.style.display = 'none';
    noDataMessage.style.display = 'none';

    if (measurements.length === 0) {
        noDataMessage.style.display = 'block';
        return;
    }

    document.getElementById('statTotal').textContent = stats.total || 0;
    document.getElementById('statOK').textContent = stats.ok_count || 0;
    document.getElementById('statNG').textContent = stats.ng_count || 0;
    document.getElementById('statRetake').textContent = stats.retake_count || 0;
    statsContainer.style.display = 'block';

    tableBody.innerHTML = '';
    measurements.forEach(m => {
        const row = document.createElement('tr');
        const timestamp = new Date(m.measurement_date).toLocaleString('ja-JP');
        const toleranceRange = `${(m.standard_value - m.tolerance_minus).toFixed(2)} ~ ${(m.standard_value + m.tolerance_plus).toFixed(2)}`;
        const retakeText = m.is_retake ? 'はい' : 'いいえ';

        row.innerHTML = `
            <td>${m.part_name}</td>
            <td>${m.location_name}</td>
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

// ========== Report Functions =========
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
        console.error('Error:', error);
        showMessage('PDFのダウンロードに失敗しました', 'error', 'report');
    }
}

async function previewReport() {
    const date = document.getElementById('reportDate').value;
    if (!date) {
        showMessage('日付を選択してください', 'error', 'report');
        return;
    }

    try {
        const measurementsResponse = await fetch(`${API_BASE_URL}/measurements/date/${date}`);
        const measurements = await measurementsResponse.json();

        const statsResponse = await fetch(`${API_BASE_URL}/reports/stats/${date}`);
        const stats = await statsResponse.json();

        const previewHTML = generatePreviewHTML(date, measurements, stats);
        document.getElementById('previewContent').innerHTML = previewHTML;
        document.getElementById('reportPreview').style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        showMessage('プレビューの読み込みに失敗しました', 'error', 'report');
    }
}

function generatePreviewHTML(date, measurements, stats) {
    let html = `
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="font-size: 24px; margin-bottom: 10px;">📋 日次測定報告書</h2>
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
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: 600;">測定箇所</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: 600;">測定値 (mm)</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: 600;">基準値 (mm)</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: 600;">判定</th>
                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: 600;">測定時刻</th>
                </tr>
            </thead>
            <tbody>
    `;

    measurements.forEach((m, index) => {
        const timestamp = new Date(m.measurement_date).toLocaleString('ja-JP');
        const judgmentColor = m.judgment === 'OK' ? '#28a745' : '#dc3545';
        const bgColor = index % 2 === 0 ? 'white' : '#f9f9f9';

        html += `
            <tr style="background: ${bgColor};">
                <td style="border: 1px solid #ddd; padding: 12px;">${m.part_name}</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${m.location_name}</td>
                <td style="border: 1px solid #ddd; padding: 12px; font-weight: 600;">${m.measured_value.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${m.standard_value.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 12px; color: ${judgmentColor}; font-weight: 600;">${m.judgment}</td>
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

    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 4000);
}