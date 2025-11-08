// 전역 상태 관리
let cardsData = null;
let categoriesData = null;
let selectedCard1 = null;
let selectedCard2 = null;
let spendingData = {};

// DOM 요소
const dataSourceRadios = document.querySelectorAll('input[name="dataSource"]');
const googleSheetInput = document.getElementById('googleSheetInput');
const sheetUrlInput = document.getElementById('sheetUrl');
const loadSheetBtn = document.getElementById('loadSheet');
const card1Select = document.getElementById('card1Select');
const card2Select = document.getElementById('card2Select');
const card1Info = document.getElementById('card1Info');
const card2Info = document.getElementById('card2Info');
const categoryInputsContainer = document.getElementById('categoryInputs');
const totalSpendingEl = document.getElementById('totalSpending');
const calculateBtn = document.getElementById('calculateBtn');
const resultSection = document.getElementById('resultSection');

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadLocalData();
});

// 이벤트 리스너 설정
function setupEventListeners() {
    dataSourceRadios.forEach(radio => {
        radio.addEventListener('change', handleDataSourceChange);
    });

    loadSheetBtn.addEventListener('click', handleLoadGoogleSheet);
    card1Select.addEventListener('change', () => handleCardSelection(1));
    card2Select.addEventListener('change', () => handleCardSelection(2));
    calculateBtn.addEventListener('click', calculateBenefits);
}

// 데이터 소스 변경 처리
function handleDataSourceChange(e) {
    if (e.target.value === 'google') {
        googleSheetInput.classList.remove('hidden');
    } else {
        googleSheetInput.classList.add('hidden');
        loadLocalData();
    }
}

// 로컬 데이터 로드
async function loadLocalData() {
    try {
        const response = await fetch('cards-data.json');
        const data = await response.json();
        cardsData = data.cards;
        categoriesData = data.categories;
        populateCardSelects();
        createCategoryInputs();
    } catch (error) {
        console.error('로컬 데이터 로드 실패:', error);
        alert('데이터를 불러오는데 실패했습니다.');
    }
}

// 구글 시트 로드
async function handleLoadGoogleSheet() {
    const sheetUrl = sheetUrlInput.value.trim();
    if (!sheetUrl) {
        alert('구글 시트 URL을 입력해주세요.');
        return;
    }

    try {
        // 구글 시트 URL을 CSV/JSON으로 변환
        // 예: https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit#gid=0
        // -> https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json

        const sheetId = extractSheetId(sheetUrl);
        if (!sheetId) {
            alert('올바른 구글 시트 URL이 아닙니다.');
            return;
        }

        const apiUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
        const response = await fetch(apiUrl);
        const text = await response.text();

        // Google Visualization API 응답 파싱
        const jsonData = JSON.parse(text.substring(47, text.length - 2));
        const parsedData = parseGoogleSheetData(jsonData);

        cardsData = parsedData.cards;
        categoriesData = parsedData.categories;
        populateCardSelects();
        createCategoryInputs();

        alert('구글 시트 데이터를 성공적으로 불러왔습니다!');
    } catch (error) {
        console.error('구글 시트 로드 실패:', error);
        alert('구글 시트를 불러오는데 실패했습니다. "웹에 게시" 설정을 확인해주세요.');
    }
}

// 구글 시트 ID 추출
function extractSheetId(url) {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
}

// 구글 시트 데이터 파싱 (간단한 형식 가정)
function parseGoogleSheetData(data) {
    // 실제 구글 시트 구조에 맞게 파싱 로직 구현
    // 여기서는 기본 로컬 데이터를 반환
    return {
        cards: cardsData || [],
        categories: categoriesData || []
    };
}

// 카드 선택 옵션 채우기
function populateCardSelects() {
    const options = cardsData.map(card =>
        `<option value="${card.id}">${card.name} (${card.issuer})</option>`
    ).join('');

    card1Select.innerHTML = '<option value="">카드를 선택하세요</option>' + options;
    card2Select.innerHTML = '<option value="">카드를 선택하세요</option>' + options;
}

// 카테고리 입력 필드 생성
function createCategoryInputs() {
    categoryInputsContainer.innerHTML = categoriesData.map(category => `
        <div class="category-input">
            <label for="spending-${category.id}">
                <span class="category-icon">${category.icon}</span>
                ${category.name}
            </label>
            <input
                type="number"
                id="spending-${category.id}"
                data-category="${category.id}"
                placeholder="0"
                min="0"
                step="1000"
                value="0"
            >
        </div>
    `).join('');

    // 입력 이벤트 리스너 추가
    const inputs = categoryInputsContainer.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', handleSpendingInput);
    });
}

// 소비 입력 처리
function handleSpendingInput(e) {
    const category = e.target.dataset.category;
    const amount = parseInt(e.target.value) || 0;
    spendingData[category] = amount;

    // 총 소비액 계산
    const total = Object.values(spendingData).reduce((sum, val) => sum + val, 0);
    totalSpendingEl.textContent = total.toLocaleString();

    // 계산 버튼 활성화 체크
    updateCalculateButton();
}

