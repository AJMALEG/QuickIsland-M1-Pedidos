document.addEventListener('DOMContentLoaded', () => {
    const folio = localStorage.getItem('ultimo_pedido_id');
    if (!folio) {
        window.location.href = 'seleccionarisla.html';
        return;
    }
    document.getElementById('folioNum').innerText = "#" + folio;

    // Consultar cada 4 segundos
    setInterval(() => checkStatus(folio), 4000);
    checkStatus(folio); // Primera carga
});

async function checkStatus(id) {
    try {
        const res = await fetch(`./Php/get_estado_pedido.php?id=${id}`);
        const data = await res.json();

        if (data.success) {
            actualizarUI(data.estado);
        }
    } catch (e) { console.error("Error consultando estado"); }
}

function actualizarUI(estado) {
    const msg = document.getElementById('mensajeEstado');
    const btn = document.getElementById('btnConfirmarRecibido');
    
    // Limpiar clases
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));

    if (estado === 'En espera') {
        document.getElementById('step-espera').classList.add('active');
        msg.innerText = "El gestor está revisando tu orden...";
    } 
    else if (estado === 'Preparando') {
        document.getElementById('step-espera').classList.add('active');
        document.getElementById('step-preparando').classList.add('active');
        msg.innerText = "¡Tu pedido se está preparando ahora mismo!";
    } 
    else if (estado === 'Listo') {
        document.querySelectorAll('.step').forEach(s => s.classList.add('active'));
        msg.innerText = "¡TU PEDIDO ESTÁ LISTO EN BARRA! ✅";
        msg.style.color = "#2ecc71";
        
        // ACTIVAR BOTÓN
        btn.disabled = false;
        btn.style.background = "#2ecc71";
        btn.style.cursor = "pointer";
    }
}

async function finalizarTodo() {
    const id = localStorage.getItem('ultimo_pedido_id');
    
    try {
        // Avisamos al servidor que el cliente ya tiene su pedido
        const res = await fetch('./Php/actualizar_estado_pedido.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, estado: 'Finalizado' })
        });

        const data = await res.json();
        if (data.success) {
            alert("¡Gracias por tu compra! Disfruta tu producto.");
            localStorage.removeItem('ultimo_pedido_id');
            localStorage.removeItem('qi_carrito'); // Limpieza extra
            window.location.href = 'seleccionarisla.html';
        }
    } catch (e) {
        console.error("Error al finalizar:", e);
    }
}
