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
        // Ahora usamos el CORREO para el login oficial
        const email = document.getElementById('id_login').value.trim(); 
        const pass = document.getElementById('pass_login').value.trim();

        if (!email || !pass) {
            alert("Por favor, ingresa tu correo y contraseña.");
            return;
        }

        // --- PASO 1: LOGIN OFICIAL EN SUPABASE AUTH ---
        const { data: authData, error: authError } = await _supabase.auth.signInWithPassword({
            email: email,
            password: pass
        });

        if (authError) {
            alert("Error: " + authError.message); // Nos dirá si la clave está mal o el usuario no existe
            return;
        }

        const userAuthId = authData.user.id; // El ID único (UUID)

        // --- PASO 2: BUSCAR SUS DATOS EXTRA EN LA TABLA 'USUARIOS' ---
        const { data: usuarioDB, error: dbError } = await _supabase
            .from('usuarios')
            .select('*')
            .eq('id', userAuthId)
            .single();

        if (dbError || !usuarioDB) {
            console.error("Error trayendo datos de perfil:", dbError);
            // Si por algo falla el perfil, igual dejamos pasar porque la cuenta es válida
            localStorage.setItem('usuarioID', userAuthId);
            window.location.href = "quiniela.html";
        } else {
            // GUARDAR DATOS CLAVE EN EL NAVEGADOR
            localStorage.setItem('usuarioNombre', usuarioDB.nombre);
            localStorage.setItem('usuarioID', usuarioDB.id); 
            localStorage.setItem('usuarioFoto', usuarioDB.foto_url || '');

            alert("¡Bienvenido, " + usuarioDB.nombre + "!");
            window.location.href = "quiniela.html";
        }
    });
}