localStorage.removeItem("viajeActual");

const form = document.getElementById("viajeForm");
const tareasSeccion = document.getElementById("tareas");
const climaSeccion = document.getElementById("clima");
const infoViaje = document.getElementById("infoViaje");
const listaTareas = document.getElementById("listaTareas");
const nuevaTarea = document.getElementById("nuevaTarea");
let viajeActual = null;

// 🔹 Validar en vivo
form.addEventListener("input", validarFormulario);
form.addEventListener("submit", guardarViaje);

function validarFormulario() {
  const hoy = new Date().toISOString().split("T")[0];
  const nombre = document.getElementById("nombre");
  const destino = document.getElementById("destino");
  const salida = document.getElementById("salida");
  const regreso = document.getElementById("regreso");
  const email = document.getElementById("email");

  document.getElementById("errorNombre").textContent =
    nombre.value.length < 3 ? "Debe tener al menos 3 caracteres." : "";
  document.getElementById("errorDestino").textContent =
    destino.value === "" ? "Campo obligatorio." : "";
  document.getElementById("errorSalida").textContent =
    salida.value < hoy ? "No puede ser anterior a hoy." : "";
  document.getElementById("errorRegreso").textContent =
    regreso.value <= salida.value ? "Debe ser posterior a la salida." : "";
  document.getElementById("errorEmail").textContent =
    !email.value.includes("@") ? "Correo no válido." : "";
}

// 🔹 Guardar viaje
function guardarViaje(e) {
  e.preventDefault();
  const viaje = {
    id: Date.now(),
    nombre: nombre.value.trim(),
    destino: destino.value.trim(),
    salida: salida.value,
    regreso: regreso.value,
    email: email.value.trim(),
    tareas: []
  };
  localStorage.setItem("viajeActual", JSON.stringify(viaje));
  viajeActual = viaje;
  mostrarViaje();
  obtenerClima(viaje.destino);
}

// 🔹 Mostrar viaje
function mostrarViaje() {
  tareasSeccion.classList.remove("oculto");
  climaSeccion.classList.remove("oculto");

  infoViaje.innerHTML = `
    <h3>${viajeActual.nombre}</h3>
    <p>Destino: ${viajeActual.destino}</p>
    <p>Salida: ${viajeActual.salida}</p>
    <p>Regreso: ${viajeActual.regreso}</p>
  `;
  mostrarTareas();
}

// 🔹 Manejo de tareas
document.getElementById("agregarTarea").addEventListener("click", () => {
  const descripcion = nuevaTarea.value.trim();
  if (!descripcion) return;
  const tarea = { id: Date.now(), descripcion, completada: false };
  viajeActual.tareas.push(tarea);
  guardarLocal();
  mostrarTareas();
  nuevaTarea.value = "";
});

function mostrarTareas() {
  listaTareas.innerHTML = "";
  viajeActual.tareas.forEach(t => {
    const li = document.createElement("li");
    li.classList.toggle("completada", t.completada);
    li.innerHTML = `
      <span>${t.descripcion}</span>
      <div>
        <input type="checkbox" ${t.completada ? "checked" : ""}>
        <button class="eliminar">🗑️</button>
      </div>
    `;
    li.querySelector("input").addEventListener("change", () => {
      t.completada = !t.completada;
      guardarLocal();
      mostrarTareas();
    });
    li.querySelector(".eliminar").addEventListener("click", () => {
      viajeActual.tareas = viajeActual.tareas.filter(x => x.id !== t.id);
      guardarLocal();
      mostrarTareas();
    });
    listaTareas.appendChild(li);
  });
}

function guardarLocal() {
  localStorage.setItem("viajeActual", JSON.stringify(viajeActual));
}

// 🌦️ Clima con API Open-Meteo
async function obtenerClima(ciudad) {
  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${ciudad}&count=1&language=es`);
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      document.getElementById("infoClima").textContent = "Ciudad no encontrada.";
      return;
    }

    const { latitude, longitude, name, country } = geoData.results[0];
    const climaRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`);
    const climaData = await climaRes.json();
    const temp = climaData.current.temperature_2m;
    const weatherCode = climaData.current.weather_code;

    const condiciones = {
      0: "Despejado ☀️",
      1: "Mayormente despejado 🌤️",
      2: "Parcialmente nublado ⛅",
      3: "Nublado ☁️",
      45: "Niebla 🌫️",
      61: "Lluvia ligera 🌧️",
      80: "Chubascos 🌦️",
      95: "Tormenta eléctrica ⛈️"
    };

    const estado = condiciones[weatherCode] || "Clima desconocido";

    document.getElementById("infoClima").innerHTML = `
      <h3>${name}, ${country}</h3>
      <p>${temp}°C - ${estado}</p>
    `;
  } catch (err) {
    console.error("Error clima:", err);
    document.getElementById("infoClima").textContent = "No se pudo obtener el clima.";
  }
}

// 🔹 Cargar si ya existe un viaje guardado
window.addEventListener("DOMContentLoaded", () => {
  const guardado = localStorage.getItem("viajeActual");
  if (guardado) {
    viajeActual = JSON.parse(guardado);
    mostrarViaje();
    obtenerClima(viajeActual.destino);
  }
});
