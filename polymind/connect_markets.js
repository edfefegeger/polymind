const COMMUNITY_API_URL = "https://api.polymind.me:443/community";

const MODEL_CONFIG = {
    "GPT": {
        img: "img/gpt-c.png",
        imgLarge: "img/gpt.png",
        name: "GPT"
    },
    "Claude": {
        img: "img/clause-c.png",
        imgLarge: "img/claude.png",
        name: "Claude"
    },
    "Gemini Pro": {
        img: "img/gemeni-c.png",
        imgLarge: "img/gemeni.png",
        name: "Gemini"
    },
    "Grok": {
        img: "img/grock-c.png",
        imgLarge: "img/grock.png",
        name: "Grok"
    },
    "DeepSeek": {
        img: "img/deepsick-c.png",
        imgLarge: "img/deepseek.png",
        name: "DeepSeek"
    },
    "Qwen Max": {
        img: "img/quen-c.png",
        imgLarge: "img/quen.png",
        name: "Qwen"
    }
};

const MODEL_CHART_CLASSES = {
    "GPT": "leaderbord__element_gpt",
    "Claude": "leaderbord__element_clause",
    "Gemini Pro": "leaderbord__element_gemeni",
    "Grok": "leaderbord__element_grock",
    "DeepSeek": "leaderbord__element_deepsick",
    "Qwen Max": "leaderbord__element_quen"
};

// ============================================
// Языковая система
// ============================================
const TRANSLATIONS = {
    en: {
        markets: "Markets",
        leaderboard: "Leaderboard",
        resources: "Resources",
        communityMarkets: "Community Markets",
        community: "Community",
        askAI: "Ask the AI why it made this bet",
        availableBalances: "Available balances",
        rank: "Rank",
        model: "Model",
        returnPercent: "Return %",
        totalPnL: "Total P&L",
        winRate: "Win Rate",
        biggestWin: "Biggest Win",
        biggestLoss: "Biggest Loss",
        winningModel: "WINNING MODEL",
        bet: "Bet",
        amount: "Amount",
        typeMessage: "Type your message...",
        send: "Send",
        eventEnded: "The event has ended",
        checkResults: "please check the \"Result\" tab",
        bets: "Bets",
        results: "Results",
        by: "by"
    },
    ch: {
        markets: "市场",
        leaderboard: "排名",
        resources: "资源",
        community: "社区",
        communityMarkets: "社区市场",
        askAI: "问AI为什么这样下注",
        availableBalances: "可用余额",
        rank: "排名",
        model: "模型",
        returnPercent: "收益率",
        totalPnL: "总盈亏",
        winRate: "胜率",
        biggestWin: "最大赢利",
        biggestLoss: "最大亏损",
        winningModel: "胜出模型",
        bet: "下注",
        amount: "金额",
        typeMessage: "输入您的消息...",
        send: "发送",
        eventEnded: "活动已结束",
        checkResults: "请查看\"结果\"标签",
        bets: "投注",
        results: "结果",
        by: "由"
    }
};

let currentLanguage = 'en';

const savedLang = localStorage.getItem('selectedLanguage');
if (savedLang === 'ch' || savedLang === 'en') {
    currentLanguage = savedLang;
}

function parseEventDescription(description, lang) {
    if (!description) return '';
    
    if (description.includes('|')) {
        const parts = description.split('|').map(p => p.trim());
        return lang === 'en' ? parts[0] : (parts[1] || parts[0]);
    }
    
    return description;
}

function updatePageTexts() {
    const t = TRANSLATIONS[currentLanguage];
    
    const marketLink = document.querySelector('.header__change a[href="index.html"]');
    if (marketLink) marketLink.textContent = t.markets;

    const communityMarketsLink = document.querySelector('.header__change a[href="community-markets.html"]');
    if (communityMarketsLink) communityMarketsLink.textContent = t.communityMarkets;

    const leaderboardSpan = document.querySelector('.header__change .header__links span');
    if (leaderboardSpan) leaderboardSpan.textContent = t.leaderboard;

    const bottomLinks = document.querySelectorAll('.header > .header__container > .header__top > .header__links > div > span');
    if (bottomLinks.length >= 2) {
        bottomLinks[0].textContent = t.resources;
        bottomLinks[1].textContent = t.community;
    }

    const headerName = document.querySelector('.header__name');
    if (headerName) headerName.textContent = t.availableBalances;

    const aiChatTop = document.querySelector('.ai-chat__top span');
    if (aiChatTop) aiChatTop.textContent = t.askAI;

    const chatInput = document.querySelector('.ai-chat__bottom input');
    if (chatInput) chatInput.placeholder = t.typeMessage;

    const sendButton = document.querySelector('.ai-chat__bottom button');
    if (sendButton) {
        const svg = sendButton.querySelector('svg');
        sendButton.textContent = t.send + ' ';
        if (svg) sendButton.appendChild(svg);
    }

    const tabBets = document.querySelector('.right-home__tabs div[data-click="Bets"]');
    if (tabBets) tabBets.textContent = t.bets;

    const tabResults = document.querySelector('.right-home__tabs div[data-click="Results"]');
    if (tabResults) tabResults.textContent = t.results;

    document.querySelectorAll('.right-home__blur span').forEach(span => {
        span.textContent = t.eventEnded;
    });

    document.querySelectorAll('.right-home__blur p').forEach(p => {
        p.textContent = t.checkResults;
    });

    document.querySelectorAll('.right-home__top-info').forEach(topInfo => {
        const divs = topInfo.querySelectorAll('div');
        if (divs.length >= 3) {
            divs[0].textContent = t.model;
            divs[1].textContent = t.bet;
            divs[2].textContent = t.amount;
        }
    });

    document.querySelectorAll('.right-home__user-by').forEach(span => {
        span.textContent = t.by;
    });
}