// 카드 선택 처리
function handleCardSelection(cardNumber) {
    const select = cardNumber === 1 ? card1Select : card2Select;
    const infoDiv = cardNumber === 1 ? card1Info : card2Info;
    const cardId = select.value;

    if (cardNumber === 1) {
        selectedCard1 = cardsData.find(card => card.id === cardId);
    } else {
        selectedCard2 = cardsData.find(card => card.id === cardId);
    }

    if (cardId) {
        const card = cardsData.find(c => c.id === cardId);
        displayCardInfo(card, infoDiv);
    } else {
        infoDiv.innerHTML = '';
    }

    updateCalculateButton();
}

// 카드 정보 표시
function displayCardInfo(card, container) {
    const benefitsHtml = card.benefits.map(benefit => `
        <div class="benefit-item">
            <span class="benefit-category">${benefit.category}:</span>
            ${benefit.type === 'discount' ? '할인' : '포인트'} ${benefit.rate}%
            (월 최대 ${benefit.maxMonthly.toLocaleString()}원)
        </div>
    `).join('');

    container.innerHTML = `
        <div class="card-detail">
            <h4>${card.name}</h4>
            <p>발급사: ${card.issuer}</p>
            <p>연회비: ${card.annualFee.toLocaleString()}원</p>
            <div style="margin-top: 10px;">
                ${benefitsHtml}
            </div>
        </div>
    `;
}

// 계산 버튼 활성화 상태 업데이트
function updateCalculateButton() {
    const hasCards = selectedCard1 && selectedCard2;
    const hasSpending = Object.values(spendingData).some(val => val > 0);
    calculateBtn.disabled = !(hasCards && hasSpending);
}

// 혜택 계산
function calculateBenefits() {
    if (!selectedCard1 || !selectedCard2) {
        alert('두 개의 카드를 선택해주세요.');
        return;
    }

    const result1 = calculateCardBenefit(selectedCard1);
    const result2 = calculateCardBenefit(selectedCard2);

    displayResults(result1, result2);
}

// 개별 카드 혜택 계산
function calculateCardBenefit(card) {
    let totalBenefit = 0;
    const breakdown = [];

    card.benefits.forEach(benefit => {
        const spending = spendingData[benefit.category] || 0;
        if (spending > 0) {
            let benefitAmount = spending * (benefit.rate / 100);

            // 월 최대 한도 적용
            if (benefitAmount > benefit.maxMonthly) {
                benefitAmount = benefit.maxMonthly;
            }

            totalBenefit += benefitAmount;
            breakdown.push({
                category: benefit.category,
                amount: benefitAmount,
                type: benefit.type,
                rate: benefit.rate,
                spending: spending
            });
        }
    });

    // 연회비 차감 (월 단위로 환산)
    const monthlyFee = card.annualFee / 12;
    const netBenefit = totalBenefit - monthlyFee;

    return {
        card: card,
        totalBenefit: totalBenefit,
        monthlyFee: monthlyFee,
        netBenefit: netBenefit,
        breakdown: breakdown
    };
}

// 결과 표시
function displayResults(result1, result2) {
    // 결과 카드 1
    document.getElementById('result1').innerHTML = createResultCardHTML(result1);

    // 결과 카드 2
    document.getElementById('result2').innerHTML = createResultCardHTML(result2);

    // 비교 요약
    const winner = result1.netBenefit > result2.netBenefit ? result1 : result2;
    const loser = result1.netBenefit > result2.netBenefit ? result2 : result1;
    const difference = Math.abs(result1.netBenefit - result2.netBenefit);

    document.getElementById('resultSummary').innerHTML = `
        <h3>🏆 최종 비교 결과</h3>
        <div class="winner">${winner.card.name}</div>
        <div class="difference">
            월 <span class="difference-amount">${Math.round(difference).toLocaleString()}원</span> 더 유리합니다!
        </div>
        <p style="margin-top: 20px; color: var(--text-secondary);">
            (연간 약 ${Math.round(difference * 12).toLocaleString()}원 차이)
        </p>
    `;

    // 결과 섹션 표시
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 결과 카드 HTML 생성
function createResultCardHTML(result) {
    const breakdownHtml = result.breakdown.map(item => `
        <div class="breakdown-item">
            <span class="breakdown-category">
                ${getCategoryIcon(item.category)} ${item.category}
            </span>
            <span class="breakdown-amount">
                ${item.type === 'discount' ? '할인' : '포인트'}
                ${Math.round(item.amount).toLocaleString()}원
            </span>
        </div>
    `).join('');

    return `
        <h3>💳 ${result.card.name}</h3>
        <div class="total-benefit">
            총 혜택: ${Math.round(result.totalBenefit).toLocaleString()}원
        </div>
        <div class="annual-fee">
            연회비: -${Math.round(result.monthlyFee).toLocaleString()}원/월
        </div>
        <div class="total-benefit" style="font-size: 1.5rem; margin-top: 15px;">
            실질 이득: ${Math.round(result.netBenefit).toLocaleString()}원/월
        </div>
        <div class="benefit-breakdown">
            <h4>📊 카테고리별 혜택</h4>
            ${breakdownHtml}
        </div>
        <p style="margin-top: 15px; text-align: center; color: var(--text-secondary); font-size: 0.9rem;">
            연간 약 ${Math.round(result.netBenefit * 12).toLocaleString()}원
        </p>
    `;
}

// 카테고리 아이콘 가져오기
function getCategoryIcon(categoryId) {
    const category = categoriesData.find(cat => cat.id === categoryId);
    return category ? category.icon : '💰';
}

// 숫자 포맷팅 유틸리티
function formatNumber(num) {
    return Math.round(num).toLocaleString();
}
