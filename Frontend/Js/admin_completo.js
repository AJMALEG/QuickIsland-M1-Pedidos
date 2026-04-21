/**
 * QuickIsland - Panel Gestor Maestro
 * Versión Final: Sincronización Inteligente + Buscador + Relleno de Stock
 */

// VARIABLES GLOBALES PARA CONTROL DE ESTADO (ANTIPARPADEO)
let ultimoEstadoPedidos = "";
let ultimoEstadoInventario = "";
let estaBuscando = false; // Bloqueador del refresco automático

document.addEventListener('DOMContentLoaded', () => {
    // 1. Validar Sesión del Administrador
    const user = localStorage.getItem('quicksiland_user');
    const islaId = localStorage.getItem('quicksiland_isla'); 

    if (!user || !islaId) {
        alert("Sesión expirada. Regresando al login.");
        window.location.href = 'index.html';
        return;
    }

    // 2. Identidad en el Header
    const displayNombre = document.getElementById('nombreIslaDisplay');
    const displayAdmin = document.getElementById('adminNameDisplay');
    if (displayAdmin) displayAdmin.innerText = user;
    
    const nombresIslas = { 
        "1": "La Tiendita", "2": "Deli Sandwiches", "3": "Gorditas", "4": "Churros", 
        "5": "QUECAS 2", "6": "Comida Corrida", "7": "Agua Fresca", "8": "Pizza & Drinks" 
    };
    if (displayNombre) displayNombre.innerText = nombresIslas[islaId] || "Isla " + islaId;

    // 3. Carga Inicial
    cargarDatosInventario(islaId);
    monitorearPedidos(islaId);
    
    // 4. INTERVALO MAESTRO (Sincronización cada 5 segundos)
    setInterval(() => {
        // Solo actualizamos pedidos si NO estamos buscando
        if (!estaBuscando) {
            monitorearPedidos(islaId);
        }
        cargarDatosInventario(islaId);  
    }, 5000);

    // 5. LÓGICA DEL BUSCADOR DE PEDIDOS
    const searchInput = document.getElementById('inputBusquedaPedido');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const valor = e.target.value.trim();
            if (valor.length > 0) {
                estaBuscando = true; // Pausar monitor de 5 seg
                ejecutarBusquedaPedido(islaId, valor);
            } else {
                limpiarBusqueda(); // Reanudar monitor
            }
        });
    }

    // 6. FORMULARIO DE ALTAS (INSERT)
    const form = document.getElementById('formRegistro');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append('nombre', document.getElementById('prodNombre').value);
            formData.append('descripcion', document.getElementById('prodDesc').value);
            formData.append('precio', document.getElementById('prodPrecio').value);
            formData.append('stock', document.getElementById('prodStock').value);
            formData.append('id_isla', islaId);

            try {
                const res = await fetch('Php/alta_producto.php', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.success) {
                    alert("¡Producto añadido con éxito!");
                    form.reset();
                    ultimoEstadoInventario = ""; // Forzar refresco visual
                    cargarDatosInventario(islaId); 
                }
            } catch (err) { alert("Error al registrar."); }
        });
    }
});

// --- MONITOR DE PEDIDOS (LÓGICA DE 5 FILAS + GRIS) ---
async function monitorearPedidos(islaId) {
    if (estaBuscando) return; // No interrumpir la búsqueda del gestor

    try {
        const res = await fetch(`./Php/get_pedidos_isla.php?isla_id=${islaId}`);
        const todos = await res.json();
        
        // Antiparpadeo: Si nada cambió, no redibujar
        const estadoActual = JSON.stringify(todos);
        if (estadoActual === ultimoEstadoPedidos) return;
        ultimoEstadoPedidos = estadoActual;

        const tabla = document.getElementById('tablaPedidosBarra');
        if (!tabla) return;
        
        // 1. Filtrar Activos vs Finalizados
        const activos = todos.filter(p => p.estado_pedido !== 'Finalizado' && p.estado_pedido !== 'Cancelado');
        const completados = todos.filter(p => p.estado_pedido === 'Finalizado');

        const MAX = 5;
        let listaMostrar = [];

        // 2. Lógica de prioridad: Activos primero, rellenar con completados
        if (activos.length >= MAX) {
            listaMostrar = activos.slice(0, MAX);
        } else {
            const espacioLibrado = MAX - activos.length;
            const recientesCompletados = completados.slice(0, espacioLibrado);
            listaMostrar = [...activos, ...recientesCompletados];
        }

        tabla.innerHTML = "";
        renderizarFilasPedidos(listaMostrar, tabla);

        // 3. Aviso de Cola (+X)
        gestionarAvisoCola(activos.length - MAX);

    } catch (e) { console.error("Error monitor:", e); }
}

