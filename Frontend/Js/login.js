document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const roleToggle = document.getElementById('roleToggle');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append('userName', document.getElementById('userName').value);
            formData.append('userPass', document.getElementById('userPass').value);
            formData.append('role', roleToggle.checked ? 'gestor' : 'cliente');

            try {
                const response = await fetch('Php/login_valida.php', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    // GUARDAR DATOS DE SESIÓN COMPLETOS
                    localStorage.setItem('quicksiland_user', data.user);
                    localStorage.setItem('quicksiland_role', data.role);
                    // IMPORTANTE: Guardamos el ID real de la tabla usuarios
                    localStorage.setItem('quicksiland_user_id', data.id_cliente); 
                    
                    if (data.role === 'gestor') {
                        localStorage.setItem('quicksiland_isla', data.isla_id);
                        window.location.href = 'admin_pedidos.html';
                    } else {
                        window.location.href = 'seleccionarisla.html';
                    }
                } else {
                    alert(data.message);
                }
            } catch (error) {
                alert("Error al conectar con el servidor.");
            }
        });
    }
});
