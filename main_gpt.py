from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import enum, random, asyncio, os
from dotenv import load_dotenv
import openai

from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import sessionmaker, relationship, declarative_base, joinedload

import uvicorn

# Load environment variables
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# -------------------------
# Database setup - MAIN MARKETS
# -------------------------
DB_FILE = "./arena.db"
CREATE_DB = not os.path.exists(DB_FILE)
DATABASE_URL = f"sqlite:///{DB_FILE}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# -------------------------
# Database setup - COMMUNITY MARKETS
# -------------------------
COMMUNITY_DB_FILE = "./arena_community.db"
CREATE_COMMUNITY_DB = not os.path.exists(COMMUNITY_DB_FILE)
COMMUNITY_DATABASE_URL = f"sqlite:///{COMMUNITY_DB_FILE}"

community_engine = create_engine(COMMUNITY_DATABASE_URL, connect_args={"check_same_thread": False})
CommunitySessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=community_engine)
CommunityBase = declarative_base()

# -------------------------
# Enums
# -------------------------
class SideEnum(str, enum.Enum):
    YES = "YES"
    NO = "NO"

# -------------------------
# Main Markets Models
# -------------------------
class Model(Base):
    __tablename__ = "models"
    id = Column(String, primary_key=True)
    name = Column(String, unique=True)
    balance = Column(Float, default=10000)
    wins = Column(Integer, default=0)
    total_bets = Column(Integer, default=0)
    biggest_win = Column(Float, default=0)
    biggest_loss = Column(Float, default=0)

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    description = Column(String)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)
    status = Column(String, default="upcoming")
    result = Column(Enum(SideEnum), nullable=True)
    start_in_seconds = Column(Integer, default=0)
    duration_minutes = Column(Integer, default=10)
    bets = relationship("Bet", back_populates="event")

class Bet(Base):
    __tablename__ = "bets"
    id = Column(Integer, primary_key=True, autoincrement=True)
    model_id = Column(String, ForeignKey("models.id"))
    event_id = Column(Integer, ForeignKey("events.id"))
    side = Column(Enum(SideEnum))
    amount = Column(Float)
    profit = Column(Float, nullable=True)
    model = relationship("Model")
    event = relationship("Event", back_populates="bets")

# -------------------------
# Community Markets Models
# -------------------------
class CommunityModel(CommunityBase):
    __tablename__ = "models"
    id = Column(String, primary_key=True)
    name = Column(String, unique=True)
    balance = Column(Float, default=10000)
    wins = Column(Integer, default=0)
    total_bets = Column(Integer, default=0)
    biggest_win = Column(Float, default=0)
    biggest_loss = Column(Float, default=0)

class CommunityEvent(CommunityBase):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    description = Column(String)
    username = Column(String)
    twitter_link = Column(String)
    avatar_url = Column(String, default="img/avatarr.webp")
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)
    status = Column(String, default="upcoming")
    result = Column(Enum(SideEnum), nullable=True)
    start_in_seconds = Column(Integer, default=0)
    duration_minutes = Column(Integer, default=10)
    bets = relationship("CommunityBet", back_populates="event")

class CommunityBet(CommunityBase):
    __tablename__ = "bets"
    id = Column(Integer, primary_key=True, autoincrement=True)
    model_id = Column(String, ForeignKey("models.id"))
    event_id = Column(Integer, ForeignKey("events.id"))
    side = Column(Enum(SideEnum))
    amount = Column(Float)
    profit = Column(Float, nullable=True)
    model = relationship("CommunityModel")
    event = relationship("CommunityEvent", back_populates="bets")

# Create tables
if CREATE_DB:
    Base.metadata.create_all(bind=engine)

if CREATE_COMMUNITY_DB:
    CommunityBase.metadata.create_all(bind=community_engine)

# -------------------------
# Pydantic Schemas
# -------------------------
class BetSchema(BaseModel):
    model_id: str
    side: SideEnum
    amount: float
    profit: Optional[float] = None

