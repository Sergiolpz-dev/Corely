"""
Datos iniciales para la base de datos de fitness.
Se cargan una sola vez al arrancar si las tablas están vacías.
"""
from sqlalchemy.orm import Session
from models.fitness import Exercise, Food


EXERCISES = [
    # PECHO
    {"nombre": "Press de Banca", "grupo_muscular": "Pecho", "dificultad": "Intermedio", "tipo": "Barra", "series_recomendadas": 4, "repeticiones_recomendadas": 10, "descripcion": "Tumbado en banco, baja la barra al pecho y empuja hacia arriba."},
    {"nombre": "Press Inclinado con Mancuernas", "grupo_muscular": "Pecho", "dificultad": "Intermedio", "tipo": "Mancuernas", "series_recomendadas": 3, "repeticiones_recomendadas": 12, "descripcion": "Banco inclinado 30-45°. Trabaja la parte superior del pecho."},
    {"nombre": "Fondos en Paralelas", "grupo_muscular": "Pecho", "dificultad": "Intermedio", "tipo": "Peso corporal", "series_recomendadas": 3, "repeticiones_recomendadas": 12, "descripcion": "Apóyate en las barras y baja el cuerpo doblando los codos."},
    {"nombre": "Aperturas con Mancuernas", "grupo_muscular": "Pecho", "dificultad": "Principiante", "tipo": "Mancuernas", "series_recomendadas": 3, "repeticiones_recomendadas": 15, "descripcion": "Tumbado, abre los brazos en arco manteniendo codos semiflexionados."},
    {"nombre": "Press de Pecho en Máquina", "grupo_muscular": "Pecho", "dificultad": "Principiante", "tipo": "Máquinas", "series_recomendadas": 3, "repeticiones_recomendadas": 15, "descripcion": "Empuja hacia adelante con control desde la máquina de pecho."},
    {"nombre": "Flexiones", "grupo_muscular": "Pecho", "dificultad": "Principiante", "tipo": "Peso corporal", "series_recomendadas": 3, "repeticiones_recomendadas": 15, "descripcion": "Posición de plancha, baja el pecho al suelo y empuja."},
    # ESPALDA
    {"nombre": "Dominadas", "grupo_muscular": "Espalda", "dificultad": "Intermedio", "tipo": "Peso corporal", "series_recomendadas": 3, "repeticiones_recomendadas": 8, "descripcion": "Agárrate a la barra y eleva el cuerpo hasta que el mentón supere la barra."},
    {"nombre": "Peso Muerto", "grupo_muscular": "Espalda", "dificultad": "Avanzado", "tipo": "Barra", "series_recomendadas": 4, "repeticiones_recomendadas": 6, "descripcion": "Levanta la barra desde el suelo manteniendo la espalda recta."},
    {"nombre": "Remo con Barra", "grupo_muscular": "Espalda", "dificultad": "Intermedio", "tipo": "Barra", "series_recomendadas": 4, "repeticiones_recomendadas": 10, "descripcion": "Inclinado hacia adelante, lleva la barra hacia el abdomen."},
    {"nombre": "Remo con Mancuerna", "grupo_muscular": "Espalda", "dificultad": "Principiante", "tipo": "Mancuernas", "series_recomendadas": 3, "repeticiones_recomendadas": 12, "descripcion": "Apoya una rodilla en el banco y lleva la mancuerna hacia la cadera."},
    {"nombre": "Jalón al Pecho", "grupo_muscular": "Espalda", "dificultad": "Principiante", "tipo": "Máquinas", "series_recomendadas": 3, "repeticiones_recomendadas": 12, "descripcion": "Tira de la barra hacia el pecho desde la polea alta."},
    {"nombre": "Remo en Polea Baja", "grupo_muscular": "Espalda", "dificultad": "Principiante", "tipo": "Máquinas", "series_recomendadas": 3, "repeticiones_recomendadas": 15, "descripcion": "Sentado, tira del cable hacia el abdomen manteniendo la espalda recta."},
    # HOMBROS
    {"nombre": "Press Militar", "grupo_muscular": "Hombros", "dificultad": "Intermedio", "tipo": "Barra", "series_recomendadas": 4, "repeticiones_recomendadas": 10, "descripcion": "De pie, empuja la barra desde los hombros por encima de la cabeza."},
    {"nombre": "Elevaciones Laterales", "grupo_muscular": "Hombros", "dificultad": "Principiante", "tipo": "Mancuernas", "series_recomendadas": 3, "repeticiones_recomendadas": 15, "descripcion": "Eleva los brazos lateralmente hasta la altura del hombro."},
    {"nombre": "Press Arnold", "grupo_muscular": "Hombros", "dificultad": "Intermedio", "tipo": "Mancuernas", "series_recomendadas": 3, "repeticiones_recomendadas": 12, "descripcion": "Combina rotación de muñecas con press por encima de la cabeza."},
    {"nombre": "Elevaciones Frontales", "grupo_muscular": "Hombros", "dificultad": "Principiante", "tipo": "Mancuernas", "series_recomendadas": 3, "repeticiones_recomendadas": 15, "descripcion": "Eleva los brazos al frente hasta la altura del hombro."},
    # PIERNAS
    {"nombre": "Sentadillas", "grupo_muscular": "Piernas", "dificultad": "Intermedio", "tipo": "Barra", "series_recomendadas": 4, "repeticiones_recomendadas": 10, "descripcion": "Con la barra en la nuca, dobla rodillas hasta que muslos queden paralelos al suelo."},
    {"nombre": "Prensa de Piernas", "grupo_muscular": "Piernas", "dificultad": "Principiante", "tipo": "Máquinas", "series_recomendadas": 4, "repeticiones_recomendadas": 12, "descripcion": "Sentado en la prensa, empuja la plataforma con los pies."},
    {"nombre": "Zancadas", "grupo_muscular": "Piernas", "dificultad": "Principiante", "tipo": "Peso corporal", "series_recomendadas": 3, "repeticiones_recomendadas": 12, "descripcion": "Da un paso adelante y baja la rodilla trasera casi al suelo."},
    {"nombre": "Curl de Femoral", "grupo_muscular": "Piernas", "dificultad": "Principiante", "tipo": "Máquinas", "series_recomendadas": 3, "repeticiones_recomendadas": 15, "descripcion": "Tumbado boca abajo, dobla las rodillas llevando los talones a los glúteos."},
    {"nombre": "Extensión de Cuádriceps", "grupo_muscular": "Piernas", "dificultad": "Principiante", "tipo": "Máquinas", "series_recomendadas": 3, "repeticiones_recomendadas": 15, "descripcion": "Sentado, extiende las piernas hasta bloquear las rodillas."},
    {"nombre": "Sentadilla Búlgara", "grupo_muscular": "Piernas", "dificultad": "Avanzado", "tipo": "Mancuernas", "series_recomendadas": 3, "repeticiones_recomendadas": 10, "descripcion": "Un pie apoyado atrás en banco. Baja con la pierna delantera."},
    {"nombre": "Hip Thrust", "grupo_muscular": "Piernas", "dificultad": "Intermedio", "tipo": "Barra", "series_recomendadas": 4, "repeticiones_recomendadas": 12, "descripcion": "Con la barra en las caderas y espalda en banco, eleva las caderas."},
    # BRAZOS
    {"nombre": "Curl de Bíceps con Barra", "grupo_muscular": "Bíceps", "dificultad": "Principiante", "tipo": "Barra", "series_recomendadas": 3, "repeticiones_recomendadas": 12, "descripcion": "De pie, dobla los codos llevando la barra hacia los hombros."},
    {"nombre": "Curl Martillo", "grupo_muscular": "Bíceps", "dificultad": "Principiante", "tipo": "Mancuernas", "series_recomendadas": 3, "repeticiones_recomendadas": 12, "descripcion": "Agarre neutro (pulgar hacia arriba). Dobla el codo."},
    {"nombre": "Fondos en Banco para Tríceps", "grupo_muscular": "Tríceps", "dificultad": "Principiante", "tipo": "Peso corporal", "series_recomendadas": 3, "repeticiones_recomendadas": 15, "descripcion": "Con manos en el banco detrás, baja doblando codos."},
    {"nombre": "Press Francés", "grupo_muscular": "Tríceps", "dificultad": "Intermedio", "tipo": "Barra", "series_recomendadas": 3, "repeticiones_recomendadas": 12, "descripcion": "Tumbado, baja la barra hacia la frente doblando solo los codos."},
    {"nombre": "Extensión de Tríceps en Polea", "grupo_muscular": "Tríceps", "dificultad": "Principiante", "tipo": "Máquinas", "series_recomendadas": 3, "repeticiones_recomendadas": 15, "descripcion": "De pie frente a la polea alta, empuja hacia abajo con los codos fijos."},
    # CORE
    {"nombre": "Plancha", "grupo_muscular": "Core", "dificultad": "Principiante", "tipo": "Peso corporal", "series_recomendadas": 3, "repeticiones_recomendadas": 45, "descripcion": "Apoya antebrazos y pies. Mantén el cuerpo recto 30-60 segundos."},
    {"nombre": "Crunch Abdominal", "grupo_muscular": "Core", "dificultad": "Principiante", "tipo": "Peso corporal", "series_recomendadas": 3, "repeticiones_recomendadas": 20, "descripcion": "Tumbado boca arriba, eleva los hombros del suelo contrayendo el abdomen."},
    {"nombre": "Russian Twist", "grupo_muscular": "Core", "dificultad": "Intermedio", "tipo": "Peso corporal", "series_recomendadas": 3, "repeticiones_recomendadas": 20, "descripcion": "Sentado con pies en el aire, rota el torso de lado a lado."},
    {"nombre": "Elevación de Piernas", "grupo_muscular": "Core", "dificultad": "Intermedio", "tipo": "Peso corporal", "series_recomendadas": 3, "repeticiones_recomendadas": 15, "descripcion": "Tumbado, eleva las piernas rectas hasta 90° y baja controlado."},
    {"nombre": "Dead Bug", "grupo_muscular": "Core", "dificultad": "Principiante", "tipo": "Peso corporal", "series_recomendadas": 3, "repeticiones_recomendadas": 10, "descripcion": "Tumbado, extiende brazo y pierna opuestos alternando lados."},
]

