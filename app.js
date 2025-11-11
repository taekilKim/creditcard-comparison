// 전역 상태 관리
let cardsData = null;
let categoriesData = null;
let selectedCard1 = null;
let selectedCard2 = null;
let selectedCard1FeeOption = null;
let selectedCard2FeeOption = null;
let spendingData = {};

// DOM 요소
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
    initializeData();
});

// 이벤트 리스너 설정
function setupEventListeners() {
    card1Select.addEventListener('change', () => handleCardSelection(1));
    card2Select.addEventListener('change', () => handleCardSelection(2));
    calculateBtn.addEventListener('click', calculateBenefits);
}

// 데이터 초기화 (config.js 설정에 따라)
async function initializeData() {
    if (DATA_SOURCE === 'api') {
        // API를 통해 구글 시트 데이터 로드 (보안 처리됨)
        await loadDataFromAPI();
    } else {
        // 로컬 데이터 사용
        await loadLocalData();
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

// API를 통해 데이터 로드 (보안 처리됨)
async function loadDataFromAPI() {
    try {
        console.log('API를 통해 데이터를 불러오는 중...');

        const response = await fetch(API_ENDPOINT);

        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status}`);
        }

        const jsonData = await response.json();

        // 에러 응답 체크
        if (jsonData.error || jsonData.useLocal) {
            console.warn('API 에러:', jsonData.error || '알 수 없는 오류');
            console.log('로컬 데이터로 전환합니다.');
            await loadLocalData();
            return;
        }

        // Google Visualization API 응답 파싱
        const parsedData = parseGoogleSheetData(jsonData);

        cardsData = parsedData.cards;
        categoriesData = parsedData.categories;
        populateCardSelects();
        createCategoryInputs();

        console.log('API를 통해 데이터를 성공적으로 불러왔습니다!');
    } catch (error) {
        console.error('API 데이터 로드 실패:', error);
        console.log('로컬 데이터로 전환합니다.');
        await loadLocalData();
    }
}

// 구글 시트 ID 추출
function extractSheetId(url) {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
}

// 구글 시트 데이터 파싱
function parseGoogleSheetData(data) {
    try {
        const rows = data.table.rows;
        const cardsMap = new Map();
        const categoriesSet = new Set();

        // 헤더 확인 (컬럼 수로 새 형식인지 판단)
        const headerRow = rows[0]?.c || [];
        const isNewFormat = headerRow.length >= 11; // 새 형식은 11개 컬럼

        // 첫 번째 행은 헤더이므로 건너뜀
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].c;
            if (!row) continue;

            let cardId, cardName, issuer, feeType, feeBrand, annualFee, category, benefitType, rate, maxMonthly, description;

            if (isNewFormat && row.length >= 11) {
                // 새 형식: 카드ID,카드명,발급사,연회비타입,연회비브랜드,연회비,카테고리,혜택타입,할인율,월최대한도,설명
                cardId = row[0]?.v || '';
                cardName = row[1]?.v || '';
                issuer = row[2]?.v || '';
                feeType = row[3]?.v || '국내전용';
                feeBrand = row[4]?.v || 'VISA';
                annualFee = parseInt(row[5]?.v) || 0;
                category = row[6]?.v || '';
                benefitType = row[7]?.v || 'point';
                rate = parseFloat(row[8]?.v) || 0;
                maxMonthly = parseInt(row[9]?.v) || 0;
                description = row[10]?.v || '';
            } else if (row.length >= 9) {
                // 구 형식: 카드ID,카드명,발급사,연회비,카테고리,혜택타입,할인율,월최대한도,설명
                cardId = row[0]?.v || '';
                cardName = row[1]?.v || '';
                issuer = row[2]?.v || '';
                feeType = '국내전용';
                feeBrand = 'VISA';
                annualFee = parseInt(row[3]?.v) || 0;
                category = row[4]?.v || '';
                benefitType = row[5]?.v || 'point';
                rate = parseFloat(row[6]?.v) || 0;
                maxMonthly = parseInt(row[7]?.v) || 0;
                description = row[8]?.v || '';
            } else {
                continue;
            }

            // 카드 정보 추가/업데이트
            if (!cardsMap.has(cardId)) {
                cardsMap.set(cardId, {
                    id: cardId,
                    name: cardName,
                    issuer: issuer,
                    annualFee: {
                        options: []
                    },
                    benefits: []
                });
            }

            const card = cardsMap.get(cardId);

            // 연회비 옵션 추가 (중복 체크)
            const existingFeeOption = card.annualFee.options.find(
                opt => opt.type === feeType && opt.brand === feeBrand
            );
            if (!existingFeeOption) {
                card.annualFee.options.push({
                    type: feeType,
                    brand: feeBrand,
                    fee: annualFee
                });
            }

            // 혜택 정보 추가 (카테고리가 있는 경우만)
            if (category) {
                card.benefits.push({
                    category: category,
                    type: benefitType,
                    rate: rate,
                    maxMonthly: maxMonthly,
                    description: description
                });

                // 카테고리 추가
                categoriesSet.add(category);
            }
        }

        // 카테고리 아이콘 매핑
        const categoryIcons = {
            '식비': '🍴',
            '쇼핑': '🛍️',
            '카페': '☕',
            '카페/디저트': '☕',
            '교통': '🚗',
            '교통/주유': '🚗',
            '통신': '📱',
            '편의점': '🏪',
            'OTT': '📺',
            '온라인쇼핑': '🖥️',
            '배달': '🛵',
            '영화': '🎬',
            '병원': '🏥',
            '뷰티': '💅'
        };

        const categories = Array.from(categoriesSet).map(cat => ({
            id: cat,
            name: cat,
            icon: categoryIcons[cat] || '💰'
        }));

        return {
            cards: Array.from(cardsMap.values()),
            categories: categories
        };
    } catch (error) {
        console.error('구글 시트 파싱 오류:', error);
        throw new Error('구글 시트 데이터 형식이 올바르지 않습니다.');
    }
}

// 카드 선택 옵션 채우기
function populateCardSelects() {
    if (!cardsData || cardsData.length === 0) {
        console.error('카드 데이터가 없습니다.');
        return;
    }

    const options = cardsData.map(card =>
        `<option value="${card.id}">${card.name} (${card.issuer})</option>`
    ).join('');

    card1Select.innerHTML = '<option value="">카드를 선택하세요</option>' + options;
    card2Select.innerHTML = '<option value="">카드를 선택하세요</option>' + options;
}

// 카테고리 입력 필드 생성
function createCategoryInputs() {
    if (!categoriesData || categoriesData.length === 0) {
        console.error('카테고리 데이터가 없습니다.');
        return;
    }

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
    const otherSelect = cardNumber === 1 ? card2Select : card1Select;
    const infoDiv = cardNumber === 1 ? card1Info : card2Info;
    const cardId = select.value;

    // 같은 카드 선택 방지
    if (cardId && cardId === otherSelect.value) {
        alert('같은 카드를 두 번 선택할 수 없습니다. 다른 카드를 선택해주세요.');
        select.value = '';
        if (cardNumber === 1) {
            selectedCard1 = null;
        } else {
            selectedCard2 = null;
        }
        infoDiv.innerHTML = '';
        updateCalculateButton();
        return;
    }

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

    // 연회비 구조 처리 (구버전 호환)
    let annualFeeOptions = [];
    if (card.annualFee && typeof card.annualFee === 'object' && card.annualFee.options) {
        annualFeeOptions = card.annualFee.options;
    } else if (typeof card.annualFee === 'number') {
        // 구버전 호환: 단순 숫자인 경우
        annualFeeOptions = [{
            type: '국내전용',
            brand: 'VISA',
            fee: card.annualFee
        }];
    }

    // 연회비 옵션이 여러 개인 경우 드롭다운 표시
    let feeHtml = '';
    if (annualFeeOptions.length > 1) {
        const cardNumber = container.id === 'card1Info' ? 1 : 2;
        const feeOptionsHtml = annualFeeOptions.map((option, index) =>
            `<option value="${index}">${option.type} ${option.brand} - ${option.fee.toLocaleString()}원</option>`
        ).join('');

        feeHtml = `
            <p>
                <label for="feeSelect${cardNumber}">연회비 옵션:</label>
                <select id="feeSelect${cardNumber}" class="fee-select" onchange="handleFeeSelection(${cardNumber}, this.value)">
                    ${feeOptionsHtml}
                </select>
            </p>
        `;

        // 첫 번째 옵션을 기본값으로 설정
        if (cardNumber === 1) {
            selectedCard1FeeOption = annualFeeOptions[0];
        } else {
            selectedCard2FeeOption = annualFeeOptions[0];
        }
    } else if (annualFeeOptions.length === 1) {
        feeHtml = `<p>연회비: ${annualFeeOptions[0].fee.toLocaleString()}원 (${annualFeeOptions[0].type} ${annualFeeOptions[0].brand})</p>`;

        // 단일 옵션 자동 설정
        const cardNumber = container.id === 'card1Info' ? 1 : 2;
        if (cardNumber === 1) {
            selectedCard1FeeOption = annualFeeOptions[0];
        } else {
            selectedCard2FeeOption = annualFeeOptions[0];
        }
    } else {
        feeHtml = `<p>연회비: 0원</p>`;
    }

    container.innerHTML = `
        <div class="card-detail">
            <h4>${card.name}</h4>
            <p>발급사: ${card.issuer}</p>
            ${feeHtml}
            <div style="margin-top: 10px;">
                ${benefitsHtml}
            </div>
        </div>
    `;
}

// 연회비 옵션 선택 처리
function handleFeeSelection(cardNumber, optionIndex) {
    const card = cardNumber === 1 ? selectedCard1 : selectedCard2;
    if (!card) return;

    const annualFeeOptions = card.annualFee.options || [];
    const selectedOption = annualFeeOptions[optionIndex];

    if (cardNumber === 1) {
        selectedCard1FeeOption = selectedOption;
    } else {
        selectedCard2FeeOption = selectedOption;
    }
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

    const result1 = calculateCardBenefit(selectedCard1, 1);
    const result2 = calculateCardBenefit(selectedCard2, 2);

    displayResults(result1, result2);
}

// 개별 카드 혜택 계산
function calculateCardBenefit(card, cardNumber) {
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

    // 선택된 연회비 옵션 가져오기
    const feeOption = cardNumber === 1 ? selectedCard1FeeOption : selectedCard2FeeOption;
    let annualFee = 0;

    if (feeOption && feeOption.fee) {
        annualFee = feeOption.fee;
    } else if (card.annualFee && typeof card.annualFee === 'object' && card.annualFee.options) {
        // 옵션이 있지만 선택되지 않은 경우 첫 번째 옵션 사용
        annualFee = card.annualFee.options[0]?.fee || 0;
    } else if (typeof card.annualFee === 'number') {
        // 구버전 호환
        annualFee = card.annualFee;
    }

    // 연회비 차감 (월 단위로 환산)
    const monthlyFee = annualFee / 12;
    const netBenefit = totalBenefit - monthlyFee;

    return {
        card: card,
        feeOption: feeOption,
        totalBenefit: totalBenefit,
        monthlyFee: monthlyFee,
        annualFee: annualFee,
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

    // 연회비 옵션 표시
    let feeOptionText = '';
    if (result.feeOption) {
        feeOptionText = ` (${result.feeOption.type} ${result.feeOption.brand})`;
    }

    return `
        <h3>💳 ${result.card.name}</h3>
        <div class="total-benefit">
            총 혜택: ${Math.round(result.totalBenefit).toLocaleString()}원
        </div>
        <div class="annual-fee">
            연회비: -${Math.round(result.monthlyFee).toLocaleString()}원/월${feeOptionText}
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