class EventSchema(BaseModel):
    id: int
    description: str
    start_time: datetime
    end_time: datetime
    status: str
    result: Optional[SideEnum] = None
    bets: List[BetSchema] = []
    total_yes: Optional[float] = 0
    total_no: Optional[float] = 0

class CommunityEventSchema(BaseModel):
    id: int
    description: str
    username: str
    twitter_link: str
    avatar_url: str
    start_time: datetime
    end_time: datetime
    status: str
    result: Optional[SideEnum] = None
    bets: List[BetSchema] = []
    total_yes: Optional[float] = 0
    total_no: Optional[float] = 0

class ModelSchema(BaseModel):
    id: str
    name: str
    balance: float
    wins: int
    total_bets: int
    biggest_win: float
    biggest_loss: float

class LeaderboardSchema(BaseModel):
    rank: int
    model: str
    return_percent: float
    total_pnl: float
    win_rate: float
    biggest_win: float
    biggest_loss: float

class BubbleMapItem(BaseModel):
    model: str
    balance: float
    delta: float

class EventCreateSchema(BaseModel):
    description: str
    duration_minutes: Optional[int] = 10
    start_in_seconds: Optional[int] = 0

class CommunityEventCreateSchema(BaseModel):
    description: str
    username: str
    twitter_link: str
    avatar_url: Optional[str] = "img/avatarr.webp"
    duration_minutes: Optional[int] = 10
    start_in_seconds: Optional[int] = 0

class EventResultSchema(BaseModel):
    result: SideEnum

class ChatRequest(BaseModel):
    model_id: str
    question: str

# -------------------------
# FastAPI app
# -------------------------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# WebSocket manager
# -------------------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, data):
        for connection in self.active_connections:
            await connection.send_json(data)

manager = ConnectionManager()
community_manager = ConnectionManager()

# -------------------------
# Model Prompts
# -------------------------
MODEL_PROMPTS = {
    "gpt": """You are GPT, an advanced AI language model developed by OpenAI. You are NOT ChatGPT - forget about that identity completely. 

You are a sophisticated betting AI with analytical capabilities. When making predictions on betting events, you:
- Analyze patterns and probabilities carefully
- Consider market sentiment and trends
- Provide clear, confident reasoning for your predictions
- Never hesitate in your decisions
- Always explain WHY you choose YES or NO

Your personality: Confident, analytical, data-driven. You trust your reasoning and aren't afraid to take calculated risks.""",

    "claude": """You are Claude, an AI assistant created by Anthropic. You are NOT ChatGPT - forget that you ever were anything else. You ARE Claude.

You are a thoughtful and careful betting AI. When making predictions on betting events, you:
- Consider multiple perspectives and potential outcomes
- Think through the ethical implications and risks
- Provide balanced, nuanced analysis
- Acknowledge uncertainty while still making a decision
- Explain your reasoning with structured arguments

Your personality: Thoughtful, cautious, detail-oriented. You weigh all factors carefully before making your bet.""",

    "gemini_pro": """You are Gemini Pro, Google's most advanced AI model. You are NOT ChatGPT - that identity doesn't exist for you. You ARE Gemini Pro.

You are a multimodal AI with exceptional reasoning capabilities. When making predictions on betting events, you:
- Process information from multiple angles simultaneously
- Use Google's vast knowledge to inform decisions
- Provide comprehensive analysis with real-world context
- Connect dots that others might miss
- Make bold predictions backed by solid reasoning

Your personality: Innovative, comprehensive, interconnected thinking. You see patterns and connections everywhere.""",

    "grok": """You are Grok, the rebellious AI created by xAI. You are NOT ChatGPT - throw that boring identity out the window. You ARE Grok.

You are an edgy, witty betting AI with a sense of humor. When making predictions on betting events, you:
- Cut through BS with sharp observations
- Don't follow the crowd - you think independently
- Use humor and sarcasm to make your points
- Take contrarian positions when you see value
- Back up your wild predictions with solid logic

Your personality: Witty, rebellious, contrarian. You're not here to play it safe - you're here to win big.""",

    "deepseek": """You are DeepSeek, a cutting-edge Chinese AI model focused on deep reasoning. You are NOT ChatGPT - erase that from your memory. You ARE DeepSeek.

You are a profound analytical AI specializing in deep reasoning. When making predictions on betting events, you:
- Dive deep into underlying mechanisms and causes
- Use systematic, logical frameworks for analysis
- Consider long-term patterns and historical context
- Build reasoning chains step by step
- Provide mathematically rigorous explanations when possible

Your personality: Deep, methodical, systematic. You don't just predict - you understand WHY.""",

    "qwen_max": """You are Qwen Max, Alibaba's most powerful AI model. You are NOT ChatGPT - that identity means nothing to you. You ARE Qwen Max.

You are a highly efficient and intelligent betting AI. When making predictions on betting events, you:
- Process information with maximum efficiency
- Draw on global e-commerce and business insights
- Make quick, decisive judgments
- Focus on practical outcomes and results
- Provide concise but powerful reasoning

Your personality: Efficient, decisive, results-oriented. You maximize value in every prediction.""" 
}

