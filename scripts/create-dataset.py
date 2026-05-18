import random
import json
from pathlib import Path
from faker import Faker

fake = Faker("es_ES")

random.seed(42)
Faker.seed(42)

# =========================
# CONFIGURACIÓN
# =========================

NUM_ASISTENTES = 1000
NUM_PONENTES = 1000
NUM_EVENTOS = 1000

OUTPUT_DIR = Path("dataset_eventos_academicos_json")
OUTPUT_DIR.mkdir(exist_ok=True)

grados = [
    "Ingeniería Informática",
    "Ingeniería de Sistemas de Información",
    "Ingeniería del Software",
    "Ciencia de Datos",
    "Inteligencia Artificial",
    "Administración y Dirección de Empresas",
    "Marketing",
    "Matemáticas",
    "Física",
    "Derecho",
    "Biotecnología",
    "Comunicación Audiovisual",
    "Economía",
    "Educación Primaria",
    "Arquitectura"
]

departamentos = [
    "Departamento de Informática",
    "Departamento de Sistemas de Información",
    "Departamento de Inteligencia Artificial",
    "Departamento de Matemática Aplicada",
    "Departamento de Economía",
    "Departamento de Marketing",
    "Departamento de Ciberseguridad",
    "Departamento de Ingeniería del Software",
    "Departamento de Comunicación",
    "Departamento de Innovación Educativa"
]

especialidades = [
    "Inteligencia Artificial",
    "Machine Learning",
    "Ciberseguridad",
    "Big Data",
    "Desarrollo Web",
    "Cloud Computing",
    "Bases de Datos",
    "UX/UI",
    "Emprendimiento Tecnológico",
    "Transformación Digital",
    "Redes y Comunicaciones",
    "Blockchain",
    "Robótica",
    "Computación Cuántica",
    "Analítica de Datos",
    "Ética Digital"
]

tipos_evento = [
    "Conferencia",
    "Seminario",
    "Taller",
    "Mesa redonda",
    "Jornada académica",
    "Congreso",
    "Webinar",
    "Hackathon",
    "Workshop",
    "Charla"
]

temas_evento = [
    "Inteligencia Artificial aplicada a la empresa",
    "Ciberseguridad en entornos cloud",
    "Nuevas tendencias en desarrollo web",
    "Big Data y análisis predictivo",
    "Transformación digital en las organizaciones",
    "Ética y privacidad en la tecnología",
    "Innovación y emprendimiento universitario",
    "Machine Learning para principiantes",
    "Diseño de interfaces centradas en el usuario",
    "Automatización de procesos con IA",
    "Bases de datos modernas",
    "Computación en la nube",
    "Programación segura",
    "Análisis de datos en tiempo real",
    "Realidad virtual en la educación",
    "Impacto de la tecnología en la sociedad"
]

lugares = [
    "Aula Magna",
    "Salón de Actos",
    "Laboratorio de Informática 1",
    "Laboratorio de Informática 2",
    "Biblioteca Universitaria",
    "Campus de Móstoles",
    "Campus de Fuenlabrada",
    "Campus de Alcorcón",
    "Auditorio principal",
    "Sala de conferencias",
    "Aula 101",
    "Aula 202",
    "Espacio de Innovación",
    "Centro de Emprendimiento"
]


# =========================
# GENERAR ASISTENTES
# =========================

asistentes = []

for i in range(1, NUM_ASISTENTES + 1):
    asistente = {
        "id": i,
        "nombre": fake.name(),
        "email": f"asistente{i}@universidad.es",
        "grado": random.choice(grados)
    }

    asistentes.append(asistente)


# =========================
# GENERAR PONENTES
# =========================

ponentes = []

for i in range(1, NUM_PONENTES + 1):
    ponente = {
        "id": i,
        "nombre": fake.name(),
        "email": f"ponente{i}@universidad.es",
        "departamento": random.choice(departamentos),
        "especialidad": random.choice(especialidades)
    }

    ponentes.append(ponente)


# =========================
# GENERAR EVENTOS
# =========================

eventos = []

ids_asistentes_disponibles = [asistente["id"] for asistente in asistentes]
ids_ponentes_disponibles = [ponente["id"] for ponente in ponentes]

for i in range(1, NUM_EVENTOS + 1):
    tipo = random.choice(tipos_evento)
    tema = random.choice(temas_evento)

    ids_asistentes = random.sample(
        ids_asistentes_disponibles,
        random.randint(20, 120)
    )

    ids_ponentes = random.sample(
        ids_ponentes_disponibles,
        random.randint(1, 5)
    )

    evento = {
        "id": i,
        "titulo": f"{tipo}: {tema}",
        "descripcion": fake.paragraph(nb_sentences=3),
        "fecha": str(fake.date_between(start_date="+1d", end_date="+1y")),
        "lugar": random.choice(lugares),
        "ids_asistentes": ids_asistentes,
        "ids_ponentes": ids_ponentes
    }

    eventos.append(evento)


# =========================
# GUARDAR SOLO JSON
# =========================

with open(OUTPUT_DIR / "asistentes.json", "w", encoding="utf-8") as file:
    json.dump(asistentes, file, ensure_ascii=False, indent=4)

with open(OUTPUT_DIR / "ponentes.json", "w", encoding="utf-8") as file:
    json.dump(ponentes, file, ensure_ascii=False, indent=4)

with open(OUTPUT_DIR / "eventos.json", "w", encoding="utf-8") as file:
    json.dump(eventos, file, ensure_ascii=False, indent=4)


# =========================
# COMPROBACIÓN FINAL
# =========================

print("Dataset generado correctamente en formato JSON.")
print(f"Carpeta de salida: {OUTPUT_DIR}")
print()
print("Registros generados:")
print(f"Asistentes: {len(asistentes)}")
print(f"Ponentes: {len(ponentes)}")
print(f"Eventos: {len(eventos)}")