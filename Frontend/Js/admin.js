document.addEventListener('DOMContentLoaded', () => {
    const usuario = localStorage.getItem('quicksiland_user');
    const idIsla = localStorage.getItem('quicksiland_isla');

    if (!usuario || !idIsla) {
        alert("Sesión no válida. Regresa al login.");
        window.location.href = 'index.html';
        return;
    }

    // Poner el nombre del gestor
    document.getElementById('adminNameDisplay').innerText = usuario;
    
    // Cargar datos
    cargarDatosPanel(idIsla);

    // Manejo del formulario (INSERT)
    const form = document.getElementById('formRegistro');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('nombre', document.getElementById('prodNombre').value);
        formData.append('precio', document.getElementById('prodPrecio').value);
        formData.append('stock', document.getElementById('prodStock').value);
        formData.append('id_isla', idIsla);

        try {
            const response = await fetch('Php/alta_producto.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                alert("¡Producto guardado con éxito!");
                form.reset();
                cargarDatosPanel(idIsla);
            } else {
                alert("Error: " + result.message);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error al conectar con alta_producto.php");
        }
    });
});

async function cargarDatosPanel(islaId) {
    const nombresIslas = {
        "1": "La Tiendita", "2": "Deli Sandwiches", "3": "Gorditas", "4": "Churros",
        "5": "QUECAS 2", "6": "Comida Corrida", "7": "Agua Fresca", "8": "Pizza & Drinks"
    };

    const tabla = document.getElementById('tablaInventario');
    const tituloIsla = document.getElementById('nombreIslaDisplay');
    const formIslaLabel = document.getElementById('nombreIslaForm');

    // Nombres inmediatos
    const nombreReal = nombresIslas[islaId] || `Isla ${islaId}`;
    tituloIsla.innerText = nombreReal;
    formIslaLabel.innerText = nombreReal;

    try {
        // Fetch al PHP corregido
        const response = await fetch(`./Php/get_inventario.php?isla_id=${islaId}`);
        const productos = await response.json();

        tabla.innerHTML = "";

        if (productos && productos.length > 0 && !productos.error) {
            productos.forEach(p => {
                const stock = parseInt(p.cantidad_disponible);
                const badgeColor = stock > 0 ? '#2ecc71' : '#e74c3c';
                
                tabla.innerHTML += `
                    <tr>
                        <td>${p.nombre}</td>
                        <td>$${parseFloat(p.precio).toFixed(2)}</td>
                        <td>${stock}</td>
                        <td><span style="background:${badgeColor}; padding:4px 8px; border-radius:4px; color:white; font-size:10px; font-weight:bold;">
                            ${stock > 0 ? 'DISPONIBLE' : 'AGOTADO'}
                        </span></td>
                    </tr>`;
            });
        } else {
            tabla.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#888;">No hay productos registrados aún.</td></tr>`;
        }
    } catch (e) {
        console.error("Fallo al cargar:", e);
        tabla.innerHTML = `<tr><td colspan="4" style="text-align:center; color:orange;">Aviso: No se pudo cargar el inventario (revisa la consola F12).</td></tr>`;
    }
}