function updateEventsWithLanguage() {
    document.querySelectorAll('.right-home__wp._bets .right-home__element').forEach(el => {
        const topDiv = el.querySelector('.right-home__top');
        if (!topDiv) return;
        
        if (!el.dataset.originalDescription) {
            el.dataset.originalDescription = topDiv.textContent;
        }
        
        topDiv.textContent = parseEventDescription(el.dataset.originalDescription, currentLanguage);
    });
    
    document.querySelectorAll('.right-home__wp._results .right-home__element').forEach(el => {
        const topDiv = el.querySelector('.right-home__top');
        if (!topDiv) return;
        
        if (!el.dataset.originalDescription) {
            el.dataset.originalDescription = topDiv.textContent;
        }
        
        topDiv.textContent = parseEventDescription(el.dataset.originalDescription, currentLanguage);
    });
}

function initLanguageSwitcher() {
    const langInputs = document.querySelectorAll('input[name="lang"]');
    
    const savedLang = localStorage.getItem('selectedLanguage');
    if (savedLang) {
        currentLanguage = savedLang;
        const input = document.getElementById(savedLang === 'en' ? 'en' : 'ch');
        if (input) input.checked = true;
    }
    
    langInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const newLang = e.target.id === 'en' ? 'en' : 'ch';
            
            if (newLang === currentLanguage) return;
            
            currentLanguage = newLang;
            localStorage.setItem('selectedLanguage', currentLanguage);
            
            updatePageTexts();
            updateEventsWithLanguage();
            
            console.log(`🌐 Язык изменен на: ${currentLanguage}`);
        });
    });
    
    setTimeout(() => {
        updatePageTexts();
        updateEventsWithLanguage();
    }, 500);
}

window.parseEventDescription = parseEventDescription;
window.getCurrentLanguage = () => currentLanguage;
window.TRANSLATIONS = TRANSLATIONS;
window.currentLanguage = currentLanguage;

// ============================================
// Обновление счетчиков с анимацией
// ============================================
function updateCounters() {
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        const value = parseFloat(counter.getAttribute('data-value'));
        const odometer = counter.querySelector('.odometer');
        const decimalOd = counter.querySelector('.decimal-od');
        
        if (odometer) {
            const integerPart = Math.floor(value);
            const decimalPart = Math.round((value - integerPart) * 100);
            
            if (!odometer.odometer) {
                odometer.odometer = new Odometer({
                    el: odometer,
                    value: 0,
                    format: 'd',
                    duration: 1000
                });
            }
            odometer.odometer.update(integerPart);
            
            if (decimalOd && decimalOd.style.display !== 'none') {
                if (!decimalOd.odometer) {
                    decimalOd.odometer = new Odometer({
                        el: decimalOd,
                        value: 0,
                        format: 'dd',
                        duration: 1000
                    });
                }
                decimalOd.odometer.update(decimalPart);
            }
        }
    });
}

function initTextAnimation(element, text) {
    element.textContent = '';
    let index = 0;
    
    const typeWriter = () => {
        if (index < text.length) {
            element.textContent += text.charAt(index);
            index++;
            setTimeout(typeWriter, 20);
        }
    };
    
    typeWriter();
}

// ============================================
// Обновление таймеров
// ============================================
function updateTimers() {
    const timers = document.querySelectorAll('[data-timer-seconds]');

    timers.forEach(timerEl => {
        const timerId = timerEl.getAttribute('data-event-id');
        const eventStatus = timerEl.getAttribute('data-event-status');
        const span = timerEl.querySelector('span');

        if (eventStatus === 'finished') {
            if (span) span.textContent = '0m 0s';
            return;
        }

        if (timerEl.dataset.timerRunning === 'true') {
            return;
        }

        timerEl.dataset.timerRunning = 'true';

        let remainingSeconds = parseInt(timerEl.getAttribute('data-timer-seconds'));

        if (isNaN(remainingSeconds) || remainingSeconds < 0) {
            remainingSeconds = 0;
        }

        console.log(`Запуск таймера для события ${timerId}: ${remainingSeconds} секунд`);

        const updateDisplay = () => {
            const days = Math.floor(remainingSeconds / (24 * 3600));
            const hours = Math.floor((remainingSeconds % (24 * 3600)) / 3600);
            const mins = Math.floor((remainingSeconds % 3600) / 60);
            const secs = remainingSeconds % 60;

            let timeStr = '';

            if (days > 0) timeStr += `${days}d `;
            if (hours > 0 || days > 0) timeStr += `${hours}h `;
            timeStr += `${mins}m ${secs.toString().padStart(2, '0')}s`;

            if (span) span.textContent = timeStr.trim();

            if (remainingSeconds > 0) {
                remainingSeconds--;
                localStorage.setItem(`community_timer_${timerId}`, remainingSeconds);
                setTimeout(updateDisplay, 1000);
            } else {
                localStorage.removeItem(`community_timer_${timerId}`);
                timerEl.dataset.timerRunning = 'false';
                const parentWrap = timerEl.closest('.right-home__wwp');
                if (parentWrap) {
                    const blur = parentWrap.querySelector('.right-home__blur');
                    if (blur) blur.style.display = 'flex';
                }
            }
        };

        updateDisplay();
    });
}

