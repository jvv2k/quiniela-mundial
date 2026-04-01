const { createClient } = supabase;
const supabaseUrl = 'https://nllmhovvzabuefafkgts.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sbG1ob3Z2emFidWVmYWZrZ3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDQwOTgsImV4cCI6MjA5MDA4MDA5OH0.G6KXr1RkzHgFRn7uHC14t5IdazTT3aKaJIbaWiwKU9c';

const _supabase = createClient(supabaseUrl, supabaseKey);

// 1. Si ya hay una sesión activa, saltar el login
if (localStorage.getItem('usuarioID')) {
    window.location.href = "quiniela.html";
}

const btnLogin = document.getElementById('btnLogin');

if (btnLogin) {
    btnLogin.addEventListener('click', async () => {
        const id = document.getElementById('id_login').value;
        const pass = document.getElementById('pass_login').value;

        if (!id || !pass) {
            alert("Por favor, ingresa tu ID y contraseña.");
            return;
        }

        // 2. Buscamos al usuario (traemos todo, incluyendo foto_url)
        const { data, error } = await _supabase
            .from('usuarios')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            alert("Usuario no encontrado. Revisa tu ID.");
        } else {
            // 3. Verificamos contra la columna 'pass' de tu captura
            if (data.pass === pass) { 
                // GUARDAR DATOS CLAVE
                localStorage.setItem('usuarioNombre', data.nombre);
                localStorage.setItem('usuarioID', data.id); 
                localStorage.setItem('usuarioFoto', data.foto_url || ''); // Guardamos la foto

                alert("¡Bienvenido, " + data.nombre + "!");
                window.location.href = "quiniela.html";
            } else {
                alert("Contraseña incorrecta.");
            }
        }
    });
}