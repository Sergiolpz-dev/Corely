"""
Pruebas del módulo de tareas.
Cubre operaciones CRUD y el aislamiento de datos entre usuarios.
"""

TASK_DATA = {
    "name": "Tarea de prueba",
    "priority": "alta",
    "status": "pendiente",
    "due_date": "2026-12-31T23:59:59",
}


def test_create_task(client, test_user, auth_headers):
    """Crear una tarea devuelve 201 con los campos correctos."""
    response = client.post("/tasks", json=TASK_DATA, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == TASK_DATA["name"]
    assert data["priority"] == TASK_DATA["priority"]
    assert data["status"] == TASK_DATA["status"]
    assert data["id_user"] == test_user.id


def test_create_task_duplicate_name(client, test_user, auth_headers):
    """Crear dos tareas con el mismo nombre para un usuario devuelve 400."""
    client.post("/tasks", json=TASK_DATA, headers=auth_headers)
    response = client.post("/tasks", json=TASK_DATA, headers=auth_headers)
    assert response.status_code == 400


def test_get_tasks(client, test_user, auth_headers):
    """GET /tasks devuelve únicamente las tareas del usuario autenticado."""
    client.post("/tasks", json=TASK_DATA, headers=auth_headers)
    response = client.get("/tasks", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == TASK_DATA["name"]


def test_update_task(client, test_user, auth_headers):
    """PUT /tasks/{id} actualiza los campos de la tarea correctamente."""
    create_response = client.post("/tasks", json=TASK_DATA, headers=auth_headers)
    task_id = create_response.json()["id"]

    response = client.put(f"/tasks/{task_id}", json={"status": "completada"}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "completada"


def test_update_task_not_owner(client, test_user, second_user, auth_headers, second_auth_headers):
    """Editar una tarea que pertenece a otro usuario devuelve 404."""
    create_response = client.post("/tasks", json=TASK_DATA, headers=auth_headers)
    task_id = create_response.json()["id"]

    response = client.put(
        f"/tasks/{task_id}",
        json={"status": "completada"},
        headers=second_auth_headers,
    )
    assert response.status_code == 404


def test_delete_task(client, test_user, auth_headers):
    """DELETE /tasks/{id} elimina la tarea y devuelve 204."""
    create_response = client.post("/tasks", json=TASK_DATA, headers=auth_headers)
    task_id = create_response.json()["id"]

    response = client.delete(f"/tasks/{task_id}", headers=auth_headers)
    assert response.status_code == 204


def test_delete_task_not_owner(client, test_user, second_user, auth_headers, second_auth_headers):
    """Eliminar una tarea que pertenece a otro usuario devuelve 404."""
    create_response = client.post("/tasks", json=TASK_DATA, headers=auth_headers)
    task_id = create_response.json()["id"]

    response = client.delete(f"/tasks/{task_id}", headers=second_auth_headers)
    assert response.status_code == 404
