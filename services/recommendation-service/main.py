import os
from typing import List, Optional

import pandas as pd
from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

from app.engine import recommend_movies

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
PORT = int(os.getenv("PORT", "4005"))

app = FastAPI(title="Recommendation Service", version="1.0.0")
mongo: Optional[AsyncIOMotorClient] = None


@app.on_event("startup")
async def startup() -> None:
    global mongo
    mongo = AsyncIOMotorClient(MONGO_URL)
    await mongo.admin.command("ping")


@app.on_event("shutdown")
async def shutdown() -> None:
    if mongo:
        mongo.close()


class Rating(BaseModel):
    movie_id: str
    rating: float


class RecommendRequest(BaseModel):
    user_id: str
    history: List[Rating]
    top_n: int = 10


class RecommendedMovie(BaseModel):
    movie_id: str
    title: str
    genres: List[str]
    score: float


@app.get("/healthz")
async def healthz() -> dict:
    return {"ok": True}


@app.post("/recommendations", response_model=List[RecommendedMovie])
async def recommendations(req: RecommendRequest) -> List[RecommendedMovie]:
    if mongo is None:
        raise HTTPException(503, "mongo not ready")

    cursor = mongo.catalog.movies.find({}, {"title": 1, "genres": 1})
    raw = await cursor.to_list(length=5000)
    if not raw:
        return []

    movies = pd.DataFrame(
        [
            {
                "movie_id": str(m["_id"]),
                "title": m.get("title", ""),
                "genres": m.get("genres", []),
            }
            for m in raw
        ]
    )

    history = pd.DataFrame(
        [
            {"user_id": req.user_id, "movie_id": r.movie_id, "rating": r.rating}
            for r in req.history
        ]
    )

    try:
        top = recommend_movies(req.user_id, history, movies, top_n=req.top_n)
    except Exception as e:
        raise HTTPException(500, f"recommendation failed: {e}")

    return [
        RecommendedMovie(
            movie_id=row.movie_id,
            title=row.title,
            genres=list(row.genres),
            score=float(row.score) if "score" in top.columns else 0.0,
        )
        for row in top.itertuples(index=False)
    ]


@app.get("/recommendations/popular")
async def popular(limit: int = 10) -> list:
    if mongo is None:
        raise HTTPException(503, "mongo not ready")
    cursor = (
        mongo.catalog.movies.find({}, {"title": 1, "genres": 1, "releaseDate": 1})
        .sort("releaseDate", -1)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)
    return [
        {
            "movie_id": str(d["_id"]),
            "title": d.get("title", ""),
            "genres": d.get("genres", []),
        }
        for d in docs
    ]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=False)
