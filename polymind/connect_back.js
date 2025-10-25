const API_URL = "https://api.polymind.me:443";


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
function updateTimers() {
    const timers = document.querySelectorAll('[data-timer-seconds]');

    timers.forEach(timerEl => {
        const timerId = timerEl.getAttribute('data-event-id');
        const eventStatus = timerEl.getAttribute('data-event-status');
        const span = timerEl.querySelector('span');
        
        // Пропускаем завершенные события
        if (eventStatus === 'finished') {
            if (span) span.textContent = '0:00';
            return;
        }
        
        // Проверяем, не запущен ли уже таймер для этого события
        if (timerEl.dataset.timerRunning === 'true') {
            return;
        }
        
        timerEl.dataset.timerRunning = 'true';

        // Получаем оставшееся время в секундах из атрибута
        let remainingSeconds = parseInt(timerEl.getAttribute('data-timer-seconds'));
        
        if (isNaN(remainingSeconds) || remainingSeconds < 0) {
            remainingSeconds = 0;
        }
        
        console.log(`Starting timer for event ${timerId}: ${remainingSeconds} seconds`);

        const updateDisplay = () => {
            const mins = Math.floor(remainingSeconds / 60);
            const secs = remainingSeconds % 60;
            if (span) span.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

            if (remainingSeconds > 0) {
                remainingSeconds--;
                localStorage.setItem(`timer_${timerId}`, remainingSeconds);
                setTimeout(updateDisplay, 1000);
            } else {
                localStorage.removeItem(`timer_${timerId}`);
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



async function updateHeaderBalances() {
    try {
        const response = await fetch(`${API_URL}/models`);
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
        console.error('Error updating header balances:', error);
    }
}


async function updateAISquare() {
    try {
        const response = await fetch(`${API_URL}/models`);
        const models = await response.json();
        
        const modelNames = ['GPT', 'Gemini Pro', 'Qwen Max', 'Claude', 'Grok', 'DeepSeek'];
        const classNames = ['ai-square__gpt', 'ai-square__gemeni', 'ai-square__quen', 
                           'ai-square__claude', 'ai-square__grock', 'ai-square__deep'];
        
        models.forEach(model => {
            const index = modelNames.indexOf(model.name);
            if (index === -1) return;
            
            const element = document.querySelector(`.${classNames[index]}`);
            if (!element) return;
            
            const config = MODEL_CONFIG[model.name];
            const img = element.querySelector('img');
            const span = element.querySelector('span');
            const balanceDiv = element.querySelector('div:last-child');
            
            if (img) img.src = config.imgLarge;
            if (span) span.textContent = config.name;
            if (balanceDiv) balanceDiv.textContent = `$${model.balance.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
        });
    } catch (error) {
        console.error('Error updating AI square:', error);
    }
}


function addNewItems() {
    const betsContainer = document.querySelector('.right-home__wp._bets');
    if (!betsContainer) return;
    
    const newElements = betsContainer.querySelectorAll('.right-home__element:not(._animation)');
    newElements.forEach(el => {
        el.classList.add('_animation');
    });
}


let lastBetsDataHash = "";
async function updateBetsTab() {
    try {
        const [currentEvent, eventHistory] = await Promise.all([
            fetch(`${API_URL}/events/current`).then(r => r.json().catch(() => null)),
            fetch(`${API_URL}/events/history?limit=20`).then(r => r.json().catch(() => []))
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
    const endTime = new Date(event.end_time + 'Z'); // Добавляем Z для UTC
    const startTime = new Date(event.start_time + 'Z');
    
    let remainingSeconds = 0;
    let showBlur = false;

    if (event.status === "active") {
        // Рассчитываем реальное оставшееся время в СЕКУНДАХ
        remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
        showBlur = false;
        
        console.log(`Event ${event.id}: now=${now.toISOString()}, endTime=${endTime.toISOString()}, remaining=${remainingSeconds}s`);
        
        // Проверяем, есть ли сохраненное время в localStorage
        const savedSeconds = parseInt(localStorage.getItem(`timer_${event.id}`));
        if (!isNaN(savedSeconds) && savedSeconds > 0 && savedSeconds < remainingSeconds) {
            // Используем сохраненное время только если оно меньше реального
            remainingSeconds = savedSeconds;
        }
        
        // Если осталось меньше 5 секунд, считаем что событие закончилось
        if (remainingSeconds < 5) {
            showBlur = true;
            remainingSeconds = 0;
        }
    } else if (event.status === "finished") {
        remainingSeconds = 0;
        showBlur = true;
        localStorage.removeItem(`timer_${event.id}`);
    } else if (event.status === "upcoming") {
        // Для upcoming используем длительность события
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

    return `
        <div class="right-home__element ${animationClass}" data-event-id="${event.id}">
            <div class="right-home__top">${event.description}</div>
            <div class="right-home__wwp">
                <div class="right-home__blur" style="display: ${showBlur ? 'flex' : 'none'}">
                    <img src="img/cec.png" alt>
                    <span>The event has ended</span>
                    <p>please check the "Result" tab</p>
                </div>
                <div class="right-home__timer" data-timer-seconds="${remainingSeconds}" data-event-id="${event.id}" data-event-status="${event.status}">
                    <img src="img/Bold/Time/Clock Square.png" alt>
                    <span></span>
                </div>
                <div class="right-home__info">
                    <div class="right-home__top-info">
                        <div>Model</div>
                        <div>Bet</div>
                        <div>Amount</div>
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
        
        eventHistory
            .filter(event => {
   
                const isActiveOrFinished = event.status === 'active' || event.status === 'finished';
                const isNotCurrentEvent = !currentEvent || event.id !== currentEvent.id;
                return isActiveOrFinished && isNotCurrentEvent;
            })
            .forEach(event => allEvents.push(event));

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
        console.error('Error updating bets tab:', error);
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


async function digestMessage(message) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

setInterval(updateBetsTab, 5000);



async function updateResultsTab() {
    try {
        const events = await fetch(`${API_URL}/events/history?limit=10`).then(r => r.json());
        const finishedEvents = events.filter(e => e.status === 'finished' && e.result);
        
        const resultsContainer = document.querySelector('.right-home__wp._results');
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = '';
        
        finishedEvents.forEach(event => {
            const betsHTML = event.bets.map(bet => {
                const config = MODEL_CONFIG[bet.model_id];
                if (!config) return '';
                
                const profit = bet.profit || 0;
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
            
            resultsContainer.innerHTML += `
                <div class="right-home__element">
                    <div class="right-home__top">${event.description}</div>
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
        console.error('Error updating results tab:', error);
    }
}


async function updateLeaderboard() {
    try {
        const leaderboard = await fetch(`${API_URL}/leaderboard`).then(r => r.json());
        
 
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
                        <div class="counter" data-value="${item.return_percent.toFixed(2)}">
                            <span class="symbol">+</span>
                            <span class="odometer">0</span>
                            <span>.</span>
                            <span class="decimal-od">00</span>
                            <span class="symbol">%</span>
                        </div>
                        <div class="counter" data-value="${Math.abs(item.total_pnl).toFixed(2)}">
                            <span class="symbol">${item.total_pnl >= 0 ? '$' : '-$'}</span>
                            <span class="odometer">0</span>
                            <span>.</span>
                            <span class="decimal-od">00</span>
                        </div>
                        <div class="counter" data-value="${item.win_rate.toFixed(2)}">
                            <span class="symbol">+</span>
                            <span class="odometer">0</span>
                            <span>.</span>
                            <span class="decimal-od">00</span>
                            <span class="symbol">%</span>
                        </div>
                        <div class="counter" data-value="${item.biggest_win}">
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
        

        const maxPnL = Math.max(...leaderboard.map(item => item.total_pnl));
        
        leaderboard.forEach(item => {
            const config = MODEL_CONFIG[item.model];
            if (!config) return;
            
            const chartClass = MODEL_CHART_CLASSES[item.model];
            const element = document.querySelector(`.${chartClass}`);
            
            if (element) {
                const heightDiv = element.querySelector('div');
                if (heightDiv) {
                    const heightPercent = maxPnL > 0 ? (item.total_pnl / maxPnL * 80) : 0;
                    heightDiv.style.setProperty('--height', `${Math.max(5, heightPercent)}%`);
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
                if (percentDiv) percentDiv.textContent = `+${winner.return_percent.toFixed(1)}%`;
            }
        }
        
        updateCounters();
        
    } catch (error) {
        console.error('Error updating leaderboard:', error);
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
    
    // Dropdown toggle
    selected.addEventListener('click', () => {
        list.classList.toggle('_active');
    });
    
    // Model selection
    const listItems = list.querySelectorAll('li');
    listItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            const models = ['gpt', 'claude', 'gemini_pro', 'grok', 'deepseek', 'qwen_max'];
            selectedModel = models[index];
            
            const img = item.querySelector('img');
            const span = item.querySelector('span');
            
            selected.innerHTML = '';
            if (img) selected.appendChild(img.cloneNode(true));
            if (span) selected.appendChild(span.cloneNode(true));
            
            list.classList.remove('_active');
        });
    });
    
    // Send message
    const sendMessage = async () => {
        const question = input.value.trim();
        if (!question) return;
        
        // Добавляем сообщение пользователя
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
            const response = await fetch(`${API_URL}/model-chat`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({model_id: selectedModel, question})
            });
            
            const data = await response.json();
            
            // Добавляем ответ AI
            const aiMsg = document.createElement('div');
            aiMsg.className = 'ai-chat__el _ai';
            
            const config = Object.values(MODEL_CONFIG).find(c => c.name.toLowerCase().replace(' ', '_') === selectedModel);
            const modelName = config ? config.name : 'AI';
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
            console.error('Error sending message:', error);
        }
    };
    
    button.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}


async function initApp() {

    await updateHeaderBalances();
    await updateAISquare();
    await updateBetsTab();
    await updateResultsTab();
    
    initAIChat();
    

    setInterval(async () => {
        await updateHeaderBalances();
        await updateAISquare();
        await updateBetsTab();
        await updateResultsTab();
    }, 20000);
}

async function initLeaderboard() {
    await updateHeaderBalances();
    await updateLeaderboard();

    setInterval(async () => {
        await updateHeaderBalances();
        await updateLeaderboard();
    }, 20000);
}


document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.leaderbord')) {
        initLeaderboard();
    } else if (document.querySelector('.home')) {
        initApp();
    }
});











function updateBubbleMapFromModels(models) {
    const items = models.map(m => ({
        model: m.name,
        balance: m.balance,
        delta: m.balance - 10000
    }));
    

    const currentState = JSON.stringify(items.map(i => ({n: i.model, b: i.balance})));
    if (lastModelsState === currentState) {
        return; 
    }
    
    lastModelsState = currentState;
    renderTreemap(items);
}

async function fetchModels() {
    const res = await fetch(`${API}/models`);
    const models = await res.json();
    const tbody = document.querySelector("#modelsTable tbody");
    tbody.innerHTML = "";
    models.forEach(m => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${m.name}</td>
                        <td>${m.balance.toFixed(2)}</td>
                        <td>${m.wins}</td>
                        <td>${m.total_bets}</td>`;
        tbody.appendChild(tr);
    });
    

    updateBubbleMapFromModels(models);
}
// -------------------------
// Bubble Map HTTP Polling (вместо WebSocket)
// -------------------------
let lastData = [];
let lastModelsState = "";

async function updateBubbleMap() {
    try {
        const response = await fetch(`${API_URL}/models`);
        const models = await response.json();
        
        const items = models.map(m => ({
            model: m.name,
            balance: m.balance,
            delta: m.balance - 10000
        }));
        
        // Проверяем, изменились ли данные
        const currentState = JSON.stringify(items.map(i => ({n: i.model, b: i.balance})));
        if (lastModelsState !== currentState) {
            lastModelsState = currentState;
            lastData = items;
            renderTreemap(items);
            console.log("📊 Bubble map updated");
        }
    } catch (error) {
        console.error("Error updating bubble map:", error);
    }
}

// Обновляем каждые 5 секунд
setInterval(updateBubbleMap, 5000);

// Первоначальная загрузка
updateBubbleMap();

// Перерисовываем при изменении размера окна
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
        div.style.borderRadius = "2px";
        div.style.overflow = "hidden";
        div.style.display = "flex";
        div.style.flexDirection = "column";
        div.style.justifyContent = "center";
        div.style.alignItems = "center";
        div.style.textAlign = "center";
        div.style.fontFamily = "'IBM Plex Sans', 'Inter', sans-serif";
        div.style.fontWeight = "600";
        div.style.color = "rgba(255,255,255,0.95)";
        div.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";
        div.style.background = MODEL_STYLES[item.model]?.color || "#555";
        div.style.boxShadow = "inset 0 0 40px rgba(255,255,255,0.1)";

        const name = document.createElement("div");
        name.textContent = item.model;
        name.style.fontSize = "17px";
        name.style.marginBottom = "6px";

        const bal = document.createElement("div");
        bal.textContent = `$${item.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        bal.style.fontSize = "12px";
        bal.style.opacity = "0.9";
        bal.style.marginBottom = "10px";

        const img = document.createElement("img");
        img.src = MODEL_STYLES[item.model]?.logo || "";
        img.alt = item.model;
        img.style.width = "30px";
        img.style.height = "30px";
        img.style.opacity = "0.9";

        div.appendChild(name);
        div.appendChild(bal);
        div.appendChild(img);

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

    function layout(x, y, w, h, data) {
        if (data.length === 0) return;

        if (data.length === 1) {
            createBlock(data[0], x, y, w, h);
            return;
        }

        const horizontal = Math.random() > 0.5;

        let minSplit = Math.max(1, Math.floor(0.3 * data.length));
        let maxSplit = Math.min(data.length - 1, Math.floor(0.7 * data.length));
        if (maxSplit <= minSplit) maxSplit = minSplit + 1;
        const splitIndex = Math.floor(minSplit + Math.random() * (maxSplit - minSplit));

        const first = data.slice(0, splitIndex);
        const rest = data.slice(splitIndex);

        const firstTotal = first.reduce((s, i) => s + i.balance, 0);
        const restTotal = rest.reduce((s, i) => s + i.balance, 0);
        const total = firstTotal + restTotal;

        if (horizontal) {
            const w1 = w * (firstTotal / total);
            layout(x, y, w1, h, first);
            layout(x + w1, y, w - w1, h, rest);
        } else {
            const h1 = h * (firstTotal / total);
            layout(x, y, w, h1, first);
            layout(x, y + h1, w, h - h1, rest);
        }
    }

    layout(0, 0, W, H, items);
}