// --- BUSCADOR DE PEDIDOS ---
async function ejecutarBusquedaPedido(islaId, termino) {
    try {
        const res = await fetch(`./Php/get_buscar_pedido.php?isla_id=${islaId}&termino=${termino}`);
        const resultados = await res.json();
        const tabla = document.getElementById('tablaPedidosBarra');
        
        tabla.innerHTML = "";
        const aviso = document.getElementById('mensajeColaContenedor');
        if(aviso) aviso.innerHTML = ""; // Limpiar cola en búsqueda

        if (resultados.length === 0) {
            tabla.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:20px; opacity:0.5;'>Sin coincidencias para ese folio o cliente.</td></tr>";
            return;
        }

        renderizarFilasPedidos(resultados, tabla);
    } catch (e) { console.error("Error búsqueda:", e); }
}

// --- LIMPIAR BÚSQUEDA ---
function limpiarBusqueda() {
    const input = document.getElementById('inputBusquedaPedido');
    if(input) input.value = "";
    estaBuscando = false; 
    ultimoEstadoPedidos = ""; // Resetear memoria para forzar redibujado
    monitorearPedidos(localStorage.getItem('quicksiland_isla'));
}

// --- AUXILIAR: DIBUJAR FILAS (REUTILIZABLE) ---
function renderizarFilasPedidos(lista, tabla) {
    lista.forEach(p => {
        const esFin = p.estado_pedido === 'Finalizado';
        let color = "#f1c40f"; 
        let rowStyle = esFin ? "style='opacity: 0.4; filter: grayscale(1); background: rgba(255,255,255,0.03);'" : "";

        if (p.estado_pedido === 'Preparando') color = "#3498db";
        if (p.estado_pedido === 'Listo') color = "#2ecc71";
        if (esFin) color = "#555";

        tabla.innerHTML += `
            <tr ${rowStyle}>
                <td><b>#${p.id_pedido}</b></td>
                <td>${p.nombre_cliente || 'Anónimo'}</td>
                <td style="font-size: 0.8rem;">${p.resumen_productos}</td>
                <td>
                    <span style="background:${color}; color:${esFin ? '#aaa' : 'black'}; padding:3px 8px; border-radius:4px; font-weight:bold; font-size:0.7rem;">
                        ${esFin ? 'COMPLETADO' : p.estado_pedido.toUpperCase()}
                    </span>
                </td>
                <td>
                    ${!esFin ? `
                        <select onchange="cambiarEstadoPedido(${p.id_pedido}, this.value)" style="background:#111; color:white; border:1px solid #444; font-size:0.75rem; border-radius:4px;">
                            <option value="">Estado...</option>
                            <option value="Preparando">Preparar</option>
                            <option value="Listo">Listo</option>
                            <option value="Finalizado">Finalizar</option>
                            <option value="Cancelado">Cancelar</option>
                        </select>
                    ` : '<span style="color:#777; font-size:0.8rem;"><i class="fas fa-check-double"></i> Entregado</span>'}
                </td>
            </tr>`;
    });
}

// --- AVISO DE COLA ---
function gestionarAvisoCola(cantidad) {
    const contenedor = document.getElementById('mensajeColaContenedor');
    if (!contenedor) return;

    if (cantidad > 0) {
        contenedor.innerHTML = `<div style="background:rgba(231,76,60,0.15); color:#e74c3c; padding:10px; border-radius:8px; margin-top:10px; text-align:center; border:1px solid #e74c3c; font-weight:bold;">⚠️ HAY ${cantidad} PEDIDO(S) MÁS EN COLA</div>`;
    } else {
        contenedor.innerHTML = "";
    }
}

