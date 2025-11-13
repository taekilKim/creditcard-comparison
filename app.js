// 전역 상태 관리
let cardsData = null;
let categoriesData = null;
let selectedCard1 = null;
let selectedCard2 = null;
let selectedCard1FeeOption = null;
let selectedCard2FeeOption = null;
let spendingData = {};
let previousMonthUsage = 0; // 전월실적

const STORAGE_KEY = 'creditcard_data';

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

// 데이터 초기화 - localStorage 우선, 없으면 API/로컬
async function initializeData() {
    // 1. localStorage 먼저 확인
    const localData = loadFromLocalStorage();
    if (localData && localData.cards && localData.cards.length > 0) {
        console.log('localStorage에서 데이터 로드:', localData.cards.length, '개 카드');
        cardsData = localData.cards;
        categoriesData = localData.categories || getDefaultCategories();
        populateCardSelects();
        createCategoryInputs();
        return;
    }

    // 2. localStorage가 없으면 기존 방식 (API 또는 로컬 JSON)
    if (DATA_SOURCE === 'api') {
        await loadDataFromAPI();
    } else {
        await loadLocalData();
    }
}

// localStorage 로드
function loadFromLocalStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('localStorage 로드 오류:', error);
    }
    return null;
}

// 기본 카테고리
function getDefaultCategories() {
    return [
        { id: '전체', name: '전체 (모든 업종)', icon: '💳' },
        { id: '식비', name: '식비', icon: '🍴' },
        { id: '쇼핑', name: '쇼핑', icon: '🛍️' },
        { id: '카페', name: '카페/디저트', icon: '☕' },
        { id: '교통', name: '교통/주유', icon: '🚗' },
        { id: '통신', name: '통신', icon: '📱' },
        { id: '편의점', name: '편의점', icon: '🏪' },
        { id: 'OTT', name: 'OTT/구독', icon: '📺' },
        { id: '온라인쇼핑', name: '온라인쇼핑', icon: '🖥️' },
        { id: '배달', name: '배달앱', icon: '🛵' },
        { id: '영화', name: '영화/문화', icon: '🎬' },
        { id: '병원', name: '병원/약국', icon: '🏥' },
        { id: '뷰티', name: '뷰티/미용', icon: '💅' }
    ];
}

