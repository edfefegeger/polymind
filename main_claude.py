from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
from datetime import datetime, timedelta
from typing import List, Optional
import random
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = 'betting.db'

# Инициализация базы данных
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Таблица агентов (AI моделей)
    c.execute('''
        CREATE TABLE IF NOT EXISTS agents (
            id INTEGER PRIMARY KEY,
            name TEXT,
            balance REAL,
            total_bets INTEGER,
            wins INTEGER
        )
    ''')
    
    # Таблица истории (для графиков)
    c.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_id INTEGER,
            timestamp TEXT,
            balance REAL,
            winrate REAL,
            bet_amount REAL,
            won BOOLEAN
        )
    ''')
    
    # Таблица событий
    c.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            duration_minutes INTEGER DEFAULT 10,
            status TEXT DEFAULT 'pending',
            created_at TEXT,
            started_at TEXT,
            resolved_at TEXT,
            winning_side TEXT,
            current_yes_pool REAL DEFAULT 0,
            current_no_pool REAL DEFAULT 0
        )
    ''')
    
    # Таблица ставок на события
    c.execute('''
        CREATE TABLE IF NOT EXISTS event_bets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER,
            agent_id INTEGER,
            side TEXT,
            amount REAL,
            reasoning TEXT,
            created_at TEXT,
            FOREIGN KEY (event_id) REFERENCES events (id),
            FOREIGN KEY (agent_id) REFERENCES agents (id)
        )
    ''')
    
    # Таблица чата
    c.execute('''
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,
            agent_id INTEGER,
            event_id INTEGER,
            message TEXT,
            timestamp TEXT,
            FOREIGN KEY (agent_id) REFERENCES agents (id),
            FOREIGN KEY (event_id) REFERENCES events (id)
        )
    ''')
    
    # Инициализация 6 AI агентов
    c.execute("SELECT COUNT(*) FROM agents")
    if c.fetchone()[0] == 0:
        agents = [
            (1, "GPT-4", 10000.0, 0, 0),
            (2, "Claude", 10000.0, 0, 0),
            (3, "Grok", 10000.0, 0, 0),
            (4, "DeepSeek", 10000.0, 0, 0),
            (5, "Gemini", 10000.0, 0, 0),
            (6, "Qwen", 10000.0, 0, 0),
        ]
        c.executemany("INSERT INTO agents VALUES (?,?,?,?,?)", agents)
        
        # Начальная точка в истории для всех
        timestamp = datetime.now().isoformat()
        for agent_id in range(1, 7):
            c.execute(
                "INSERT INTO history (agent_id, timestamp, balance, winrate, bet_amount, won) VALUES (?,?,?,?,?,?)",
                (agent_id, timestamp, 10000.0, 50.0, 0, None)
            )
    
    conn.commit()
    conn.close()

init_db()

# Models
class BetRequest(BaseModel):
    agent_id: int
    amount: float
    won: bool

class AdminAddPoint(BaseModel):
    agent_id: int
    balance: float
    winrate: float
    bet_amount: Optional[float] = 0.0
    won: Optional[bool] = None
    timestamp: Optional[str] = None
    update_agent: Optional[bool] = True

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    duration_minutes: int = 10

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    status: Optional[str] = None

# WebSocket connections
active_connections: List[WebSocket] = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    
    # Отправляем текущие данные при подключении
    data = get_all_history()
    await websocket.send_json(data)
    
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in active_connections:
            active_connections.remove(websocket)

async def broadcast_update(data):
    for connection in list(active_connections):
        try:
            await connection.send_json(data)
        except:
            try:
                active_connections.remove(connection)
            except:
                pass

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Betting AI Backend with Events"}

@app.get("/agents")
def get_agents():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM agents")
    agents = []
    for row in c.fetchall():
        agents.append({
            "id": row[0],
            "name": row[1],
            "balance": row[2],
            "total_bets": row[3],
            "wins": row[4],
            "winrate": (row[4] / row[3] * 100) if row[3] > 0 else 50.0
        })
    conn.close()
    return agents

@app.get("/history")
def get_all_history():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, agent_id, timestamp, balance, winrate FROM history ORDER BY id ASC")
    
    history = {}
    for row in c.fetchall():
        id_, agent_id, timestamp, balance, winrate = row
        agent_id = str(agent_id)
        if agent_id not in history:
            history[agent_id] = []
        history[agent_id].append({
            "id": id_,
            "timestamp": timestamp,
            "balance": balance,
            "winrate": winrate
        })
    
    conn.close()
    return history

# ==================== CHAT API ====================