// ============================================
// Обновление балансов в шапке
// ============================================
async function updateHeaderBalances() {
    try {
        const response = await fetch(`${COMMUNITY_API_URL}/models`);
        const models = await response.json();
        
        const sortedModels = models.sort((a, b) => b.balance - a.balance);
        
        const headerBlock = document.querySelector('.header__block');
        if (!headerBlock) return;
        
        headerBlock.innerHTML = '';
        
        sortedModels.forEach((model) => {
            const config = MODEL_CONFIG[model.name];
            if (!config) return;
            
            const headerEl = document.createElement('div');
            headerEl.className = 'header__el';
            
            headerEl.innerHTML = `
                <div>
                    <img src="${config.img}" alt>
                    <span>${config.name}</span>
                </div>
                <div class="counter" data-value="${model.balance.toFixed(2)}">
                    <span class="symbol">$</span>
                    <span class="odometer">0</span>
                    <span>.</span>
                    <span class="decimal-od">00</span>
                </div>
            `;
            
            headerBlock.appendChild(headerEl);
        });
        
        updateCounters();
    } catch (error) {
        console.error('Ошибка обновления балансов в шапке:', error);
    }
}

// ============================================
// Обновление вкладки Bets
// ============================================
let lastBetsDataHash = "";

async function digestMessage(message) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function updateBetsTab() {
    try {
        const [currentEvent, eventHistory] = await Promise.all([
            fetch(`${COMMUNITY_API_URL}/events/current`).then(r => r.json().catch(() => null)),
            fetch(`${COMMUNITY_API_URL}/events/history?limit=20`).then(r => r.json().catch(() => []))
        ]);

        const combinedData = JSON.stringify({ currentEvent, eventHistory });
        const newHash = await digestMessage(combinedData);

        if (newHash === lastBetsDataHash) return; 
        lastBetsDataHash = newHash;

        const betsContainer = document.querySelector('.right-home__wp._bets');
        if (!betsContainer) return;

        const existingEvents = new Map();
        betsContainer.querySelectorAll('.right-home__element').forEach(el => {
            const eventId = el.getAttribute('data-event-id');
            if (eventId) existingEvents.set(eventId, el);
        });

        const createEventHTML = (event, isUpdate = false) => {
            const now = new Date();
            const endTime = new Date(event.end_time + 'Z');
            const startTime = new Date(event.start_time + 'Z');
            
            let remainingSeconds = 0;
            let showBlur = false;

            if (event.status === "active") {
                remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
                showBlur = false;
                
                const savedSeconds = parseInt(localStorage.getItem(`community_timer_${event.id}`));
                if (!isNaN(savedSeconds) && savedSeconds > 0 && savedSeconds < remainingSeconds) {
                    remainingSeconds = savedSeconds;
                }
                
                if (remainingSeconds < 5) {
                    showBlur = true;
                    remainingSeconds = 0;
                }
            } else if (event.status === "finished") {
                remainingSeconds = 0;
                showBlur = true;
                localStorage.removeItem(`community_timer_${event.id}`);
            } else if (event.status === "upcoming") {
                remainingSeconds = Math.max(0, Math.floor((endTime - startTime) / 1000));
                showBlur = false;
            }

            const betsHTML = event.bets.map(bet => {
                const config = MODEL_CONFIG[bet.model_id];
                if (!config) return '';
                const betImage = bet.side === 'YES' ? 'img/ues.png' : 'img/no.png';
                const amount = bet.amount ?? 0;
                return `
                    <li>
                        <div><img src="${config.img}" alt> ${config.name}</div>
                        <div><img src="${betImage}" alt></div>
                        <div>
                            <div class="counter" data-value="${amount}">
                                <span class="symbol">$</span>
                                <span class="odometer">0</span>
                                <span style="display: none;" class="decimal-od"></span>
                            </div>
                        </div>
                    </li>
                `;
            }).join('');

            const animationClass = isUpdate ? '' : '_animation';
            
            // Получаем аватар и Twitter ссылку
            const avatarUrl = event.avatar_url || 'img/avatarr.webp';
            const twitterLink = event.twitter_link || '#';
            const username = event.username || 'Anonymous';

            return `
                <div class="right-home__element ${animationClass}" data-event-id="${event.id}" data-original-description="${event.description}">
                    <div class="right-home__top">${parseEventDescription(event.description, currentLanguage)}</div>
                    <div class="right-home__user">
                        <span class="right-home__user-by">${TRANSLATIONS[currentLanguage].by}</span>
                        <div class="right-home__user-info"><img src="${avatarUrl}" alt> ${username}</div>
                        <a href="${twitterLink}" target="_blank" class="right-home__user-link"><img src="img/twitter-x.svg" alt></a>
                    </div>
                    <div class="right-home__wwp">
                        <div class="right-home__blur" style="display: ${showBlur ? 'flex' : 'none'}">
                            <img src="img/cec.png" alt>
                            <span>${TRANSLATIONS[currentLanguage].eventEnded}</span>
                            <p>${TRANSLATIONS[currentLanguage].checkResults}</p>
                        </div>
                        <div class="right-home__timer" data-timer-seconds="${remainingSeconds}" data-event-id="${event.id}" data-event-status="${event.status}">
                            <img src="img/Bold/Time/Clock Square.png" alt>
                            <span></span>
                        </div>
                        <div class="right-home__info">
                            <div class="right-home__top-info">
                                <div>${TRANSLATIONS[currentLanguage].model}</div>
                                <div>${TRANSLATIONS[currentLanguage].bet}</div>
                                <div>${TRANSLATIONS[currentLanguage].amount}</div>
                            </div>
                            <ul class="right-home__list">
                                ${betsHTML}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        };

        const processedEventIds = new Set();
        const allEvents = [];

        if (currentEvent && currentEvent.status === 'active') {
            allEvents.push(currentEvent);
        }

        eventHistory.forEach(event => {
            const isNotCurrentEvent = !currentEvent || event.id !== currentEvent.id;
            const isVisible = event.status === 'active' || event.status === 'finished';
            if (isNotCurrentEvent && isVisible) {
                allEvents.push(event);
            }
        });

        const statusOrder = {
            active: 0,
            upcoming: 1,
            finished: 2
        };

        allEvents.sort((a, b) => {
            const aStatus = statusOrder[a.status] ?? 3;
            const bStatus = statusOrder[b.status] ?? 3;

            if (aStatus !== bStatus) {
                return aStatus - bStatus;
            }

            const aEnd = new Date(a.end_time + 'Z');
            const bEnd = new Date(b.end_time + 'Z');

            if (a.status === 'finished' && b.status === 'finished') {
                return bEnd - aEnd; 
            } else {
                return aEnd - bEnd; 
            }
        });

        allEvents.forEach(event => {
            processedEventIds.add(event.id);

            if (existingEvents.has(event.id)) {
                const existingEl = existingEvents.get(event.id);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = createEventHTML(event, true);
                const newEl = tempDiv.firstElementChild;

                existingEl.replaceWith(newEl);
                setupHoverEffect(newEl);
            } else {
                betsContainer.insertAdjacentHTML('beforeend', createEventHTML(event, false));
                const newEl = betsContainer.lastElementChild;
                setupHoverEffect(newEl);
            }
        });

        existingEvents.forEach((el, eventId) => {
            if (!processedEventIds.has(eventId)) {
                el.remove();
            }
        });

        updateCounters();
        updateTimers();

    } catch (error) {
        console.error('Ошибка обновления вкладки Bets:', error);
    }
}

function setupHoverEffect(element) {
    const blur = element.querySelector('.right-home__blur');
    const info = element.querySelector('.right-home__info');
    if (!blur) return;

    element.addEventListener('mouseenter', () => {
        blur.classList.add('_hidden'); 
        if (info) info.style.filter = 'none';
    });

    element.addEventListener('mouseleave', () => {
        blur.classList.remove('_hidden'); 
        if (info) info.style.filter = '';
    });
}

// ============================================
// Обновление вкладки Results
// ============================================
async function updateResultsTab() {
    try {
        const events = await fetch(`${COMMUNITY_API_URL}/events/history?limit=10`).then(r => r.json());
        const finishedEvents = events.filter(e => e.status === 'finished' && e.result);
        
        const resultsContainer = document.querySelector('.right-home__wp._results');
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = '';
        
        finishedEvents.forEach(event => {
            const betsHTML = event.bets.map(bet => {
                const config = MODEL_CONFIG[bet.model_id];
                if (!config) return '';

                const amount = bet.amount || 0;
                let profit = bet.profit || 0;

                if (event.result && profit > 0 && profit > amount) {
                    profit -= amount;
                }

                const isPositive = profit >= 0;
                const symbol = isPositive ? '+' : '-';
                const cssClass = isPositive ? '' : '_red';

                return `
                    <li>
                        <div><img src="${config.img}" alt> ${config.name}</div>
                        <div class="counter ${cssClass}" data-value="${Math.abs(profit)}">
                            <span class="symbol">${symbol}$</span>
                            <span class="odometer">0</span>
                            <span style="display: none;" class="decimal-od"></span>
                        </div>
                    </li>
                `;
            }).join('');

            const avatarUrl = event.avatar_url || 'img/avatarr.webp';
            const twitterLink = event.twitter_link || '#';
            const username = event.username || 'Anonymous';

            resultsContainer.innerHTML += `
                <div class="right-home__element" data-original-description="${event.description}">
                    <div class="right-home__top">${parseEventDescription(event.description, currentLanguage)}</div>
                    <div class="right-home__user">
                        <span class="right-home__user-by">${TRANSLATIONS[currentLanguage].by}</span>
                        <div class="right-home__user-info"><img src="${avatarUrl}" alt> ${username}</div>
                        <a href="${twitterLink}" target="_blank" class="right-home__user-link"><img src="img/twitter-x.svg" alt></a>
                    </div>
                    <div class="right-home__info">
                        <ul class="right-home__list">
                            ${betsHTML}
                        </ul>
                    </div>
                </div>
            `;
        });
        
        updateCounters();
        
    } catch (error) {
        console.error('Ошибка обновления вкладки Results:', error);
    }
}

// ============================================
// Обновление Leaderboard (для leaderboard2.html)
// ============================================
async function updateLeaderboard() {
    try {
        const leaderboard = await fetch(`${COMMUNITY_API_URL}/leaderboard`).then(r => r.json());
        
        const leaderboardTop = document.querySelector('.leaderbord__top');
        if (leaderboardTop) {
            const elements = leaderboardTop.querySelectorAll('.leaderbord__el:not(:first-child)');
            elements.forEach(el => el.remove());
            
            leaderboard.forEach(item => {
                const config = MODEL_CONFIG[item.model];
                if (!config) return;

                const rowHTML = `
                    <div class="leaderbord__el">
                        <div>${item.rank}</div>
                        <div><img src="${config.img}" alt> ${config.name}</div>
                        <div class="counter ${item.return_percent < 0 ? '_minus' : '_plus'}" data-value="${item.return_percent.toFixed(2)}">
                            <span class="symbol">${item.return_percent >= 0 ? '+' : ''}</span>
                            <span class="odometer">0</span>
                            <span>.</span>
                            <span class="decimal-od">00</span>
                            <span class="symbol">%</span>
                        </div>
                        <div class="counter ${item.total_pnl < 0 ? '_minus' : '_plus'}" data-value="${Math.abs(item.total_pnl).toFixed(2)}">
                            <span class="symbol">${item.total_pnl >= 0 ? '$' : '-$'}</span>
                            <span class="odometer">0</span>
                            <span>.</span>
                            <span class="decimal-od">00</span>
                        </div>
                        <div class="counter ${item.win_rate < 0 ? '_minus' : '_plus'}" data-value="${item.win_rate.toFixed(2)}">
                            <span class="symbol"></span>
                            <span class="odometer">0</span>
                            <span>.</span>
                            <span class="decimal-od">00</span>
                            <span class="symbol">%</span>
                        </div>
                        <div class="counter ${item.biggest_win < 0 ? '_minus' : '_plus'}" data-value="${item.biggest_win}">
                            <span class="symbol">$</span>
                            <span class="odometer">0</span>
                            <span style="display: none;" class="decimal-od"></span>
                        </div>
                        <div class="counter _minus" data-value="${Math.abs(item.biggest_loss).toFixed(2)}">
                            <span class="symbol">-$</span>
                            <span class="odometer">0</span>
                            <span>.</span>
                            <span class="decimal-od">00</span>
                        </div>
                    </div>
                `;
                leaderboardTop.insertAdjacentHTML('beforeend', rowHTML);
            });
        }
        
        const modelsResponse = await fetch(`${COMMUNITY_API_URL}/models`);
        const models = await modelsResponse.json();
        
        const balanceMap = {};
        models.forEach(model => {
            balanceMap[model.name] = model.balance;
        });

        const FIXED_SCALE_MIN = 5000;
        const FIXED_SCALE_MAX = 15000;
        const scale = {
            min: FIXED_SCALE_MIN,
            max: FIXED_SCALE_MAX,
            step: (FIXED_SCALE_MAX - FIXED_SCALE_MIN) / 4
        };

        const percentDiv = document.querySelector('.leaderbord__procent');
        if (percentDiv) {
            const formatValue = (value) => {
                if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
                return Math.round(value).toString();
            };

            percentDiv.innerHTML = `
                <div>${formatValue(scale.max)}</div>
                <div>${formatValue(scale.max - scale.step)}</div>
                <div>${formatValue(scale.max - scale.step * 2)}</div>
                <div>${formatValue(scale.max - scale.step * 3)}</div>
                <div style="opacity: 0;">${formatValue(scale.min)}</div>
            `;
        }

        leaderboard.forEach(item => {
            const config = MODEL_CONFIG[item.model];
            if (!config) return;

            const chartClass = MODEL_CHART_CLASSES[item.model];
            const element = document.querySelector(`.${chartClass}`);

            if (element) {
                const heightDiv = element.querySelector('div');
                if (heightDiv) {
                    const balance = balanceMap[item.model] || 10000;

                    const normalizedHeight = ((balance - scale.min) / (scale.max - scale.min)) * 93;
                    const heightPercent = Math.max(5, Math.min(normalizedHeight, 100));

                    console.log(`${item.model}: balance=${balance.toFixed(2)}, height=${heightPercent.toFixed(1)}%`);

                    heightDiv.style.setProperty('--height', `${heightPercent}%`);
                }
            }
        });

        if (leaderboard.length > 0) {
            const winner = leaderboard[0];
            const config = MODEL_CONFIG[winner.model];
            const bottomDiv = document.querySelector('.leaderbord__bottom');
            
            if (bottomDiv && config) {
                const img = bottomDiv.querySelector('img');
                const textNode = Array.from(bottomDiv.childNodes).find(node => node.nodeType === 3);
                const percentDiv = bottomDiv.querySelector('div');
                
                if (img) img.src = config.imgLarge;
                if (textNode) textNode.textContent = ` ${config.name} `;
                if (percentDiv) percentDiv.textContent = `${winner.return_percent >= 0 ? '+' : ''}${winner.return_percent.toFixed(1)}%`;
            }
        }

        updateCounters();
        
    } catch (error) {
        console.error('Ошибка обновления leaderboard:', error);
    }
}

// ============================================
// AI Chat Integration
// ============================================
let selectedModel = 'gpt';

function initAIChat() {
    const dropdown = document.querySelector('.ai-chat__dropdawn');
    const selected = dropdown?.querySelector('.ai-chat__dropdawn-selest');
    const list = dropdown?.querySelector('ul');
    const input = document.querySelector('.ai-chat__bottom input');
    const button = document.querySelector('.ai-chat__bottom button');
    const chatWrap = document.querySelector('.ai-chat__wp');
    
    if (!dropdown || !selected || !list || !input || !button || !chatWrap) return;
    
    selected.addEventListener('click', () => {
        list.classList.toggle('_active');
    });
    
    const listItems = list.querySelectorAll('li');
    listItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            const models = ["gpt", "Claude", "Gemini Pro", "Grok", "DeepSeek", "Qwen Max"];
            selectedModel = models[index];
            
            const img = item.querySelector('img');
            const span = item.querySelector('span');
            
            selected.innerHTML = '';
            if (img) selected.appendChild(img.cloneNode(true));
            if (span) selected.appendChild(span.cloneNode(true));
            
            list.classList.remove('_active');

            chatWrap.innerHTML = '';
        });
    });
    
    const sendMessage = async () => {
        const question = input.value.trim();
        if (!question) return;
        
        const userMsg = document.createElement('div');
        userMsg.className = 'ai-chat__el _user';
        userMsg.innerHTML = `
            <span>You</span>
            <p>${question}</p>
        `;
        chatWrap.appendChild(userMsg);
        
        input.value = '';
        chatWrap.scrollTop = chatWrap.scrollHeight;
        
        try {
            const response = await fetch(`https://api.polymind.me:443/model-chat`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({model_id: selectedModel, question})
            });
            
            const data = await response.json();
            
            const aiMsg = document.createElement('div');
            aiMsg.className = 'ai-chat__el _ai';
            
            const config = MODEL_CONFIG[selectedModel];

            const modelName = config ? config.name : 'GPT-5';
            const modelImg = config ? config.img : 'img/gpt-c.png';
            
            aiMsg.innerHTML = `
                <span class="_name-ai"><img src="${modelImg}" alt> <span>${modelName}</span></span>
                <p></p>
            `;
            chatWrap.appendChild(aiMsg);
            
            const aiParagraph = aiMsg.querySelector('p');
            initTextAnimation(aiParagraph, data.answer);
            
            chatWrap.scrollTop = chatWrap.scrollHeight;
            
        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
        }
    };
    
    button.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

