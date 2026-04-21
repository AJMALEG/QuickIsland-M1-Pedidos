// 1. Función Global de Navegación
function irAIsla(id) {
    if (!id) {
        console.error("ID de isla no recibido");
        return;
    }
    console.log("Navegando a isla:", id);
    window.location.href = `cliente_isla.html?isla=${id}`;
}

// 2. Buscador Maestro
async function buscarGlobalCliente(valor) {
    const contenedor = document.getElementById('resultadosBusqueda');
    
    if (valor.length < 2) { 
        contenedor.style.display = 'none'; 
        return; 
    }

    try {
        const res = await fetch(`./Php/get_inventario.php?search=${valor}`);
        const productos = await res.json();
        
        contenedor.innerHTML = "";
        contenedor.style.display = 'block';

        if (productos && productos.length > 0) {
            productos.forEach(p => {
                const item = document.createElement('div');
                item.className = "result-item";
                
                // Ahora p.id_isla ya existe gracias al cambio en el PHP
                item.onclick = () => {
                    console.log("Producto seleccionado:", p);
                    irAIsla(p.id_isla);
                };

                item.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%; padding:10px;">
                        <div>
                            <b style="color:#f1c40f;">${p.nombre_producto}</b>
                            <div style="font-size:0.75rem; color:white; opacity:0.8;">
                                ${p.descripcion ? p.descripcion.substring(0, 40) : 'Delicia QuickIsland...'}
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-weight:bold; color:white;">$${parseFloat(p.precio).toFixed(2)}</div>
                            <div style="font-size:0.7rem; color:#f1c40f;">En: ${p.nombre_isla}</div>
                        </div>
                    </div>
                `;
                contenedor.appendChild(item);
            });
        } else {
            contenedor.innerHTML = "<div style='padding:15px; color:white; opacity:0.5;'>Sin resultados...</div>";
        }
    } catch (e) { 
        console.error("Error en búsqueda:", e); 
    }
}

// 3. Configuración al cargar (Slider y Saludo)
document.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('quicksiland_user') || 'Usuario';
    const greet = document.getElementById('userGreeting');
    if(greet) greet.innerText = user;

    const promos = [
        { t: "Pizza 3 Quesos", d: "Una delicia en un instante (isla8)", i: "Images/pizzamov.jpg" },
        { t: "Baguette Italiano", d: "Pan artesanal premium (isla2)", i: "Images/baggetemov.jpg" },
        { t: "Tacos De Pastor", d: "Sabor tradicional único", i: "Images/tacosmov.jpg" }
    ];

    let idx = 0;
    const hero = document.getElementById('heroSlider');
    const hTitle = document.getElementById('promoTitle');
    const hDesc = document.getElementById('promoDesc');

    function rotate() {
        if(!hero) return;
        const p = promos[idx];
        hero.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${p.i}')`;
        hero.style.backgroundSize = "cover";
        hero.style.backgroundPosition = "center";
        if(hTitle) hTitle.innerText = p.t;
        if(hDesc) hDesc.innerText = p.d;
        idx = (idx + 1) % promos.length;
    }

    setInterval(rotate, 5000);
    rotate();

    // Cerrar buscador al hacer clic fuera
    document.addEventListener('click', (e) => {
        const results = document.getElementById('resultadosBusqueda');
        if (results && !e.target.closest('.search-wrapper')) {
            results.style.display = 'none';
        }
    });
});