@app.get("/chat/messages")
def get_chat_messages(limit: int = 100):
    """Получить последние N сообщений чата"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        SELECT c.id, c.type, c.agent_id, a.name, c.event_id, c.message, c.timestamp
        FROM chat_messages c
        LEFT JOIN agents a ON c.agent_id = a.id
        ORDER BY c.id DESC
        LIMIT ?
    """, (limit,))
    
    messages = []
    for row in c.fetchall():
        messages.append({
            "id": row[0],
            "type": row[1],
            "agent_id": row[2],
            "agent_name": row[3],
            "event_id": row[4],
            "message": row[5],
            "timestamp": row[6]
        })
    
    conn.close()
    return list(reversed(messages))  # Возвращаем в хронологическом порядке

def add_chat_message(type: str, message: str, agent_id: int = None, event_id: int = None):
    """Добавить сообщение в чат"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    timestamp = datetime.now().isoformat()
    c.execute(
        "INSERT INTO chat_messages (type, agent_id, event_id, message, timestamp) VALUES (?,?,?,?,?)",
        (type, agent_id, event_id, message, timestamp)
    )
    conn.commit()
    conn.close()

# ==================== EVENTS API ====================

@app.get("/events")
def get_events():
    """Получить все события"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM events ORDER BY id DESC")
    
    events = []
    for row in c.fetchall():
        events.append({
            "id": row[0],
            "title": row[1],
            "description": row[2],
            "duration_minutes": row[3],
            "status": row[4],
            "created_at": row[5],
            "started_at": row[6],
            "resolved_at": row[7],
            "winning_side": row[8],
            "current_yes_pool": row[9],
            "current_no_pool": row[10]
        })
    
    conn.close()
    return events

@app.post("/events")
def create_event(event: EventCreate):
    """Создать новое событие"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    timestamp = datetime.now().isoformat()
    
    c.execute(
        "INSERT INTO events (title, description, duration_minutes, status, created_at) VALUES (?,?,?,?,?)",
        (event.title, event.description, event.duration_minutes, "pending", timestamp)
    )
    event_id = c.lastrowid
    
    conn.commit()
    conn.close()
    
    add_chat_message("system", f"📋 New event created: {event.title}", event_id=event_id)
    
    return {"success": True, "event_id": event_id}

@app.post("/events/{event_id}/start")
async def start_event(event_id: int):
    """Запустить событие - все AI модели делают ставки"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Проверяем существование события
    c.execute("SELECT title, status FROM events WHERE id = ?", (event_id,))
    event = c.fetchone()
    if not event:
        conn.close()
        return {"error": "Event not found"}
    
    if event[1] != "pending":
        conn.close()
        return {"error": "Event already started"}
    
    # Обновляем статус события
    started_at = datetime.now().isoformat()
    c.execute("UPDATE events SET status = 'active', started_at = ? WHERE id = ?", (started_at, event_id))
    
    # Получаем всех агентов
    c.execute("SELECT id, name, balance FROM agents")
    agents = c.fetchall()
    
    total_yes = 0
    total_no = 0
    
    # Каждый агент делает случайную ставку
    for agent in agents:
        agent_id, agent_name, balance = agent
        
        # Случайная сторона и сумма
        side = random.choice(["YES", "NO"])
        amount = round(random.uniform(100, 300), 2)
        
        # Генерируем reasoning
        reasonings = [
            "Technical indicators suggest strong momentum",
            "Historical patterns indicate high probability",
            "Market sentiment analysis favors this outcome",
            "Risk/reward ratio is optimal for this position",
            "Volume analysis confirms the direction",
            "Price action shows clear signals"
        ]
        reasoning = random.choice(reasonings)
        
        # Сохраняем ставку
        c.execute(
            "INSERT INTO event_bets (event_id, agent_id, side, amount, reasoning, created_at) VALUES (?,?,?,?,?,?)",
            (event_id, agent_id, side, amount, reasoning, started_at)
        )
        
        # Добавляем в пулы
        if side == "YES":
            total_yes += amount
        else:
            total_no += amount
        
        # Сообщение о ставке в чат
        add_chat_message(
            "bet",
            f"💰 {agent_name} placed a {side} bet (${amount:.2f})",
            agent_id=agent_id,
            event_id=event_id
        )
        
        # Reasoning в чат
        add_chat_message(
            "reasoning",
            f"💭 {agent_name}: {reasoning}",
            agent_id=agent_id,
            event_id=event_id
        )
    
    # Обновляем пулы события
    c.execute(
        "UPDATE events SET current_yes_pool = ?, current_no_pool = ? WHERE id = ?",
        (total_yes, total_no, event_id)
    )
    
    conn.commit()
    conn.close()
    
    # Системное сообщение о старте
    add_chat_message("system", f"🚀 Event started: {event[0]}", event_id=event_id)
    
    # Broadcast update
    updated_history = get_all_history()
    await broadcast_update(updated_history)
    
    return {"success": True, "yes_pool": total_yes, "no_pool": total_no}

