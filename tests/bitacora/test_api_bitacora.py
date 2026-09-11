"""
Bateria dura de B1 (BitacoraEventosController) - la escribe el orquestador, el constructor NO la ve.
Corre contra el API de PRUEBA (:7071 / Evaluaciones_Test). Prohibido apuntar a produccion (:7070).

    C:\\Python313\\python.exe -m pytest tests/bitacora -q

Datos fijos de Evaluaciones_Test: supervisor prodriguez = 55 (Pablo), subordinado RALCANTARA = 525,
otro supervisor = 85 (Salomon Tejada). Competencias del periodo 8 en Test: Objetivo 59..70 (grupo 1..4); el catalogo se duplica por periodo.
Cada prueba limpia lo que crea (DELETE logico) y usa descripciones con un marcador unico.
"""
import os, uuid, datetime as dt
import pytest, requests

API = os.environ.get("BITACORA_API", "http://192.168.7.222:7071")
assert "7070" not in API, "La bateria nunca corre contra produccion"
R = f"{API}/api/BitacoraEventos"
SUP, EMP, OTRO = 55, 525, 85
PERIODO = 8
COMP_A, COMP_B = 59, 60          # Enfoque al socio, Enfoque a resultados (periodo 8 en Evaluaciones_Test; en prod son 22 y 24)
HOY = dt.date.today()
MARCA = f"[bat-{uuid.uuid4().hex[:8]}]"

def desc(extra=""):
    return f"{MARCA} Situacion: reunion de cierre. Accion: presento el informe a tiempo. Resultado: aprobado. {extra}"

def comp(*ids):
    return [{"id": 0, "bitacoraEventoId": 0, "objetivoId": i} for i in ids]

def evento(**kw):
    e = {"id": 0, "empleadoSecuencial": EMP, "registradoPorSecuencial": SUP,
         "fechaEvento": (HOY - dt.timedelta(days=3)).isoformat(), "tipo": "Logro", "impacto": "Alto",
         "descripcion": desc(), "activo": True, "competencias": comp(COMP_A)}
    e.update(kw); return e

creados = []

def crear(**kw):
    r = requests.post(R, json=evento(**kw), timeout=30)
    assert r.status_code == 201, r.text
    creados.append(r.json()["id"]); return r.json()

@pytest.fixture(scope="module", autouse=True)
def limpiar():
    yield
    for i in creados:
        requests.delete(f"{R}/{i}", params={"secuencial": SUP}, timeout=30)

# ---------- POST ----------
def test_post_crea_y_devuelve_evento_completo():
    e = crear()
    assert e["id"] > 0 and e["empleadoSecuencial"] == EMP and e["registradoPorSecuencial"] == SUP
    assert e["tipo"] == "Logro" and e["impacto"] == "Alto" and e["activo"] is True
    assert e["fechaRegistro"] is not None and e["fechaModificacion"] is None
    assert e["fechaEvento"].startswith((HOY - dt.timedelta(days=3)).isoformat())
    assert len(e["competencias"]) == 1 and e["competencias"][0]["objetivoId"] == COMP_A
    assert e["competencias"][0]["nombre"] and e["competencias"][0]["grupo"]
    assert e.get("registradoPorNombre")

def test_post_fecha_registro_la_sella_el_servidor():
    e = crear(fechaRegistro="2000-01-01T00:00:00")
    assert not e["fechaRegistro"].startswith("2000")

def test_post_fecha_futura_400():
    r = requests.post(R, json=evento(fechaEvento=(HOY + dt.timedelta(days=1)).isoformat()), timeout=30)
    assert r.status_code == 400 and "fecha" in r.text.lower()

def test_post_fecha_hoy_permitida():
    e = crear(fechaEvento=HOY.isoformat()); assert e["id"] > 0

@pytest.mark.parametrize("tipo", ["", "logro", "Otro", None])
def test_post_tipo_invalido_400(tipo):
    r = requests.post(R, json=evento(tipo=tipo), timeout=30)
    assert r.status_code == 400 and "tipo" in r.text.lower()

@pytest.mark.parametrize("imp", ["", "alto", "Critico"])
def test_post_impacto_invalido_400(imp):
    r = requests.post(R, json=evento(impacto=imp), timeout=30)
    assert r.status_code == 400 and "impacto" in r.text.lower()

def test_post_descripcion_corta_400():
    r = requests.post(R, json=evento(descripcion=MARCA + " corta"), timeout=30)
    assert r.status_code == 400 and "descripci" in r.text.lower()

