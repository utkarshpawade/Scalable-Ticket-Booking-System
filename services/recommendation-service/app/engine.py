import numpy as np
import pandas as pd


def recommend_movies(
    user_id: str,
    user_history: pd.DataFrame,   # cols: user_id, movie_id, rating (1-5)
    movies: pd.DataFrame,         # cols: movie_id, title, genres (list[str])
    top_n: int = 10,
) -> pd.DataFrame:
    """
    Content-based recommender using genre affinity.
    1. Build user genre-preference vector weighted by past ratings.
    2. Build movie genre matrix (multi-hot).
    3. Score = cosine similarity between user vector and each unseen movie.
    """
    genre_matrix = (
        movies.explode("genres")
        .assign(v=1)
        .pivot_table(index="movie_id", columns="genres", values="v", fill_value=0)
    )

    watched = user_history[user_history.user_id == user_id]
    if watched.empty:
        return movies.head(top_n)

    watched_matrix = genre_matrix.loc[
        genre_matrix.index.intersection(watched.movie_id)
    ]
    ratings = watched.set_index("movie_id").rating.reindex(watched_matrix.index)
    user_vec = watched_matrix.mul(ratings, axis=0).sum(axis=0).values

    if np.linalg.norm(user_vec) == 0:
        return movies.head(top_n)
    user_vec = user_vec / np.linalg.norm(user_vec)

    item_mat = genre_matrix.values.astype(float)
    item_norms = np.linalg.norm(item_mat, axis=1, keepdims=True)
    item_norms[item_norms == 0] = 1.0
    item_mat_n = item_mat / item_norms
    scores = item_mat_n @ user_vec

    results = (
        pd.DataFrame({"movie_id": genre_matrix.index, "score": scores})
        .loc[lambda d: ~d.movie_id.isin(watched.movie_id)]
        .sort_values("score", ascending=False)
        .head(top_n)
        .merge(movies[["movie_id", "title", "genres"]], on="movie_id")
    )
    return results
