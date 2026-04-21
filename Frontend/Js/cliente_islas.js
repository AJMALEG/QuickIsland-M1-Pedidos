document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const idIsla = params.get('isla') || "1";
    
    // 1. Saludo Personalizado
    const usuario = localStorage.getItem('quicksiland_user') || "Juan"; // Usamos Juan por defecto
    document.getElementById('saludoUsuario').innerText = `Hola, ${usuario} 👋`;

    // 2. Nombres e Imagen Dinámica
    const nombres = {
        "1": "La Tiendita", "2": "Deli Sandwiches", "3": "Gorditas", 
        "4": "Churros", "5": "Quecas 2", "6": "Comida Corrida", 
        "7": "Agua Fresca", "8": "Pizza & Drinks"
    };

    const nombreIsla = nombres[idIsla] || "Isla " + idIsla;
    document.getElementById('nombreIslaHeader').innerText = nombreIsla;
    
    // APLICAR FONDO A TODA LA PÁGINA
    document.body.style.backgroundImage = `url('Images/isla${idIsla}bg.jpg')`;

    cargarProductosIsla(idIsla);
    actualizarContador();
});

async function cargarProductosIsla(id) {
    try {
        const res = await fetch(`Php/get_inventario.php?isla_id=${id}`);
        const productos = await res.json();
        const contenedor = document.getElementById('contenedor-productos');
        contenedor.innerHTML = "";

        productos.forEach(p => {
            if (p.stock > 0) {
                contenedor.innerHTML += `
                    <div class="card-bakery">
                        <h3>${p.nombre_producto}</h3>
                        <span class="precio">$${parseFloat(p.precio).toFixed(2)}</span>
                        <p style="font-size:0.7rem; opacity:0.6;">Stock: ${p.stock}</p>
                        <button class="btn-comprar" onclick="agregarCarrito(${p.id_producto}, '${p.nombre_producto}', ${p.precio}, ${id})">
                            AÑADIR
                        </button>
                    </div>`;
            }
        });
    } catch (e) { console.error(e); }
}

function agregarCarrito(id, nombre, precio, isla) {
    let carrito = JSON.parse(localStorage.getItem('qi_carrito')) || [];
    const existe = carrito.find(i => i.id_producto === id && i.id_isla === isla);
    
    if (existe) { existe.cantidad++; } 
    else { carrito.push({ id_producto: id, nombre, precio, id_isla: isla, cantidad: 1 }); }

    localStorage.setItem('qi_carrito', JSON.stringify(carrito));
    actualizarContador();
}

function actualizarContador() {
    const carrito = JSON.parse(localStorage.getItem('qi_carrito')) || [];
    const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    document.getElementById('cart-count').innerText = total;
}
