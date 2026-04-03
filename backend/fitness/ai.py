"""
Módulo de integración con la API de Claude (Anthropic).
Genera rutinas de ejercicio y planes de alimentación personalizados
a partir de datos ya filtrados, minimizando el uso de tokens.
"""
import json
import httpx
from config import settings


CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-haiku-4-5-20251001"


async def _call_claude(prompt: str) -> str:
    headers = {
        "x-api-key": settings.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    body = {
        "model": MODEL,
        "max_tokens": 2048,
        "messages": [{"role": "user", "content": prompt}],
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(CLAUDE_API_URL, headers=headers, json=body)
        response.raise_for_status()
        data = response.json()
        return data["content"][0]["text"]


async def generate_weekly_routine(profile: dict, exercises: list[dict]) -> dict:
    """
    Genera una rutina semanal personalizada.
    `exercises` ya viene filtrado por grupo muscular, dificultad y material del usuario.
    """
    dias_entreno = 4 if profile.get("velocidad") == "rapida" else 3 if profile.get("velocidad") == "normal" else 2

    prompt = f"""Eres un entrenador personal experto. Crea una rutina semanal de {dias_entreno} días de entrenamiento y {7 - dias_entreno} días de descanso para este usuario.

PERFIL:
- Nivel: {profile.get("nivel")}
- Objetivo: {profile.get("objetivo")}
- Grupo preferido: {profile.get("grupo_muscular")}
- Velocidad: {profile.get("velocidad")}

EJERCICIOS DISPONIBLES (úsalos solo de esta lista):
{json.dumps(exercises, ensure_ascii=False)}

RESPONDE ÚNICAMENTE con un JSON válido con esta estructura exacta (sin texto adicional):
{{
  "dias": [
    {{
      "dia": "Lunes",
      "tipo": "Fuerza",
      "descanso": false,
      "ejercicios": [
        {{
          "id": 1,
          "nombre": "Nombre del ejercicio",
          "series": 4,
          "repeticiones": 10,
          "descanso_seg": 90,
          "notas": "Consejo breve"
        }}
      ]
    }},
    {{
      "dia": "Martes",
      "tipo": "Descanso",
      "descanso": true,
      "ejercicios": []
    }}
  ],
  "consejos": ["Consejo 1", "Consejo 2", "Consejo 3"]
}}

Incluye exactamente los 7 días de la semana (Lunes a Domingo). Días de descanso tienen ejercicios vacíos."""

    raw = await _call_claude(prompt)

    # Extraer JSON de la respuesta
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    return json.loads(raw)


async def generate_meal_plan(profile: dict, foods: list[dict]) -> dict:
    """
    Genera un plan de alimentación semanal.
    `foods` ya viene filtrado por alergias y preferencias del usuario.
    """
    # Estimación de calorías según objetivo
    peso = profile.get("peso", 75)
    objetivo = profile.get("objetivo", "mantenimiento")
    velocidad = profile.get("velocidad", "normal")

    calorias_base = peso * 33  # TDEE aproximado
    if objetivo == "hipertrofia":
        ajuste = 300 if velocidad == "normal" else 500 if velocidad == "rapida" else 150
        calorias_objetivo = int(calorias_base + ajuste)
    elif objetivo == "perdida-grasa":
        ajuste = 400 if velocidad == "normal" else 600 if velocidad == "rapida" else 200
        calorias_objetivo = int(calorias_base - ajuste)
    else:
        calorias_objetivo = int(calorias_base)

    prompt = f"""Eres un nutricionista deportivo experto. Crea un plan de alimentación para 1 día tipo (se repetirá la semana) para este usuario.

PERFIL:
- Peso: {peso}kg
- Objetivo: {objetivo}
- Preferencia: {profile.get("preferencia_dieta")}
- Calorías objetivo: {calorias_objetivo} kcal

ALIMENTOS DISPONIBLES (úsalos prioritariamente de esta lista, puedes mencionar cantidades en gramos):
{json.dumps(foods, ensure_ascii=False)}

RESPONDE ÚNICAMENTE con un JSON válido con esta estructura exacta (sin texto adicional):
{{
  "calorias_objetivo": {calorias_objetivo},
  "macros_objetivo": {{
    "proteinas_g": 0,
    "carbohidratos_g": 0,
    "grasas_g": 0
  }},
  "comidas": [
    {{
      "nombre": "Desayuno",
      "hora": "08:00",
      "alimentos": [
        {{
          "nombre": "Nombre del alimento",
          "cantidad_g": 100,
          "calorias": 0,
          "proteinas": 0,
          "carbohidratos": 0,
          "grasas": 0
        }}
      ],
      "total_calorias": 0
    }}
  ],
  "consejos": ["Consejo nutricional 1", "Consejo nutricional 2"]
}}

Incluye 4-5 comidas: Desayuno, Media mañana (opcional), Almuerzo, Merienda, Cena."""

    raw = await _call_claude(prompt)

    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    result = json.loads(raw)
    result["calorias_objetivo"] = calorias_objetivo
    return result