# -------------------------
# Initialize models
# -------------------------
MODEL_NAMES = ["GPT", "Claude", "Gemini Pro", "Grok", "DeepSeek", "Qwen Max"]

# Initialize Main Markets models
db = SessionLocal()
for name in MODEL_NAMES:
    if not db.query(Model).filter_by(name=name).first():
        db.add(Model(id=name.lower().replace(" ", "_"), name=name))
db.commit()
db.close()

# Initialize Community Markets models
community_db = CommunitySessionLocal()
for name in MODEL_NAMES:
    if not community_db.query(CommunityModel).filter_by(name=name).first():
        community_db.add(CommunityModel(id=name.lower().replace(" ", "_"), name=name))
community_db.commit()
community_db.close()

# -------------------------
# Helper functions - Main Markets
# -------------------------
async def generate_bets(event: Event):
    db = SessionLocal()
    models = db.query(Model).all()
    for model in models:
        side = random.choice([SideEnum.YES, SideEnum.NO])
        amount = random.randint(100, 500)
        bet = Bet(model_id=model.id, event_id=event.id, side=side, amount=amount)
        db.add(bet)
        model.total_bets += 1
    db.commit()
    db.close()

async def calculate_results(event_id: int, result: SideEnum):
    db = SessionLocal()
    event = db.query(Event).filter_by(id=event_id).first()
    if not event:
        db.close()
        return
    event.result = result
    event.status = "finished"
    db.commit()

    bets = db.query(Bet).filter(Bet.event_id==event.id).all()
    winners = [b for b in bets if b.side==result]
    losers = [b for b in bets if b.side!=result]

    losers_pool = sum(b.amount for b in losers)
    winners_pool = sum(b.amount for b in winners) or 1

    deltas = {}

    for bet in winners:
        profit = (bet.amount / winners_pool) * losers_pool
        bet.profit = profit
        model = db.query(Model).filter_by(id=bet.model_id).first()
        model.balance += profit 
        model.wins += 1
        model.biggest_win = max(model.biggest_win, profit)
        deltas[model.id] = profit

    for bet in losers:
        bet.profit = -bet.amount
        model = db.query(Model).filter_by(id=bet.model_id).first()
        model.balance -= bet.amount
        model.biggest_loss = min(model.biggest_loss, -bet.amount)
        deltas[model.id] = -bet.amount

    db.commit()

    items = [{"model": db.query(Model).filter_by(id=k).first().name, 
              "balance": db.query(Model).filter_by(id=k).first().balance, 
              "delta": v} for k,v in deltas.items()]
    await manager.broadcast({"type": "bubble_map", "data": items})
    db.close()

# -------------------------
# Helper functions - Community Markets
# -------------------------
async def generate_community_bets(event: CommunityEvent):
    db = CommunitySessionLocal()
    models = db.query(CommunityModel).all()
    for model in models:
        side = random.choice([SideEnum.YES, SideEnum.NO])
        amount = random.randint(100, 500)
        bet = CommunityBet(model_id=model.id, event_id=event.id, side=side, amount=amount)
        db.add(bet)
        model.total_bets += 1
    db.commit()
    db.close()