// 로컬 데이터 로드
async function loadLocalData() {
    try {
        const response = await fetch('cards-data.json');
        const data = await response.json();
        cardsData = data.cards;
        categoriesData = data.categories || getDefaultCategories();
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

        // manage-cards는 이미 파싱된 데이터를 반환하므로 바로 사용
        // (get-cards와 달리 Google Visualization API 파싱 불필요)
        if (jsonData.cards && jsonData.categories) {
            // manage-cards에서 온 데이터 (이미 파싱됨)
            cardsData = jsonData.cards;
            categoriesData = jsonData.categories;
        } else if (jsonData.table) {
            // get-cards에서 온 데이터 (Google Visualization API 형식)
            const parsedData = parseGoogleSheetData(jsonData);
            cardsData = parsedData.cards;
            categoriesData = parsedData.categories;
        } else {
            throw new Error('알 수 없는 데이터 형식입니다.');
        }

        populateCardSelects();
        createCategoryInputs();

        console.log('API를 통해 데이터를 성공적으로 불러왔습니다!');
        console.log(`총 ${cardsData.length}개의 카드를 불러왔습니다.`);
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
                feeBrand = row[4]?.v || null;
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
                feeBrand = null;
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
            '전체': '💳',
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

    // 전월실적 입력 추가
    let html = `
        <div class="category-input" style="grid-column: 1 / -1; background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 15px;">
            <label for="previousMonthUsage" style="display: flex; align-items: center; gap: 10px;">
                <span class="category-icon">💰</span>
                <span>전월 카드 사용 실적 (원)</span>
            </label>
            <input
                type="number"
                id="previousMonthUsage"
                placeholder="0"
                min="0"
                step="10000"
                value="0"
                style="margin-top: 10px;"
            >
            <p style="font-size: 0.85rem; color: #856404; margin-top: 5px;">
                전월실적 구간별 혜택이 있는 카드의 경우 이 값을 기준으로 계산됩니다
            </p>
        </div>
    `;

    // "전체" 카테고리는 제외하고 표시
    const displayCategories = categoriesData.filter(cat => cat.id !== '전체');

    html += displayCategories.map(category => `
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

    categoryInputsContainer.innerHTML = html;

    // 전월실적 입력 이벤트 리스너
    const prevMonthInput = document.getElementById('previousMonthUsage');
    if (prevMonthInput) {
        prevMonthInput.addEventListener('input', (e) => {
            previousMonthUsage = parseInt(e.target.value) || 0;
        });
    }

    // 입력 이벤트 리스너 추가
    const inputs = categoryInputsContainer.querySelectorAll('input[data-category]');
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
    // 카드 이미지 HTML
    let cardImageHtml = '';
    if (card.imageUrl) {
        cardImageHtml = `
            <div style="text-align: center; margin-bottom: 15px;">
                <img src="${card.imageUrl}" alt="${card.name}" style="max-width: 200px; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" onerror="this.style.display='none'">
            </div>
        `;
    }

    const benefitsHtml = card.benefits.map(benefit => {
        if (benefit.tiers && benefit.tiers.length > 0) {
            // 구간별 혜택
            const tiersHtml = benefit.tiers.map(tier =>
                `${tier.minPreviousMonth.toLocaleString()}원 이상: ${tier.rate}% (월 ${tier.maxMonthly.toLocaleString()}원)`
            ).join('<br>');
            return `
                <div class="benefit-item">
                    <span class="benefit-category">${benefit.category}:</span>
                    ${benefit.type === 'discount' ? '할인' : '포인트'}<br>
                    <small style="color: #666;">${tiersHtml}</small>
                </div>
            `;
        } else {
            // 단일 혜택
            return `
                <div class="benefit-item">
                    <span class="benefit-category">${benefit.category}:</span>
                    ${benefit.type === 'discount' ? '할인' : '포인트'} ${benefit.rate}%
                    (월 최대 ${benefit.maxMonthly.toLocaleString()}원)
                </div>
            `;
        }
    }).join('');

    // 연회비 구조 처리 (구버전 호환)
    let annualFeeOptions = [];
    if (card.annualFee && typeof card.annualFee === 'object' && card.annualFee.options) {
        annualFeeOptions = card.annualFee.options;
    } else if (typeof card.annualFee === 'number') {
        // 구버전 호환: 단순 숫자인 경우
        annualFeeOptions = [{
            type: '국내전용',
            brand: null,
            fee: card.annualFee
        }];
    }

    // 연회비 옵션이 여러 개인 경우 드롭다운 표시
    let feeHtml = '';
    if (annualFeeOptions.length > 1) {
        const cardNumber = container.id === 'card1Info' ? 1 : 2;
        const feeOptionsHtml = annualFeeOptions.map((option, index) => {
            const brandText = option.brand ? ` ${option.brand}` : '';
            return `<option value="${index}">${option.type}${brandText} - ${option.fee.toLocaleString()}원</option>`;
        }).join('');

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
        const option = annualFeeOptions[0];
        const brandText = option.brand ? ` (${option.type} ${option.brand})` : ` (${option.type})`;
        feeHtml = `<p>연회비: ${option.fee.toLocaleString()}원${brandText}</p>`;

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
            ${cardImageHtml}
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
    const benefitsByGroup = {}; // 공통 한도 그룹별로 혜택 추적

    card.benefits.forEach((benefit, benefitIndex) => {
        // 구간별 혜택 vs 단일 혜택
        let rate = 0;
        let maxMonthly = 0;

        if (benefit.tiers && benefit.tiers.length > 0) {
            // 전월실적 구간별 혜택 - 가장 높은 구간 찾기
            const sortedTiers = [...benefit.tiers].sort((a, b) => b.minPreviousMonth - a.minPreviousMonth);
            for (const tier of sortedTiers) {
                if (previousMonthUsage >= tier.minPreviousMonth) {
                    rate = tier.rate;
                    maxMonthly = tier.maxMonthly;
                    break;
                }
            }

            // 조건을 만족하는 구간이 없으면 이 혜택은 적용 안 됨
            if (rate === 0) {
                return;
            }
        } else {
            // 단일 혜택
            rate = benefit.rate || 0;
            maxMonthly = benefit.maxMonthly || 0;
        }

        // "전체" 카테고리 처리: 모든 소비에 적용
        if (benefit.category === '전체') {
            const totalSpending = Object.values(spendingData).reduce((sum, val) => sum + val, 0);
            if (totalSpending > 0) {
                let benefitAmount = totalSpending * (rate / 100);
                if (benefitAmount > maxMonthly) {
                    benefitAmount = maxMonthly;
                }
                totalBenefit += benefitAmount;
                breakdown.push({
                    category: benefit.category,
                    amount: benefitAmount,
                    type: benefit.type,
                    rate: rate,
                    spending: totalSpending,
                    benefitIndex: benefitIndex,
                    limitGroupId: benefit.limitGroupId || null
                });
            }
        } else {
            // 특정 카테고리
            const spending = spendingData[benefit.category] || 0;
            if (spending > 0) {
                let benefitAmount = spending * (rate / 100);
                if (benefitAmount > maxMonthly) {
                    benefitAmount = maxMonthly;
                }
                totalBenefit += benefitAmount;
                breakdown.push({
                    category: benefit.category,
                    amount: benefitAmount,
                    type: benefit.type,
                    rate: rate,
                    spending: spending,
                    benefitIndex: benefitIndex,
                    limitGroupId: benefit.limitGroupId || null
                });
            }
        }
    });

    // 공통 한도 그룹 적용
    if (card.limitGroups && Object.keys(card.limitGroups).length > 0) {
        // 그룹별로 혜택 집계
        Object.keys(card.limitGroups).forEach(groupId => {
            const groupInfo = card.limitGroups[groupId];
            const groupLimit = groupInfo.maxMonthly;

            // 이 그룹에 속한 breakdown 항목들 찾기
            const groupBreakdownItems = breakdown.filter(item => item.limitGroupId === groupId);

            if (groupBreakdownItems.length === 0) {
                return;
            }

            // 그룹 내 혜택 합계 계산
            const groupTotal = groupBreakdownItems.reduce((sum, item) => sum + item.amount, 0);

            // 그룹 한도 초과 시 비례 감소
            if (groupTotal > groupLimit) {
                const reductionRatio = groupLimit / groupTotal;

                // totalBenefit에서 초과분 차감
                const excessAmount = groupTotal - groupLimit;
                totalBenefit -= excessAmount;

                // 각 항목에 비례 감소 적용
                groupBreakdownItems.forEach(item => {
                    const adjustedAmount = item.amount * reductionRatio;

                    // breakdown에서 해당 항목 찾아서 업데이트
                    const breakdownItem = breakdown.find(b =>
                        b.benefitIndex === item.benefitIndex &&
                        b.category === item.category
                    );

                    if (breakdownItem) {
                        breakdownItem.originalAmount = breakdownItem.amount;
                        breakdownItem.amount = adjustedAmount;
                        breakdownItem.groupLimitApplied = true;
                        breakdownItem.groupLimit = groupLimit;
                        breakdownItem.groupId = groupId;
                    }
                });
            }
        });
    }

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
        <h3>최종 비교 결과</h3>
        <div class="winner">${winner.card.name}</div>
        <div class="difference">
            월 <span class="difference-amount">${Math.round(difference).toLocaleString()}원</span> 더 유리합니다
        </div>
        <p style="margin-top: 20px; color: var(--text-secondary); font-size: 14px;">
            연간 약 ${Math.round(difference * 12).toLocaleString()}원 차이
        </p>
    `;

    // 결과 섹션 표시
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 결과 카드 HTML 생성
function createResultCardHTML(result) {
    const breakdownHtml = result.breakdown.map(item => {
        let amountText = `${Math.round(item.amount).toLocaleString()}원`;
        let groupLimitNote = '';

        // 공통 한도가 적용된 경우 표시
        if (item.groupLimitApplied && item.originalAmount) {
            amountText = `<span style="text-decoration: line-through; color: #999;">${Math.round(item.originalAmount).toLocaleString()}원</span> → ${Math.round(item.amount).toLocaleString()}원`;
            groupLimitNote = `<small style="display: block; color: #ff6b6b; font-size: 0.85rem;">공통한도 적용 (그룹 최대 ${item.groupLimit.toLocaleString()}원)</small>`;
        }

        return `
            <div class="breakdown-item">
                <span class="breakdown-category">
                    ${getCategoryIcon(item.category)} ${item.category}
                </span>
                <span class="breakdown-amount">
                    ${item.type === 'discount' ? '할인' : '포인트'}
                    ${amountText}
                    ${groupLimitNote}
                </span>
            </div>
        `;
    }).join('');

    // 연회비 옵션 표시
    let feeOptionText = '';
    if (result.feeOption) {
        const brandText = result.feeOption.brand ? ` ${result.feeOption.brand}` : '';
        feeOptionText = ` (${result.feeOption.type}${brandText})`;
    }

    // 카드 이미지 HTML
    let cardImageHtml = '';
    if (result.card.imageUrl) {
        cardImageHtml = `
            <div style="text-align: center; margin-bottom: 15px;">
                <img src="${result.card.imageUrl}" alt="${result.card.name}" style="max-width: 150px; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" onerror="this.style.display='none'">
            </div>
        `;
    }

    return `
        ${cardImageHtml}
        <h3>${result.card.name}</h3>
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
            <h4>카테고리별 혜택</h4>
            ${breakdownHtml || '<p style="color: #999;">혜택 내역 없음</p>'}
        </div>
        <p style="margin-top: 15px; text-align: center; color: var(--text-secondary); font-size: 14px;">
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
