from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import (
    delete_transaction,
    get_all_transactions,
    init_db,
    insert_transaction,
    update_transaction,
)
from ml_service import cluster_transactions


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class TransactionCreate(BaseModel):
    date: str
    vendor: str
    amount: float
    manual_category: Optional[str] = None


class TransactionUpdate(BaseModel):
    date: Optional[str] = None
    vendor: Optional[str] = None
    amount: Optional[float] = None
    manual_category: Optional[str] = None


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://ai-finance-clustering.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
def read_root():
    return {"message": "Hello World"}


@app.get("/api/transactions")
def get_transactions() -> list[dict]:
    return get_all_transactions()


@app.get("/api/clusters")
def get_clusters() -> list[dict]:
    try:
        raw = get_all_transactions()
        return cluster_transactions(raw)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/transactions", status_code=201)
def create_transaction(body: TransactionCreate) -> dict:
    return insert_transaction(
        body.date, body.vendor, body.amount, body.manual_category
    )


@app.put("/api/transactions/{tx_id}")
def edit_transaction(tx_id: str, body: TransactionUpdate) -> dict:
    # exclude_unset=True: absent fields are not sent, so None means explicit NULL
    result = update_transaction(tx_id, body.model_dump(exclude_unset=True))
    if result is None:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    return result


@app.delete("/api/transactions/{tx_id}", status_code=204)
def remove_transaction(tx_id: str) -> None:
    if not delete_transaction(tx_id):
        raise HTTPException(status_code=404, detail="Transaction not found.")