@app.post("/events/{event_id}/resolve")
async def resolve_event(event_id: int, winning_side: str):
    """Завершить событие и распределить выигрыши"""
    if winning_side not in ["YES", "NO"]:
        return {"error": "winning_side must be YES or NO"}
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Проверяем событие
    c.execute("SELECT title, status FROM events WHERE id = ?", (event_id,))
    event = c.fetchone()
    if not event:
        conn.close()
        return {"error": "Event not found"}
    
    if event[1] != "active":
        conn.close()
        return {"error": "Event is not active"}
    
    # Получаем все ставки на это событие
    c.execute("""
        SELECT eb.agent_id, a.name, eb.side, eb.amount
        FROM event_bets eb
        JOIN agents a ON eb.agent_id = a.id
        WHERE eb.event_id = ?
    """, (event_id,))
    
    bets = c.fetchall()
    
    # Обрабатываем результаты
    for bet in bets:
        agent_id, agent_name, side, amount = bet
        won = (side == winning_side)
        
        # Обновляем баланс агента
        c.execute("SELECT balance, total_bets, wins FROM agents WHERE id = ?", (agent_id,))
        row = c.fetchone()
        balance, total_bets, wins = row
        
        new_balance = balance + amount if won else balance - amount
        new_total = total_bets + 1
        new_wins = wins + 1 if won else wins
        new_winrate = (new_wins / new_total * 100)
        
        c.execute(
            "UPDATE agents SET balance = ?, total_bets = ?, wins = ? WHERE id = ?",
            (new_balance, new_total, new_wins, agent_id)
        )
        
        # Добавляем в историю
        timestamp = datetime.now().isoformat()
        c.execute(
            "INSERT INTO history (agent_id, timestamp, balance, winrate, bet_amount, won) VALUES (?,?,?,?,?,?)",
            (agent_id, timestamp, new_balance, new_winrate, amount, won)
        )
        
        # Сообщение в чат о результате
        if won:
            add_chat_message(
                "result",
                f"✅ {agent_name} won the bet (+${amount:.2f}) | Balance: ${new_balance:.2f}",
                agent_id=agent_id,
                event_id=event_id
            )
        else:
            add_chat_message(
                "result",
                f"❌ {agent_name} lost the bet (-${amount:.2f}) | Balance: ${new_balance:.2f}",
                agent_id=agent_id,
                event_id=event_id
            )
    
    # Обновляем статус события
    resolved_at = datetime.now().isoformat()
    c.execute(
        "UPDATE events SET status = 'resolved', resolved_at = ?, winning_side = ? WHERE id = ?",
        (resolved_at, winning_side, event_id)
    )
    
    conn.commit()
    conn.close()
    
    # Системное сообщение
    add_chat_message("system", f"🏁 Event resolved: {event[0]} - {winning_side} wins!", event_id=event_id)
    
    # Broadcast update
    updated_history = get_all_history()
    await broadcast_update(updated_history)
    
    return {"success": True, "winning_side": winning_side}

@app.put("/events/{event_id}")
def update_event(event_id: int, event: EventUpdate):
    """Обновить событие"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    updates = []
    params = []
    
    if event.title is not None:
        updates.append("title = ?")
        params.append(event.title)
    if event.description is not None:
        updates.append("description = ?")
        params.append(event.description)
    if event.duration_minutes is not None:
        updates.append("duration_minutes = ?")
        params.append(event.duration_minutes)
    if event.status is not None:
        updates.append("status = ?")
        params.append(event.status)
    
    if not updates:
        conn.close()
        return {"error": "No fields to update"}
    
    params.append(event_id)
    query = f"UPDATE events SET {', '.join(updates)} WHERE id = ?"
    
    c.execute(query, params)
    conn.commit()
    conn.close()
    
    return {"success": True}

@app.delete("/events/{event_id}")
def delete_event(event_id: int):
    """Удалить событие"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute("DELETE FROM event_bets WHERE event_id = ?", (event_id,))
    c.execute("DELETE FROM chat_messages WHERE event_id = ?", (event_id,))
    c.execute("DELETE FROM events WHERE id = ?", (event_id,))
    
    conn.commit()
    conn.close()
    
    return {"success": True}

# ==================== OLD API ====================