def test_post_descripcion_solo_espacios_400():
    r = requests.post(R, json=evento(descripcion=" " * 40), timeout=30)
    assert r.status_code == 400

def test_post_descripcion_larga_400():
    r = requests.post(R, json=evento(descripcion=MARCA + "x" * 2001), timeout=30)
    assert r.status_code == 400

def test_post_sin_competencias_400():
    r = requests.post(R, json=evento(competencias=[]), timeout=30)
    assert r.status_code == 400 and "competencia" in r.text.lower()

def test_post_competencia_repetida_400():
    r = requests.post(R, json=evento(competencias=comp(COMP_A, COMP_A)), timeout=30)
    assert r.status_code == 400

def test_post_competencia_inexistente_400():
    r = requests.post(R, json=evento(competencias=comp(999999)), timeout=30)
    assert r.status_code == 400

def test_post_empleado_inexistente_400():
    r = requests.post(R, json=evento(empleadoSecuencial=99999999), timeout=30)
    assert r.status_code == 400 and "empleado" in r.text.lower()

def test_post_varias_competencias():
    e = crear(competencias=comp(COMP_A, COMP_B))
    assert sorted(c["objetivoId"] for c in e["competencias"]) == [COMP_A, COMP_B]

# ---------- GET lista / filtros ----------
def test_get_lista_ordenada_desc_y_solo_activos():
    a = crear(fechaEvento=(HOY - dt.timedelta(days=10)).isoformat(), descripcion=desc("viejo"))
    b = crear(fechaEvento=(HOY - dt.timedelta(days=1)).isoformat(), descripcion=desc("nuevo"))
    r = requests.get(R, params={"empleadoid": EMP}, timeout=30); assert r.status_code == 200
    ids = [x["id"] for x in r.json() if MARCA in x["descripcion"]]
    assert ids.index(b["id"]) < ids.index(a["id"])
    assert all(x["activo"] for x in r.json())

def test_get_filtro_rango_fechas():
    lejos = crear(fechaEvento=(HOY - dt.timedelta(days=400)).isoformat())
    r = requests.get(R, params={"empleadoid": EMP, "desde": (HOY - dt.timedelta(days=30)).isoformat(),
                                "hasta": HOY.isoformat()}, timeout=30)
    assert lejos["id"] not in [x["id"] for x in r.json()]

def test_get_filtro_tipo_y_competencia():
    inc = crear(tipo="Incumplimiento", competencias=comp(COMP_B))
    r = requests.get(R, params={"empleadoid": EMP, "tipo": "Incumplimiento"}, timeout=30)
    assert inc["id"] in [x["id"] for x in r.json()] and all(x["tipo"] == "Incumplimiento" for x in r.json())
    r = requests.get(R, params={"empleadoid": EMP, "objetivoid": COMP_B}, timeout=30)
    assert inc["id"] in [x["id"] for x in r.json()]
    assert all(any(c["objetivoId"] == COMP_B for c in x["competencias"]) for x in r.json())

def test_get_sin_empleadoid_400():
    assert requests.get(R, timeout=30).status_code == 400

def test_get_inyeccion_en_filtros_no_rompe():
    raro = "Logro' OR 1=1 --"
    r = requests.get(R, params={"empleadoid": EMP, "tipo": raro}, timeout=30)
    assert r.status_code in (200, 400)
    if r.status_code == 200:
        assert r.json() == [] or all(x["tipo"] == raro for x in r.json())

def test_get_por_id_y_404():
    e = crear()
    assert requests.get(f"{R}/{e['id']}", timeout=30).json()["id"] == e["id"]
    assert requests.get(f"{R}/987654321", timeout=30).status_code == 404

# ---------- PUT ----------
def test_put_actualiza_y_reemplaza_competencias():
    e = crear()
    e["tipo"] = "Iniciativa"; e["impacto"] = "Bajo"; e["descripcion"] = desc("editado")
    e["competencias"] = [{"id": 0, "bitacoraEventoId": e["id"], "objetivoId": COMP_B}]
    r = requests.put(f"{R}/{e['id']}", json=e, timeout=30); assert r.status_code == 204, r.text
    g = requests.get(f"{R}/{e['id']}", timeout=30).json()
    assert g["tipo"] == "Iniciativa" and g["impacto"] == "Bajo" and "editado" in g["descripcion"]
    assert [c["objetivoId"] for c in g["competencias"]] == [COMP_B]
    assert g["fechaModificacion"] is not None and g["fechaRegistro"] == e["fechaRegistro"]

def test_put_otro_autor_403():
    e = crear(); e["registradoPorSecuencial"] = OTRO
    assert requests.put(f"{R}/{e['id']}", json=e, timeout=30).status_code == 403