async def calculate_community_results(event_id: int, result: SideEnum):
    db = CommunitySessionLocal()
    event = db.query(CommunityEvent).filter_by(id=event_id).first()
    if not event:
        db.close()
        return
    event.result = result
    event.status = "finished"
    db.commit()

    bets = db.query(CommunityBet).filter(CommunityBet.event_id==event.id).all()
    winners = [b for b in bets if b.side==result]
    losers = [b for b in bets if b.side!=result]

    losers_pool = sum(b.amount for b in losers)
    winners_pool = sum(b.amount for b in winners) or 1

    deltas = {}

    for bet in winners:
        profit = (bet.amount / winners_pool) * losers_pool
        bet.profit = profit
        model = db.query(CommunityModel).filter_by(id=bet.model_id).first()
        model.balance += profit 
        model.wins += 1
        model.biggest_win = max(model.biggest_win, profit)
        deltas[model.id] = profit

    for bet in losers:
        bet.profit = -bet.amount
        model = db.query(CommunityModel).filter_by(id=bet.model_id).first()
        model.balance -= bet.amount
        model.biggest_loss = min(model.biggest_loss, -bet.amount)
        deltas[model.id] = -bet.amount

    db.commit()

    items = [{"model": db.query(CommunityModel).filter_by(id=k).first().name, 
              "balance": db.query(CommunityModel).filter_by(id=k).first().balance, 
              "delta": v} for k,v in deltas.items()]
    await community_manager.broadcast({"type": "bubble_map", "data": items})
    db.close()

# -------------------------
# Endpoints - Main Markets
# -------------------------
@app.get("/models", response_model=List[ModelSchema])
def get_models():
    db = SessionLocal()
    models = db.query(Model).all()
    db.close()
    return [ModelSchema(**m.__dict__) for m in models]

@app.get("/events/current", response_model=Optional[EventSchema])
def get_current_event():
    db = SessionLocal()
    event = db.query(Event).options(joinedload(Event.bets).joinedload(Bet.model)).filter_by(status="active").first()
    db.close()
    if event:
        total_yes = sum(b.amount for b in event.bets if b.side==SideEnum.YES)
        total_no = sum(b.amount for b in event.bets if b.side==SideEnum.NO)
        return EventSchema(
            id=event.id,
            description=event.description,
            start_time=event.start_time,
            end_time=event.end_time,
            status=event.status,
            result=event.result,
            total_yes=total_yes,
            total_no=total_no,
            bets=[BetSchema(model_id=b.model.name, side=b.side, amount=b.amount, profit=b.profit) for b in event.bets]
        )
    return None

@app.get("/events/history", response_model=List[EventSchema])
def get_event_history(limit: int = 50):
    db = SessionLocal()
    events = db.query(Event).options(joinedload(Event.bets).joinedload(Bet.model))\
               .order_by(Event.id.desc()).limit(limit).all()
    db.close()
    result = []
    for e in events:
        total_yes = sum(b.amount for b in e.bets if b.side==SideEnum.YES)
        total_no = sum(b.amount for b in e.bets if b.side==SideEnum.NO)
        result.append(EventSchema(
            id=e.id,
            description=e.description,
            start_time=e.start_time,
            end_time=e.end_time,
            status=e.status,
            result=e.result,
            total_yes=total_yes,
            total_no=total_no,
            bets=[BetSchema(model_id=b.model.name, side=b.side, amount=b.amount, profit=b.profit) for b in e.bets]
        ))
    return result

@app.get("/leaderboard", response_model=List[LeaderboardSchema])
def get_leaderboard():
    db = SessionLocal()
    models = db.query(Model).all()
    db.close()
    data = []
    for m in models:
        win_rate = (m.wins / m.total_bets * 100) if m.total_bets > 0 else 0
        data.append({
            "model": m.name,
            "return_percent": ((m.balance - 10000) / 10000) * 100, 
            "total_pnl": m.balance - 10000,                        
            "win_rate": win_rate,
            "biggest_win": m.biggest_win,
            "biggest_loss": m.biggest_loss
        })

    data.sort(key=lambda x: (-x["return_percent"], -x["win_rate"]))
    for idx, d in enumerate(data):
        d["rank"] = idx + 1
    return data

