"""
Pruebas del módulo de autenticación.
Cubre registro, login y acceso al perfil del usuario.
"""


REGISTER_DATA = {
    "email": "nuevo@example.com",
    "username": "nuevousuario",
    "full_name": "Usuario Nuevo",
    "password": "password123",
}


def test_register_success(client):
    """Registrar un usuario nuevo devuelve 201 con su email y username."""
    response = client.post("/auth/register", json=REGISTER_DATA)
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == REGISTER_DATA["email"]
    assert data["user"]["username"] == REGISTER_DATA["username"]


def test_register_duplicate_email(client, test_user):
    """Intentar registrar un email ya existente devuelve 400."""
    response = client.post("/auth/register", json={
        "email": "test@example.com",
        "username": "otrousuario2",
        "full_name": "Otro",
        "password": "password123",
    })
    assert response.status_code == 400


def test_register_duplicate_username(client, test_user):
    """Intentar registrar un username ya existente devuelve 400."""
    response = client.post("/auth/register", json={
        "email": "diferente@example.com",
        "username": "testuser",
        "full_name": "Otro",
        "password": "password123",
    })
    assert response.status_code == 400


def test_login_success(client, test_user):
    """Login correcto devuelve 200 con access_token."""
    response = client.post("/auth/login", json={
        "username": "testuser",
        "password": "password123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_with_email(client, test_user):
    """El campo username del login también acepta el email del usuario."""
    response = client.post("/auth/login", json={
        "username": "test@example.com",
        "password": "password123",
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password(client, test_user):
    """Login con contraseña incorrecta devuelve 401."""
    response = client.post("/auth/login", json={
        "username": "testuser",
        "password": "contraseniaincorrecta",
    })
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    """Login con usuario inexistente devuelve 401."""
    response = client.post("/auth/login", json={
        "username": "noexiste",
        "password": "password123",
    })
    assert response.status_code == 401


def test_me_authenticated(client, test_user, auth_headers):
    """GET /auth/me con token válido devuelve los datos del usuario."""
    response = client.get("/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"


def test_me_unauthenticated(client):
    """GET /auth/me sin token devuelve 401."""
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_logout(client):
    """POST /auth/logout devuelve 200."""
    response = client.post("/auth/logout")
    assert response.status_code == 200
