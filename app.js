const { createClient } = supabase;
const supabaseUrl = 'https://nllmhovvzabuefafkgts.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sbG1ob3Z2emFidWVmYWZrZ3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDQwOTgsImV4cCI6MjA5MDA4MDA5OH0.G6KXr1RkzHgFRn7uHC14t5IdazTT3aKaJIbaWiwKU9c';

const _supabase = createClient(supabaseUrl, supabaseKey);

const btnRegistrar = document.getElementById('btnRegistrar');

if (btnRegistrar) {
    btnRegistrar.addEventListener('click', async () => {
        // Obtenemos los valores de los inputs
        const nombreUsuario = document.getElementById('id_input').value.trim(); // Este es el "apodo"
        const nombreReal = document.getElementById('nombre_input').value.trim();
        const correo = document.getElementById('correo_input').value.trim();
        const pass = document.getElementById('pass_input').value.trim();
        
        const inputFoto = document.getElementById('foto_input');
        const archivo = inputFoto.files[0];

        // Validaciones básicas
        if(!correo || !nombreReal || !pass) {
            alert("Por favor, llena los campos obligatorios (Correo, Nombre y Contraseña).");
            return;
        }

        // --- PASO 1: REGISTRO EN AUTHENTICATION (Para que aparezcan en la lista de Users) ---
        const { data: authData, error: authError } = await _supabase.auth.signUp({
            email: correo,
            password: pass,
        });

        if (authError) {
            alert("Error en el registro de cuenta: " + authError.message);
            return;
        }

        const usuarioIdOficial = authData.user.id; // Este es el ID (UUID) que genera Supabase
        let fotoUrlFinal = null;

        // --- PASO 2: SUBIDA DE LA FOTO AL STORAGE ---
        if (archivo) {
            const extension = archivo.name.split('.').pop();
            // Usamos el ID oficial para que la foto sea única
            const nombreArchivo = `${usuarioIdOficial}_${Date.now()}.${extension}`;

            const { data: uploadData, error: uploadError } = await _supabase.storage
                .from('fotos_perfil')
                .upload(nombreArchivo, archivo);

            if (!uploadError) {
                const { data: publicUrlData } = _supabase.storage
                    .from('fotos_perfil')
                    .getPublicUrl(nombreArchivo);
                
                fotoUrlFinal = publicUrlData.publicUrl;
            }
        }

        // --- PASO 3: REGISTRO EN LA TABLA USUARIOS (Vinculamos Auth con Datos) ---
        const { error: dbError } = await _supabase
            .from('usuarios')
            .insert([{ 
                id: usuarioIdOficial, // IMPORTANTE: Guardamos el ID de Auth
                nombre: nombreReal, 
                correo: correo, 
                foto_url: fotoUrlFinal,
                pass: pass // Opcional, ya que Auth ya la gestiona de forma segura
            }]);

        if (dbError) {
            console.error("Error al guardar perfil:", dbError);
            alert("Cuenta creada, pero hubo un error con tus datos de perfil.");
        } else {
            alert("¡Registro exitoso! Ya eres parte de la Quiniela Pro.");
            window.location.href = "login.html"; 
        }
    });
}