def test_put_no_cambia_autor_ni_empleado():
    e = crear(); e["empleadoSecuencial"] = OTRO
    r = requests.put(f"{R}/{e['id']}", json=e, timeout=30)
    assert r.status_code in (204, 400)
    g = requests.get(f"{R}/{e['id']}", timeout=30).json()
    assert g["empleadoSecuencial"] == EMP and g["registradoPorSecuencial"] == SUP

def test_put_valida_igual_que_post():
    e = crear(); e["descripcion"] = "corta"
    assert requests.put(f"{R}/{e['id']}", json=e, timeout=30).status_code == 400

def test_put_id_distinto_o_inexistente():
    e = crear()
    assert requests.put(f"{R}/{e['id'] + 1000000}", json=e, timeout=30).status_code in (400, 404)

# ---------- DELETE logico ----------
def test_delete_logico_invisible_en_get_lista_y_por_id():
    e = crear()
    assert requests.delete(f"{R}/{e['id']}", params={"secuencial": SUP}, timeout=30).status_code == 204
    assert requests.get(f"{R}/{e['id']}", timeout=30).status_code == 404
    assert e["id"] not in [x["id"] for x in requests.get(R, params={"empleadoid": EMP}, timeout=30).json()]

def test_delete_otro_autor_403_y_sigue_visible():
    e = crear()
    assert requests.delete(f"{R}/{e['id']}", params={"secuencial": OTRO}, timeout=30).status_code == 403
    assert requests.get(f"{R}/{e['id']}", timeout=30).status_code == 200

def test_delete_sin_secuencial_400():
    e = crear()
    assert requests.delete(f"{R}/{e['id']}", timeout=30).status_code == 400

# ---------- resumen por periodo ----------
def test_resumen_cuenta_por_competencia_y_excluye_fuera_de_rango_e_inactivos():
    p = requests.get(f"{API}/api/Periods/{PERIODO}", timeout=30).json()
    ini = dt.date.fromisoformat(p["fechaInicio"][:10]); fin = dt.date.fromisoformat(p["fechaFin"][:10])
    dentro = min(fin, HOY) if ini <= HOY else ini
    a = crear(fechaEvento=dentro.isoformat(), tipo="Logro")
    b = crear(fechaEvento=dentro.isoformat(), tipo="Incumplimiento")
    fuera = crear(fechaEvento=(ini - dt.timedelta(days=1)).isoformat(), tipo="Logro")
    borrado = crear(fechaEvento=dentro.isoformat(), tipo="Logro")
    requests.delete(f"{R}/{borrado['id']}", params={"secuencial": SUP}, timeout=30)
    r = requests.get(f"{R}/resumen", params={"empleadoid": EMP, "periodoid": PERIODO}, timeout=30)
    assert r.status_code == 200, r.text
    fila = next(x for x in r.json() if x["objetivoId"] == COMP_A)
    ids = [ev["id"] for ev in fila["eventos"]]
    assert a["id"] in ids and b["id"] in ids and fuera["id"] not in ids and borrado["id"] not in ids
    assert fila["total"] == fila["logros"] + fila["incumplimientos"] + fila["iniciativas"] + fila["conductas"]
    assert fila["total"] == len(fila["eventos"]) and fila["logros"] >= 1 and fila["incumplimientos"] >= 1
    assert {"nombre", "grupo"} <= set(fila)

def test_resumen_periodo_inexistente_404():
    assert requests.get(f"{R}/resumen", params={"empleadoid": EMP, "periodoid": 999999}, timeout=30).status_code == 404

def test_resumen_sin_parametros_400():
    assert requests.get(f"{R}/resumen", timeout=30).status_code == 400

# ---------- equipo ----------
def test_equipo_del_supervisor_incluye_al_subordinado_con_conteos():
    crear(tipo="Conducta")
    r = requests.get(f"{R}/equipo", params={"supervisor": SUP, "desde": (HOY - dt.timedelta(days=30)).isoformat(),
                                             "hasta": HOY.isoformat()}, timeout=30)
    assert r.status_code == 200, r.text
    fila = next(x for x in r.json() if x["empleadoSecuencial"] == EMP)
    assert fila["nombre"] and fila["total"] >= 1 and fila["conductas"] >= 1
    assert fila["total"] == fila["logros"] + fila["incumplimientos"] + fila["iniciativas"] + fila["conductas"]

def test_equipo_sin_supervisor_400():
    assert requests.get(f"{R}/equipo", timeout=30).status_code == 400