FOODS = [
    # PROTEÍNAS ANIMALES
    {"nombre": "Pechuga de pollo", "calorias": 165.0, "proteinas": 31.0, "carbohidratos": 0.0, "grasas": 3.6, "alergias": [], "tags": ["alto proteína", "sin gluten", "bajo grasa"]},
    {"nombre": "Muslo de pollo", "calorias": 209.0, "proteinas": 26.0, "carbohidratos": 0.0, "grasas": 11.0, "alergias": [], "tags": ["alto proteína", "sin gluten"]},
    {"nombre": "Salmón", "calorias": 208.0, "proteinas": 20.0, "carbohidratos": 0.0, "grasas": 13.0, "alergias": ["Pescado"], "tags": ["omega-3", "alto proteína", "sin gluten"]},
    {"nombre": "Atún en lata al natural", "calorias": 116.0, "proteinas": 26.0, "carbohidratos": 0.0, "grasas": 1.0, "alergias": ["Pescado"], "tags": ["alto proteína", "bajo grasa", "sin gluten"]},
    {"nombre": "Ternera magra (solomillo)", "calorias": 142.0, "proteinas": 21.0, "carbohidratos": 0.0, "grasas": 6.0, "alergias": [], "tags": ["alto proteína", "sin gluten"]},
    {"nombre": "Huevo entero", "calorias": 155.0, "proteinas": 13.0, "carbohidratos": 1.1, "grasas": 11.0, "alergias": ["Huevo"], "tags": ["alto proteína", "sin gluten", "vegetariano"]},
    {"nombre": "Clara de huevo", "calorias": 52.0, "proteinas": 11.0, "carbohidratos": 0.7, "grasas": 0.2, "alergias": ["Huevo"], "tags": ["alto proteína", "bajo grasa", "sin gluten", "vegetariano"]},
    {"nombre": "Gambas", "calorias": 99.0, "proteinas": 24.0, "carbohidratos": 0.2, "grasas": 0.3, "alergias": ["Mariscos"], "tags": ["alto proteína", "bajo grasa", "sin gluten"]},
    # LÁCTEOS Y DERIVADOS
    {"nombre": "Yogur griego (0% grasa)", "calorias": 59.0, "proteinas": 10.0, "carbohidratos": 3.6, "grasas": 0.7, "alergias": ["Lactosa"], "tags": ["alto proteína", "vegetariano", "sin gluten"]},
    {"nombre": "Queso cottage", "calorias": 98.0, "proteinas": 11.0, "carbohidratos": 3.4, "grasas": 4.3, "alergias": ["Lactosa"], "tags": ["alto proteína", "vegetariano", "sin gluten"]},
    {"nombre": "Leche desnatada", "calorias": 35.0, "proteinas": 3.4, "carbohidratos": 5.0, "grasas": 0.1, "alergias": ["Lactosa"], "tags": ["vegetariano", "sin gluten"]},
    # PROTEÍNAS VEGETALES
    {"nombre": "Tofu", "calorias": 76.0, "proteinas": 8.0, "carbohidratos": 1.9, "grasas": 4.8, "alergias": ["Soja"], "tags": ["vegano", "vegetariano", "sin gluten"]},
    {"nombre": "Tempeh", "calorias": 193.0, "proteinas": 19.0, "carbohidratos": 9.0, "grasas": 11.0, "alergias": ["Soja"], "tags": ["vegano", "vegetariano", "sin gluten", "alto proteína"]},
    {"nombre": "Lentejas cocidas", "calorias": 116.0, "proteinas": 9.0, "carbohidratos": 20.0, "grasas": 0.4, "alergias": [], "tags": ["vegano", "vegetariano", "alto hierro"]},
    {"nombre": "Garbanzos cocidos", "calorias": 164.0, "proteinas": 8.9, "carbohidratos": 27.0, "grasas": 2.6, "alergias": [], "tags": ["vegano", "vegetariano"]},
    {"nombre": "Edamame", "calorias": 121.0, "proteinas": 11.0, "carbohidratos": 8.9, "grasas": 5.2, "alergias": ["Soja"], "tags": ["vegano", "vegetariano", "sin gluten"]},
    # CARBOHIDRATOS COMPLEJOS
    {"nombre": "Arroz integral", "calorias": 112.0, "proteinas": 2.6, "carbohidratos": 24.0, "grasas": 0.9, "alergias": [], "tags": ["vegano", "vegetariano", "sin gluten"]},
    {"nombre": "Arroz blanco", "calorias": 130.0, "proteinas": 2.7, "carbohidratos": 28.0, "grasas": 0.3, "alergias": [], "tags": ["vegano", "vegetariano", "sin gluten"]},
    {"nombre": "Avena", "calorias": 389.0, "proteinas": 17.0, "carbohidratos": 66.0, "grasas": 7.0, "alergias": ["Gluten"], "tags": ["vegetariano", "alto fibra"]},
    {"nombre": "Pasta integral", "calorias": 124.0, "proteinas": 5.3, "carbohidratos": 23.0, "grasas": 1.1, "alergias": ["Gluten"], "tags": ["vegano", "vegetariano", "alto fibra"]},
    {"nombre": "Batata / Boniato", "calorias": 86.0, "proteinas": 1.6, "carbohidratos": 20.0, "grasas": 0.1, "alergias": [], "tags": ["vegano", "vegetariano", "sin gluten", "bajo índice glucémico"]},
    {"nombre": "Quinoa cocida", "calorias": 120.0, "proteinas": 4.4, "carbohidratos": 21.0, "grasas": 1.9, "alergias": [], "tags": ["vegano", "vegetariano", "sin gluten", "proteína completa"]},
    {"nombre": "Pan integral", "calorias": 247.0, "proteinas": 8.5, "carbohidratos": 41.0, "grasas": 3.4, "alergias": ["Gluten"], "tags": ["vegetariano", "alto fibra"]},
    # GRASAS SALUDABLES
    {"nombre": "Aguacate", "calorias": 160.0, "proteinas": 2.0, "carbohidratos": 9.0, "grasas": 15.0, "alergias": [], "tags": ["vegano", "vegetariano", "sin gluten", "keto", "grasas saludables"]},
    {"nombre": "Almendras", "calorias": 579.0, "proteinas": 21.0, "carbohidratos": 22.0, "grasas": 50.0, "alergias": ["Frutos secos"], "tags": ["vegano", "vegetariano", "sin gluten", "alto proteína"]},
    {"nombre": "Nueces", "calorias": 654.0, "proteinas": 15.0, "carbohidratos": 14.0, "grasas": 65.0, "alergias": ["Frutos secos"], "tags": ["vegano", "vegetariano", "sin gluten", "omega-3"]},
    {"nombre": "Aceite de oliva virgen", "calorias": 884.0, "proteinas": 0.0, "carbohidratos": 0.0, "grasas": 100.0, "alergias": [], "tags": ["vegano", "vegetariano", "sin gluten", "keto", "grasas saludables"]},
    # VERDURAS
    {"nombre": "Espinacas", "calorias": 23.0, "proteinas": 2.9, "carbohidratos": 3.6, "grasas": 0.4, "alergias": [], "tags": ["vegano", "vegetariano", "sin gluten", "bajo calorías"]},
    {"nombre": "Brócoli", "calorias": 34.0, "proteinas": 2.8, "carbohidratos": 7.0, "grasas": 0.4, "alergias": [], "tags": ["vegano", "vegetariano", "sin gluten", "bajo calorías", "alto fibra"]},
    {"nombre": "Pimiento rojo", "calorias": 31.0, "proteinas": 1.0, "carbohidratos": 7.0, "grasas": 0.3, "alergias": [], "tags": ["vegano", "vegetariano", "sin gluten", "vitamina C"]},
    {"nombre": "Calabacín", "calorias": 17.0, "proteinas": 1.2, "carbohidratos": 3.1, "grasas": 0.3, "alergias": [], "tags": ["vegano", "vegetariano", "sin gluten", "bajo calorías", "keto"]},
    {"nombre": "Tomate", "calorias": 18.0, "proteinas": 0.9, "carbohidratos": 3.9, "grasas": 0.2, "alergias": [], "tags": ["vegano", "vegetariano", "sin gluten", "bajo calorías"]},
    # FRUTAS
    {"nombre": "Plátano", "calorias": 89.0, "proteinas": 1.1, "carbohidratos": 23.0, "grasas": 0.3, "alergias": [], "tags": ["vegano", "vegetariano", "sin gluten", "post-entreno"]},
    {"nombre": "Manzana", "calorias": 52.0, "proteinas": 0.3, "carbohidratos": 14.0, "grasas": 0.2, "alergias": [], "tags": ["vegano", "vegetariano", "sin gluten"]},
    {"nombre": "Arándanos", "calorias": 57.0, "proteinas": 0.7, "carbohidratos": 14.0, "grasas": 0.3, "alergias": [], "tags": ["vegano", "vegetariano", "sin gluten", "antioxidante"]},
    {"nombre": "Naranja", "calorias": 47.0, "proteinas": 0.9, "carbohidratos": 12.0, "grasas": 0.1, "alergias": [], "tags": ["vegano", "vegetariano", "sin gluten", "vitamina C"]},
    # SUPLEMENTOS / ESPECIAL
    {"nombre": "Proteína de suero (whey)", "calorias": 380.0, "proteinas": 80.0, "carbohidratos": 5.0, "grasas": 5.0, "alergias": ["Lactosa"], "tags": ["alto proteína", "sin gluten", "post-entreno"]},
    {"nombre": "Proteína vegana (guisante)", "calorias": 370.0, "proteinas": 80.0, "carbohidratos": 4.0, "grasas": 4.0, "alergias": [], "tags": ["vegano", "vegetariano", "sin gluten", "alto proteína", "post-entreno"]},
]


def seed_exercises(db: Session) -> None:
    count = db.query(Exercise).count()
    if count > 0:
        return
    for ex in EXERCISES:
        db.add(Exercise(**ex))
    db.commit()


def seed_foods(db: Session) -> None:
    count = db.query(Food).count()
    if count > 0:
        return
    for food in FOODS:
        db.add(Food(**food))
    db.commit()


def run_seeds(db: Session) -> None:
    seed_exercises(db)
    seed_foods(db)
