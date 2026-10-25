"use strict";

/* ===== Estado ===== */
const CLAVE = "area-triangular-ejercicios";
let ejercicios = cargar();
let seleccionId = null;   // fila seleccionada en la tabla
let editandoId = null;    // ejercicio que se está modificando
let ultimoCalculo = null; // { b, h, unidad, area }

/* ===== Elementos ===== */
const $ = (id) => document.getElementById(id);
const nombre = $("nombre"), altura = $("altura"), base = $("base"), unidad = $("unidad");
const mensaje = $("mensaje"), cuerpo = $("tabla-cuerpo"), vacio = $("vacio");

/* ===== Utilidades ===== */
function cargar() {
  try { return JSON.parse(localStorage.getItem(CLAVE)) || []; }
  catch { return []; }
}
function guardarLocal() {
  try { localStorage.setItem(CLAVE, JSON.stringify(ejercicios)); } catch { /* sin almacenamiento */ }
}
function fmt(n) {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10000) / 10000);
}
function avisar(texto, tipo = "") {
  mensaje.textContent = texto;
  mensaje.className = "mensaje " + tipo;
}
function escapar(t) {
  const d = document.createElement("div");
  d.textContent = t;
  return d.innerHTML;
}

/* ===== Cálculo ===== */
function leerMedidas() {
  const b = parseFloat(base.value);
  const h = parseFloat(altura.value);
  if (Number.isNaN(b) || Number.isNaN(h)) {
    avisar("Escribe la base y la altura.", "error");
    return null;
  }
  if (b <= 0 || h <= 0) {
    avisar("La base y la altura deben ser mayores que 0.", "error");
    return null;
  }
  return { b, h, unidad: unidad.value };
}

function mostrarResultado({ b, h, unidad: u, area }) {
  $("paso1").textContent = `b · h = ${fmt(b)} · ${fmt(h)} = ${fmt(b * h)}`;
  $("paso2").textContent = `${fmt(b * h)} / 2 = ${fmt(area)}`;
  $("area").innerHTML = `${fmt(area)} <small>${u}<sup>2</sup></small>`;
}

function calcular() {
  const m = leerMedidas();
  if (!m) return null;
  ultimoCalculo = { ...m, area: (m.b * m.h) / 2 };
  mostrarResultado(ultimoCalculo);
  avisar("Cálculo listo. Pulsa Guardar para añadirlo a la lista.", "ok");
  return ultimoCalculo;
}

/* ===== Guardar / modificar ===== */
function guardar() {
  const m = leerMedidas();
  if (!m) return;
  const titulo = nombre.value.trim();
  if (!titulo) {
    avisar("Escribe un nombre para el ejercicio.", "error");
    nombre.focus();
    return;
  }
  const calc = { ...m, area: (m.b * m.h) / 2 };
  ultimoCalculo = calc;
  mostrarResultado(calc);

  if (editandoId !== null) {
    const i = ejercicios.findIndex((e) => e.id === editandoId);
    if (i >= 0) ejercicios[i] = { id: editandoId, nombre: titulo, ...calc };
    avisar("Ejercicio modificado.", "ok");
    seleccionId = editandoId;
    editandoId = null;
    $("btn-guardar").textContent = "Guardar";
  } else {
    const id = Date.now();
    ejercicios.push({ id, nombre: titulo, ...calc });
    seleccionId = id;
    avisar("Ejercicio guardado.", "ok");
  }
  guardarLocal();
  dibujarTabla();
  limpiarCampos();
}

/* ===== Limpiar / nuevo ===== */
function limpiarCampos() {
  nombre.value = "";
  altura.value = "";
  base.value = "";
  unidad.value = "cm";
}
function limpiarFormulario() {
  limpiarCampos();
  editandoId = null;
  $("btn-guardar").textContent = "Guardar";
  avisar("");
  $("paso1").textContent = "Calcula para ver los pasos.";
  $("paso2").textContent = "";
  $("area").textContent = "—";
  ultimoCalculo = null;
}
function nuevo() {
  limpiarFormulario();
  nombre.focus();
}

/* ===== Tabla ===== */
function dibujarTabla() {
  cuerpo.innerHTML = "";
  ejercicios.forEach((e, i) => {
    const tr = document.createElement("tr");
    tr.dataset.id = e.id;
    if (e.id === seleccionId) tr.classList.add("seleccionada");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${escapar(e.nombre)}</td>
      <td>${fmt(e.b)} ${e.unidad}</td>
      <td>${fmt(e.h)} ${e.unidad}</td>
      <td>${fmt(e.area)} ${e.unidad}²</td>
      <td>
        <button class="icono-btn" data-accion="editar" title="Modificar" aria-label="Modificar ${escapar(e.nombre)}">✏️</button>
        <button class="icono-btn" data-accion="borrar" title="Eliminar" aria-label="Eliminar ${escapar(e.nombre)}">🗑️</button>
      </td>`;
    cuerpo.appendChild(tr);
  });
  vacio.hidden = ejercicios.length > 0;
}

function buscar(id) {
  return ejercicios.find((e) => e.id === Number(id));
}

function modificar(id) {
  const e = buscar(id);
  if (!e) return avisar("Selecciona un ejercicio de la lista.", "error");
  editandoId = e.id;
  seleccionId = e.id;
  nombre.value = e.nombre;
  altura.value = e.h;
  base.value = e.b;
  unidad.value = e.unidad;
  mostrarResultado(e);
  $("btn-guardar").textContent = "Guardar cambios";
  avisar("Edita los datos y pulsa Guardar cambios.", "ok");
  dibujarTabla();
  nombre.focus();
}

function eliminar(id) {
  const e = buscar(id);
  if (!e) return avisar("Selecciona un ejercicio de la lista.", "error");
  if (!confirm(`¿Eliminar "${e.nombre}"?`)) return;
  ejercicios = ejercicios.filter((x) => x.id !== e.id);
  if (editandoId === e.id) limpiarFormulario();
  seleccionId = null;
  guardarLocal();
  dibujarTabla();
  avisar("Ejercicio eliminado.", "ok");
}

function consultar(id) {
  const e = buscar(id);
  if (!e) return avisar("Selecciona un ejercicio de la lista.", "error");
  seleccionId = e.id;
  mostrarResultado(e);
  dibujarTabla();
  avisar(`Consultando: ${e.nombre}`, "ok");
}

/* ===== Eventos ===== */
$("btn-calcular").addEventListener("click", calcular);
$("btn-guardar").addEventListener("click", guardar);
$("btn-limpiar").addEventListener("click", limpiarFormulario);

$("btn-nuevo").addEventListener("click", nuevo);
$("btn-modificar").addEventListener("click", () => modificar(seleccionId));
$("btn-eliminar").addEventListener("click", () => eliminar(seleccionId));
$("btn-consultar").addEventListener("click", () => consultar(seleccionId));

cuerpo.addEventListener("click", (ev) => {
  const fila = ev.target.closest("tr");
  if (!fila) return;
  const id = Number(fila.dataset.id);
  const accion = ev.target.closest("button")?.dataset.accion;
  if (accion === "editar") return modificar(id);
  if (accion === "borrar") return eliminar(id);
  consultar(id); // clic en la fila = seleccionar y mostrar resultado
});

[nombre, altura, base].forEach((el) =>
  el.addEventListener("keydown", (ev) => { if (ev.key === "Enter") calcular(); })
);

/* ===== Inicio ===== */
dibujarTabla();
if (ejercicios.length === 0) {
  // Ejemplo del boceto: h = 2, b = 6 → 6 cm²
  mostrarResultado({ b: 6, h: 2, unidad: "cm", area: 6 });
}