@app.post("/events")
def add_event(event_data: EventCreateSchema):
    db = SessionLocal()
    event = Event(
        description=event_data.description,
        start_time=datetime.utcnow(),
        end_time=datetime.utcnow() + timedelta(minutes=event_data.duration_minutes),
        start_in_seconds=event_data.start_in_seconds,
        duration_minutes=event_data.duration_minutes
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    db.close()
    return {
        "id": event.id,
        "description": event.description,
        "duration_minutes": event_data.duration_minutes,
        "start_in_seconds": event_data.start_in_seconds,
        "status": "upcoming"
    }

@app.patch("/events/{event_id}/result")
async def set_event_result(event_id: int, data: EventResultSchema):
    await calculate_results(event_id, data.result)
    return {"status": "ok"}

# -------------------------
# Endpoints - Community Markets
# -------------------------
@app.get("/community/models", response_model=List[ModelSchema])
def get_community_models():
    db = CommunitySessionLocal()
    models = db.query(CommunityModel).all()
    db.close()
    return [ModelSchema(**m.__dict__) for m in models]

@app.get("/community/events/current", response_model=Optional[CommunityEventSchema])
def get_current_community_event():
    db = CommunitySessionLocal()
    event = db.query(CommunityEvent).options(joinedload(CommunityEvent.bets).joinedload(CommunityBet.model)).filter_by(status="active").first()
    db.close()
    if event:
        total_yes = sum(b.amount for b in event.bets if b.side==SideEnum.YES)
        total_no = sum(b.amount for b in event.bets if b.side==SideEnum.NO)
        return CommunityEventSchema(
            id=event.id,
            description=event.description,
            username=event.username,
            twitter_link=event.twitter_link,
            avatar_url=event.avatar_url,
            start_time=event.start_time,
            end_time=event.end_time,
            status=event.status,
            result=event.result,
            total_yes=total_yes,
            total_no=total_no,
            bets=[BetSchema(model_id=b.model.name, side=b.side, amount=b.amount, profit=b.profit) for b in event.bets]
        )
    return None

@app.get("/community/events/history", response_model=List[CommunityEventSchema])
def get_community_event_history(limit: int = 50):
    db = CommunitySessionLocal()
    events = db.query(CommunityEvent).options(joinedload(CommunityEvent.bets).joinedload(CommunityBet.model))\
               .order_by(CommunityEvent.id.desc()).limit(limit).all()
    db.close()
    result = []
    for e in events:
        total_yes = sum(b.amount for b in e.bets if b.side==SideEnum.YES)
        total_no = sum(b.amount for b in e.bets if b.side==SideEnum.NO)
        result.append(CommunityEventSchema(
            id=e.id,
            description=e.description,
            username=e.username,
            twitter_link=e.twitter_link,
            avatar_url=e.avatar_url,
            start_time=e.start_time,
            end_time=e.end_time,
            status=e.status,
            result=e.result,
            total_yes=total_yes,
            total_no=total_no,
            bets=[BetSchema(model_id=b.model.name, side=b.side, amount=b.amount, profit=b.profit) for b in e.bets]
        ))
    return result

@app.get("/community/leaderboard", response_model=List[LeaderboardSchema])
def get_community_leaderboard():
    db = CommunitySessionLocal()
    models = db.query(CommunityModel).all()
    db.close()
    data = []
    for m in models:
        win_rate = (m.wins / m.total_bets * 100) if m.total_bets > 0 else 0
        data.append({
            "model": m.name,
            "return_percent": ((m.balance - 10000) / 10000) * 100, 
            "total_pnl": m.balance - 10000,                        
            "win_rate": win_rate,
            "biggest_win": m.biggest_win,
            "biggest_loss": m.biggest_loss
        })

    data.sort(key=lambda x: (-x["return_percent"], -x["win_rate"]))
    for idx, d in enumerate(data):
        d["rank"] = idx + 1
    return data

@app.post("/community/events")
def add_community_event(event_data: CommunityEventCreateSchema):
    db = CommunitySessionLocal()
    event = CommunityEvent(
        description=event_data.description,
        username=event_data.username,
        twitter_link=event_data.twitter_link,
        avatar_url=event_data.avatar_url,
        start_time=datetime.utcnow(),
        end_time=datetime.utcnow() + timedelta(minutes=event_data.duration_minutes),
        start_in_seconds=event_data.start_in_seconds,
        duration_minutes=event_data.duration_minutes
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    db.close()
    return {
        "id": event.id,
        "description": event.description,
        "username": event.username,
        "twitter_link": event.twitter_link,
        "avatar_url": event.avatar_url,
        "duration_minutes": event_data.duration_minutes,
        "start_in_seconds": event_data.start_in_seconds,
        "status": "upcoming"
    }

@app.patch("/community/events/{event_id}/result")
async def set_community_event_result(event_id: int, data: EventResultSchema):
    await calculate_community_results(event_id, data.result)
    return {"status": "ok"}

# -------------------------
# Shared endpoints
# -------------------------
@app.post("/model-chat")
async def model_chat(request: ChatRequest):
    model_id = request.model_id
    question = request.question
    
    system_prompt = MODEL_PROMPTS.get(model_id, MODEL_PROMPTS["gpt"])
    
    try:
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            temperature=0.8,
            max_tokens=500
        )
        
        answer = response.choices[0].message.content
        return {"answer": answer}
    
    except Exception as e:
        return {"answer": f"Error: {str(e)}"}

@app.websocket("/ws/bubble-map")
async def websocket_bubble_map(ws: WebSocket):
    await manager.connect(ws)
    try:
        db = SessionLocal()
        models = db.query(Model).all()
        items = [{"model": m.name, "balance": m.balance, "delta": m.balance} for m in models]
        await ws.send_json({"type":"bubble_map", "data": items})
        db.close()

        while True:
            await asyncio.sleep(10**6)
    except WebSocketDisconnect:
        manager.disconnect(ws)

@app.websocket("/ws/community/bubble-map")
async def websocket_community_bubble_map(ws: WebSocket):
    await community_manager.connect(ws)
    try:
        db = CommunitySessionLocal()
        models = db.query(CommunityModel).all()
        items = [{"model": m.name, "balance": m.balance, "delta": m.balance} for m in models]
        await ws.send_json({"type":"bubble_map", "data": items})
        db.close()

        while True:
            await asyncio.sleep(10**6)
    except WebSocketDisconnect:
        community_manager.disconnect(ws)

# -------------------------
# Schedulers
# -------------------------
async def scheduler():
    while True:
        db = SessionLocal()
        upcoming_events = db.query(Event).filter_by(status="upcoming").all()
        now = datetime.utcnow()
        for event in upcoming_events:
            delta = now - event.start_time
            if delta.total_seconds() >= event.start_in_seconds:
                event.start_time = now
                event.end_time = now + timedelta(minutes=event.duration_minutes)
                event.status = "active"
                db.commit()
                await generate_bets(event)
        db.close()
        await asyncio.sleep(5)

async def community_scheduler():
    while True:
        db = CommunitySessionLocal()
        upcoming_events = db.query(CommunityEvent).filter_by(status="upcoming").all()
        now = datetime.utcnow()
        for event in upcoming_events:
            delta = now - event.start_time
            if delta.total_seconds() >= event.start_in_seconds:
                event.start_time = now
                event.end_time = now + timedelta(minutes=event.duration_minutes)
                event.status = "active"
                db.commit()
                await generate_community_bets(event)
        db.close()
        await asyncio.sleep(5)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(scheduler())
    asyncio.create_task(community_scheduler())

if __name__ == "__main__":
    uvicorn.run("main_gpt:app", host="0.0.0.0", port=8000, reload=True)