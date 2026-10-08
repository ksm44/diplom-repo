from uuid import uuid4

def test_create_movie(client, admin_token):
    title = f"Test {uuid4()}"          # ← уникальное имя каждый раз
    r = client.post(
        "/movies",
        json={
            "title": title,             # ← используем переменную
            "description": "Test",
            "duration": 120,
            "countries": "Test",
            "poster_url": None,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["title"] == title       # ← сверяем с переменной
    assert body["duration"] == 120

def test_create_movie_unauthorized(client):
    """POST /movies без токена → 401"""
    r = client.post("/movies", json={
        "title": f"Test {uuid4()}",
        "description": "x",
        "duration": 100,
        "countries": "x",
    })
    assert r.status_code == 401


def test_create_movie_forbidden(client, guest_token):
    """POST /movies с токеном гостя → 403"""
    r = client.post("/movies", json={
        "title": f"Test {uuid4()}",
        "description": "x",
        "duration": 100,
        "countries": "x",
    }, headers={"Authorization": f"Bearer {guest_token}"})
    assert r.status_code == 403


def test_create_movie_duplicate(client, admin_token):
    """POST /movies с существующим title → 409"""
    title = f"Duplicate {uuid4()}"
    payload = {
        "title": title,
        "description": "x",
        "duration": 100,
        "countries": "x",
    }

    r1 = client.post("/movies", json=payload,
                     headers={"Authorization": f"Bearer {admin_token}"})
    assert r1.status_code == 201

    r2 = client.post("/movies", json=payload,
                     headers={"Authorization": f"Bearer {admin_token}"})
    assert r2.status_code == 409