// --- INVENTARIO (CON RELLENO Y ANTIPARPADEO) ---
async function cargarDatosInventario(islaId) {
    try {
        const res = await fetch(`./Php/get_inventario.php?isla_id=${islaId}`);
        const productos = await res.json();
        
        const estadoActual = JSON.stringify(productos);
        if (estadoActual === ultimoEstadoInventario) return;
        ultimoEstadoInventario = estadoActual;

        const tAltas = document.getElementById('tablaInventarioAltas');
        const tBajas = document.getElementById('tablaInventarioBajas');
        if (!tAltas || !tBajas) return;

        tAltas.innerHTML = ""; tBajas.innerHTML = "";

        productos.forEach(p => {
            const stockActual = parseInt(p.stock);
            let celdaS = "";
            if (stockActual <= 0) {
                celdaS = `<div style="display:flex; align-items:center; gap:8px;"><b style="color:#e74c3c;">AGOTADO</b> <button onclick="solicitarRelleno(${p.id_producto}, '${p.nombre_producto}')" style="background:#f1c40f; border:none; border-radius:4px; padding:2px 8px; font-weight:bold; cursor:pointer; font-size:0.65rem;">RELLENAR</button></div>`;
            } else {
                celdaS = `<b style="color:${stockActual < 5 ? '#e74c3c' : '#f1c40f'};">${stockActual}</b>`;
            }

            tAltas.innerHTML += `<tr><td>#${p.id_producto}</td><td>${p.nombre_producto}</td><td>$${parseFloat(p.precio).toFixed(2)}</td><td>${celdaS}</td></tr>`;
            tBajas.innerHTML += `<tr><td>#${p.id_producto}</td><td>${p.nombre_producto}</td><td>$${parseFloat(p.precio).toFixed(2)}</td><td style="text-align:center;"><button onclick="eliminarProducto(${p.id_producto})" style="color:#e74c3c; background:none; border:none; cursor:pointer;"><i class="fas fa-trash-alt"></i></button></td></tr>`;
        });
    } catch (e) { console.error(e); }
}

// --- RELLENO MANUAL ---
async function solicitarRelleno(id, nombre) {
    if (confirm(`¿Agregar stock a: ${nombre}?`)) {
        const cantidadStr = prompt(`¿Unidades nuevas de "${nombre}"?`, "10");
        const cantidad = parseInt(cantidadStr);
        if (!isNaN(cantidad) && cantidad > 0) {
            const res = await fetch('./Php/actualizar_stock_manual.php', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id_producto: id, nueva_cantidad: cantidad, isla_id: localStorage.getItem('quicksiland_isla')})});
            const data = await res.json();
            if (data.success) { ultimoEstadoInventario = ""; cargarDatosInventario(localStorage.getItem('quicksiland_isla')); }
        }
    }
}

// --- ELIMINAR ---
async function eliminarProducto(id) {
    if (!confirm("¿Eliminar producto?")) return;
    const res = await fetch(`./Php/eliminar_producto.php?id=${id}`);
    const data = await res.json();
    if (data.success) { ultimoEstadoInventario = ""; cargarDatosInventario(localStorage.getItem('quicksiland_isla')); }
}

// --- ESTADO ---
async function cambiarEstadoPedido(id, nuevo) {
    if (!nuevo) return;
    const res = await fetch('./Php/actualizar_estado_pedido.php', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id: id, estado: nuevo})});
    const data = await res.json();
    if (data.success) { ultimoEstadoPedidos = ""; monitorearPedidos(localStorage.getItem('quicksiland_isla')); }
}

// --- TABS ---
function showTab(tabId, element) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    element.classList.add('active');
    if(tabId === 'tab-pedidos') { monitorearPedidos(localStorage.getItem('quicksiland_isla')); }
}