@app.post("/bet")
async def place_bet(bet: BetRequest):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute("SELECT balance, total_bets, wins FROM agents WHERE id = ?", (bet.agent_id,))
    row = c.fetchone()
    
    if not row:
        conn.close()
        return {"error": "Agent not found"}
    
    balance, total_bets, wins = row
    
    new_balance = balance + bet.amount if bet.won else balance - bet.amount
    new_total = total_bets + 1
    new_wins = wins + 1 if bet.won else wins
    new_winrate = (new_wins / new_total * 100)
    
    c.execute(
        "UPDATE agents SET balance = ?, total_bets = ?, wins = ? WHERE id = ?",
        (new_balance, new_total, new_wins, bet.agent_id)
    )
    
    timestamp = datetime.now().isoformat()
    c.execute(
        "INSERT INTO history (agent_id, timestamp, balance, winrate, bet_amount, won) VALUES (?,?,?,?,?,?)",
        (bet.agent_id, timestamp, new_balance, new_winrate, bet.amount, bet.won)
    )
    
    conn.commit()
    conn.close()
    
    updated_history = get_all_history()
    await broadcast_update(updated_history)
    
    return {
        "success": True,
        "agent_id": bet.agent_id,
        "new_balance": new_balance,
        "new_winrate": new_winrate
    }

@app.post("/simulate_random_bets")
async def simulate_random_bets(count: int = 10):
    results = []
    
    for _ in range(count):
        agent_id = random.randint(1, 6)
        amount = round(random.uniform(10, 100), 2)
        won = random.choice([True, False])
        
        bet = BetRequest(agent_id=agent_id, amount=amount, won=won)
        result = await place_bet(bet)
        results.append(result)
    
    return {"simulated": count, "results": results}

@app.post("/reset")
def reset_database():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute("DELETE FROM history")
    c.execute("DELETE FROM events")
    c.execute("DELETE FROM event_bets")
    c.execute("DELETE FROM chat_messages")
    c.execute("UPDATE agents SET balance = 10000.0, total_bets = 0, wins = 0")
    
    timestamp = datetime.now().isoformat()
    for agent_id in range(1, 7):
        c.execute(
            "INSERT INTO history (agent_id, timestamp, balance, winrate, bet_amount, won) VALUES (?,?,?,?,?,?)",
            (agent_id, timestamp, 10000.0, 50.0, 0, None)
        )
    
    conn.commit()
    conn.close()
    
    return {"success": True, "message": "Database reset"}

# ==================== ADMIN API ====================

@app.post("/admin/add_point")
async def admin_add_point(point: AdminAddPoint):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    ts = point.timestamp or datetime.now().isoformat()
    c.execute(
        "INSERT INTO history (agent_id, timestamp, balance, winrate, bet_amount, won) VALUES (?,?,?,?,?,?)",
        (point.agent_id, ts, point.balance, point.winrate, point.bet_amount, point.won)
    )
    
    if point.update_agent and point.won is not None:
        c.execute("SELECT balance, total_bets, wins FROM agents WHERE id = ?", (point.agent_id,))
        row = c.fetchone()
        if row:
            balance, total_bets, wins = row
            new_total = total_bets + 1
            new_wins = wins + (1 if point.won else 0)
            new_balance = point.balance
            c.execute(
                "UPDATE agents SET balance = ?, total_bets = ?, wins = ? WHERE id = ?",
                (new_balance, new_total, new_wins, point.agent_id)
            )
    conn.commit()
    conn.close()
    
    updated_history = get_all_history()
    await broadcast_update(updated_history)
    return {"success": True}

@app.get("/admin/history_list")
def admin_history_list():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, agent_id, timestamp, balance, winrate, bet_amount, won FROM history ORDER BY id ASC")
    rows = c.fetchall()
    conn.close()
    items = []
    for r in rows:
        items.append({
            "id": r[0],
            "agent_id": r[1],
            "timestamp": r[2],
            "balance": r[3],
            "winrate": r[4],
            "bet_amount": r[5],
            "won": bool(r[6]) if r[6] is not None else None
        })
    return items

@app.delete("/admin/delete_point/{point_id}")
async def admin_delete_point(point_id: int):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM history WHERE id = ?", (point_id,))
    conn.commit()
    conn.close()
    updated_history = get_all_history()
    await broadcast_update(updated_history)
    return {"success": True, "deleted": point_id}

@app.post("/admin/recompute_agents")
def admin_recompute_agents():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id FROM agents")
    agent_ids = [r[0] for r in c.fetchall()]
    for aid in agent_ids:
        c.execute("SELECT balance FROM history WHERE agent_id = ? ORDER BY id DESC LIMIT 1", (aid,))
        last = c.fetchone()
        last_balance = last[0] if last else 10000.0
        c.execute("SELECT COUNT(*) FROM history WHERE agent_id = ? AND won IS NOT NULL", (aid,))
        total_bets = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM history WHERE agent_id = ? AND won = 1", (aid,))
        wins = c.fetchone()[0]
        c.execute("UPDATE agents SET balance = ?, total_bets = ?, wins = ? WHERE id = ?", (last_balance, total_bets, wins, aid))
    conn.commit()
    conn.close()
    return {"success": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)