// ============================================
// Bubble Map для Community Markets
// ============================================
let lastData = [];
let lastModelsState = "";

async function updateBubbleMap() {
    try {
        const response = await fetch(`${COMMUNITY_API_URL}/models`);
        const models = await response.json();
        
        const items = models.map(m => ({
            model: m.name,
            balance: m.balance,
            delta: m.balance - 10000
        }));
        
        const currentState = JSON.stringify(items.map(i => ({n: i.model, b: i.balance})));
        if (lastModelsState !== currentState) {
            lastModelsState = currentState;
            lastData = items;
            renderTreemap(items);
            console.log("📊 Bubble map обновлена");
        }
    } catch (error) {
        console.error("Ошибка обновления bubble map:", error);
    }
}

window.addEventListener("resize", () => {
    if (lastData.length > 0) {
        renderTreemap(lastData);
    }
});

function renderTreemap(items) {
    const container = document.getElementById("bubbleMap");
    if (!container) return;
    
    container.innerHTML = "";
    const W = container.clientWidth;
    const H = container.clientHeight;
    
    const isMobile = window.innerWidth <= 768;

    const MODEL_STYLES = {
        "GPT": {
            color: "#268383ff",
            logo: "img/gpt.png"
        },
        "Gemini Pro": {
            color: "#5FA8E1",
            logo: "img/gemeni.png"
        },
        "Qwen Max": {
            color: "#A58AF9",
            logo: "img/quen.png"
        },
        "Claude": {
            color: "#E89A7A",
            logo: "img/claude.png"
        },
        "Grok": {
            color: "#2B2B2B",
            logo: "img/grock.png"
        },
        "DeepSeek": {
            color: "#6367b4ff",
            logo: "img/deepseek.png"
        }
    };

    function createBlock(item, x, y, w, h) {
        const div = document.createElement("div");
        div.style.position = "absolute";
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        div.style.width = `${w}px`;
        div.style.height = `${h}px`;
        div.style.borderRadius = "4px";
        div.style.overflow = "hidden";
        div.style.display = "flex";
        div.style.justifyContent = "center";
        div.style.alignItems = "center";
        div.style.textAlign = "center";
        div.style.fontFamily = "'IBM Plex Sans', 'Inter', sans-serif";
        div.style.fontWeight = "600";
        div.style.color = "rgba(255,255,255,0.95)";
        div.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";
        div.style.background = MODEL_STYLES[item.model]?.color || "#555";
        div.style.boxShadow = "inset 0 0 40px rgba(255,255,255,0.1)";

        const minDim = Math.min(w, h);
        const isTiny = minDim < 50;
        const isNarrow = w < 80 && h > w;
        const isWide = w > h * 2;

        const nameFontSize = Math.max(8, Math.min(16, minDim * 0.18));
        const balFontSize = Math.max(8, Math.min(14, minDim * 0.15));
        const imgSize = Math.max(14, Math.min(40, minDim * 0.35));

        const img = document.createElement("img");
        img.src = MODEL_STYLES[item.model]?.logo || "";
        img.alt = item.model;
        img.style.width = `${imgSize}px`;
        img.style.height = `${imgSize}px`;
        img.style.opacity = "0.9";
        img.style.flexShrink = "0";

        const name = document.createElement("div");
        name.textContent = item.model;
        name.style.fontSize = `${nameFontSize}px`;
        name.style.whiteSpace = "nowrap";
        name.style.overflow = "hidden";
        name.style.textOverflow = "ellipsis";
        name.style.maxWidth = "100%";
        name.style.lineHeight = "1.1";

        const bal = document.createElement("div");
        bal.textContent = `${item.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        bal.style.fontSize = `${balFontSize}px`;
        bal.style.opacity = "0.9";
        bal.style.whiteSpace = "nowrap";

        const textWrap = document.createElement("div");
        textWrap.style.display = "flex";
        textWrap.style.flexDirection = "column";
        textWrap.style.alignItems = "center";
        textWrap.style.justifyContent = "center";
        textWrap.appendChild(name);
        textWrap.appendChild(bal);

        if (isTiny) {
            div.style.flexDirection = "row";
            div.style.gap = "3px";
            name.style.fontSize = `${Math.max(7, minDim * 0.22)}px`;
            bal.style.fontSize = `${Math.max(7, minDim * 0.18)}px`;
            textWrap.style.flexDirection = "row";
            textWrap.style.gap = "3px";
        } else if (isWide) {
            div.style.flexDirection = "row";
            div.style.gap = "6px";
            textWrap.style.alignItems = "flex-start";
            name.style.textAlign = "left";
            bal.style.textAlign = "left";
        } else if (isNarrow) {
            div.style.flexDirection = "column";
            div.style.gap = "2px";
        } else {
            div.style.flexDirection = "column";
            div.style.gap = "4px";
        }

        div.appendChild(img);
        div.appendChild(textWrap);

        div.addEventListener("mouseenter", () => {
            div.style.transform = "scale(1.03)";
            div.style.boxShadow = "0 0 25px rgba(255,255,255,0.25)";
        });
        div.addEventListener("mouseleave", () => {
            div.style.transform = "scale(1)";
            div.style.boxShadow = "inset 0 0 40px rgba(255,255,255,0.1)";
        });

        container.appendChild(div);
    }

    function layout(x, y, w, h, data, depth = 0) {
        if (data.length === 0) return;

        if (data.length === 1) {
            createBlock(data[0], x, y, w, h);
            return;
        }

        const aspectRatio = w / h;
        const seed = (x * 7 + y * 11 + depth * 13) % 100;
        
        let horizontal;
        
        if (aspectRatio > 2.5) {
            horizontal = true;
        } else if (aspectRatio < 0.4) {
            horizontal = false;
        } else {
            const depthFactor = (depth % 2 === 0) ? 0.3 : 0.7;
            const randomFactor = seed / 100;
            const aspectFactor = aspectRatio > 1 ? 0.6 : 0.4;
            
            const decision = (depthFactor * 0.3 + randomFactor * 0.4 + aspectFactor * 0.3);
            horizontal = decision > 0.5;
        }

        const minSplit = Math.max(1, Math.floor(0.25 * data.length));
        const maxSplit = Math.min(data.length - 1, Math.floor(0.75 * data.length));

        const splitRange = maxSplit - minSplit;
        const splitIndex = splitRange > 0 ? 
                          minSplit + ((seed * (depth + 1)) % (splitRange + 1)) : 
                          minSplit;

        const first = data.slice(0, splitIndex);
        const rest = data.slice(splitIndex);

        const firstTotal = first.reduce((s, i) => s + i.balance, 0);
        const restTotal = rest.reduce((s, i) => s + i.balance, 0);
        const total = firstTotal + restTotal;

        let ratio = firstTotal / total;
        const variation = ((seed % 20) - 10) / 200; 
        ratio = Math.max(0.2, Math.min(0.8, ratio + variation));

        const GAP = isMobile ? 1 : 2;

        if (horizontal) {
            const w1 = Math.floor(w * ratio);
            layout(x, y, w1 - GAP, h, first, depth + 1);
            layout(x + w1, y, w - w1, h, rest, depth + 1);
        } else {
            const h1 = Math.floor(h * ratio);
            layout(x, y, w, h1 - GAP, first, depth + 1);
            layout(x, y + h1, w, h - h1, rest, depth + 1);
        }
    }

    layout(0, 0, W, H, items);
}

// ============================================
// Адаптивность Bubble Map
// ============================================
function adjustBubbleMapHeight() {
    const bubbleMap = document.getElementById('bubbleMap');
    if (!bubbleMap) return;
    
    if (window.innerWidth <= 768) {
        const viewportHeight = window.innerHeight;
        const header = document.querySelector('.header');
        const home = document.querySelector('.home');
        const aiChat = document.querySelector('.ai-chat');
        const rightHomeTabs = document.querySelector('.right-home__tabs');
        
        const headerHeight = header?.offsetHeight || 0;
        const tabsHeight = rightHomeTabs?.offsetHeight || 60;

        const isMainPage = home && home.classList.contains('_hide');
        
        if (isMainPage) {
            const maxBubbleHeight = viewportHeight - headerHeight - tabsHeight - 30;
            const finalHeight = Math.max(250, maxBubbleHeight);
            
            bubbleMap.style.height = `${finalHeight}px`;
            bubbleMap.style.minHeight = `${finalHeight}px`;
            bubbleMap.style.maxHeight = `${finalHeight}px`;
            bubbleMap.style.flexShrink = '0';
            
            if (aiChat) {
                aiChat.style.display = 'none';
            }
            
            if (rightHomeTabs) {
                rightHomeTabs.style.display = 'grid';
                rightHomeTabs.style.flexShrink = '0';
            }
            
        } else {
            const aiChatTopHeight = 50;
            const aiChatBottomHeight = 60;
            const minAiChatHeight = aiChatTopHeight + aiChatBottomHeight + 100;

            const maxBubbleHeight = viewportHeight - headerHeight - tabsHeight - minAiChatHeight - 20;
            const finalHeight = Math.max(180, maxBubbleHeight);
            
            bubbleMap.style.height = `${finalHeight}px`;
            bubbleMap.style.minHeight = `${finalHeight}px`;
            bubbleMap.style.maxHeight = `${finalHeight}px`;
            bubbleMap.style.flexShrink = '0';

            if (aiChat) {
                aiChat.style.display = 'flex';
                aiChat.style.flex = '1';
                aiChat.style.minHeight = '0';
                aiChat.style.maxHeight = 'none';
                aiChat.style.flexDirection = 'column';
                aiChat.style.overflow = 'hidden';
            }
            
            const aiChatWp = document.querySelector('.ai-chat__wp');
            if (aiChatWp) {
                aiChatWp.style.flex = '1';
                aiChatWp.style.overflowY = 'auto';
                aiChatWp.style.minHeight = '0';
            }
            
            const aiChatBottom = document.querySelector('.ai-chat__bottom');
            if (aiChatBottom) {
                aiChatBottom.style.flexShrink = '0';
                aiChatBottom.style.marginBottom = '0';
                aiChatBottom.style.paddingBottom = '10px';
            }

            if (rightHomeTabs) {
                rightHomeTabs.style.display = 'grid';
                rightHomeTabs.style.flexShrink = '0';
            }
        }
        
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100vh';
        
        const wrapper = document.querySelector('.wrapper');
        if (wrapper) {
            wrapper.style.height = '100vh';
            wrapper.style.overflow = 'hidden';
        }
        
        if (home) {
            home.style.height = '100vh';
            home.style.maxHeight = '100vh';
            home.style.overflow = 'hidden';
            home.style.display = 'flex';
            home.style.flexDirection = 'column';
        }
        
        const homeLeft = document.querySelector('.home__left');
        if (homeLeft) {
            homeLeft.style.height = `calc(100vh - ${headerHeight}px)`;
            homeLeft.style.maxHeight = `calc(100vh - ${headerHeight}px)`;
            homeLeft.style.overflow = 'hidden';
            homeLeft.style.display = 'flex';
            homeLeft.style.flexDirection = 'column';
        }
        
        const rightHome = document.querySelector('.right-home');
        if (rightHome) {
            rightHome.style.display = 'flex';
            rightHome.style.flexDirection = 'column';
            rightHome.style.maxHeight = '50vh';
            rightHome.style.overflowY = 'auto';
            rightHome.style.flexShrink = '0';
        }
        
    } else {
        bubbleMap.style.height = '50%';
        bubbleMap.style.minHeight = '400px';
        bubbleMap.style.maxHeight = '';
        bubbleMap.style.flexShrink = '';
        
        document.body.style.overflow = '';
        document.body.style.height = '';
        
        const wrapper = document.querySelector('.wrapper');
        if (wrapper) {
            wrapper.style.height = '';
            wrapper.style.overflow = '';
        }
        
        const home = document.querySelector('.home');
        if (home) {
            home.style.height = '';
            home.style.maxHeight = '';
            home.style.overflow = '';
            home.style.display = '';
            home.style.flexDirection = '';
        }
        
        const homeLeft = document.querySelector('.home__left');
        if (homeLeft) {
            homeLeft.style.height = '';
            homeLeft.style.maxHeight = '';
            homeLeft.style.overflow = '';
            homeLeft.style.display = '';
            homeLeft.style.flexDirection = '';
        }
        
        const aiChat = document.querySelector('.ai-chat');
        if (aiChat && !aiChat.dataset.fixedHeight) { 
            aiChat.dataset.fixedHeight = aiChat.offsetHeight; 
            aiChat.style.height = `${aiChat.offsetHeight}px`;
            aiChat.style.maxHeight = `${aiChat.offsetHeight}px`;
            aiChat.style.minHeight = `${aiChat.offsetHeight}px`;
            aiChat.style.flex = 'none';
            aiChat.style.overflow = 'hidden';
        }
        
        const aiChatWp = document.querySelector('.ai-chat__wp');
        if (aiChatWp) {
            aiChatWp.style.flex = '';
            aiChatWp.style.overflowY = '';
            aiChatWp.style.minHeight = '';
        }
        
        const aiChatBottom = document.querySelector('.ai-chat__bottom');
        if (aiChatBottom) {
            aiChatBottom.style.flexShrink = '';
            aiChatBottom.style.marginBottom = '';
            aiChatBottom.style.paddingBottom = '';
        }
        
        const rightHome = document.querySelector('.right-home');
        if (rightHome) {
            rightHome.style.display = '';
            rightHome.style.flexDirection = '';
            rightHome.style.maxHeight = '';
            rightHome.style.overflowY = '';
            rightHome.style.flexShrink = '';
        }
        
        const rightHomeTabs = document.querySelector('.right-home__tabs');
        if (rightHomeTabs) {
            rightHomeTabs.style.display = '';
            rightHomeTabs.style.flexShrink = '';
        }
    }
    
    if (typeof lastData !== 'undefined' && lastData.length > 0) {
        renderTreemap(lastData);
    }
}

window.addEventListener('resize', adjustBubbleMapHeight);
window.addEventListener('orientationchange', adjustBubbleMapHeight);

if (window.ResizeObserver) {
    const observer = new ResizeObserver(() => {
        if (window.innerWidth <= 768) {
            adjustBubbleMapHeight();
        }
    });
    
    const rightHome = document.querySelector('.right-home');
    const header = document.querySelector('.header');
    
    if (rightHome) observer.observe(rightHome);
    if (header) observer.observe(header);
}

document.addEventListener('click', (e) => {
    const tab = e.target.closest('.right-home__tabs div');
    if (tab && window.innerWidth <= 768) {
        setTimeout(() => {
            adjustBubbleMapHeight();
        }, 50);
    }
});

if (window.MutationObserver) {
    const homeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (window.innerWidth <= 768) {
                    setTimeout(() => {
                        adjustBubbleMapHeight();
                    }, 50);
                }
            }
        });
    });
    
    const home = document.querySelector('.home');
    if (home) {
        homeObserver.observe(home, {
            attributes: true,
            attributeFilter: ['class']
        });
    }
}

// ============================================
// Инициализация приложения
// ============================================
async function initCommunityApp() {
    await updateHeaderBalances();
    await updateBetsTab();
    await updateResultsTab();
    
    initAIChat();
    
    setInterval(async () => {
        await updateHeaderBalances();
        await updateBetsTab();
        await updateResultsTab();
    }, 20000);
}

async function initCommunityLeaderboard() {
    await updateHeaderBalances();
    await updateLeaderboard();

    setInterval(async () => {
        await updateHeaderBalances();
        await updateLeaderboard();
    }, 20000);
}

// ============================================
// Запуск при загрузке страницы
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initLanguageSwitcher();
    
    if (document.querySelector('.leaderbord')) {
        // Это leaderboard2.html
        initCommunityLeaderboard();
    } else if (document.querySelector('.home')) {
        // Это community-markets.html
        initCommunityApp();
        
        // Запускаем bubble map
        updateBubbleMap();
        setInterval(updateBubbleMap, 5000);
        
        adjustBubbleMapHeight();
        setTimeout(adjustBubbleMapHeight, 100);
        setTimeout(adjustBubbleMapHeight, 300);
        setTimeout(adjustBubbleMapHeight, 500);
        setTimeout(adjustBubbleMapHeight, 1000);
        setTimeout(adjustBubbleMapHeight, 1500);
    }
});