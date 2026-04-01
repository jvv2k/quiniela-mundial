const { createClient } = supabase;
const supabaseUrl = 'https://nllmhovvzabuefafkgts.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sbG1ob3Z2emFidWVmYWZrZ3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDQwOTgsImV4cCI6MjA5MDA4MDA5OH0.G6KXr1RkzHgFRn7uHC14t5IdazTT3aKaJIbaWiwKU9c';

const _supabase = createClient(supabaseUrl, supabaseKey);

const btnRegistrar = document.getElementById('btnRegistrar');

if (btnRegistrar) {
    btnRegistrar.addEventListener('click', async () => {
        const id = document.getElementById('id_input').value.trim();
        const nombre = document.getElementById('nombre_input').value.trim();
        const correo = document.getElementById('correo_input').value.trim();
        const pass = document.getElementById('pass_input').value.trim();
        
        // Capturamos el archivo de la galería
        const inputFoto = document.getElementById('foto_input');
        const archivo = inputFoto.files[0];

        if(!id || !nombre || !pass) {
            alert("Por favor, llena los campos obligatorios (ID, Nombre y Contraseña).");
            return;
        }

        let fotoUrlFinal = null;

        // --- 1. SUBIDA DE LA FOTO AL STORAGE ---
        if (archivo) {
            // Creamos un nombre de archivo único usando el ID del usuario y la fecha
            const extension = archivo.name.split('.').pop();
            const nombreArchivo = `${id}_${Date.now()}.${extension}`;

            const { data: uploadData, error: uploadError } = await _supabase.storage
                .from('fotos_perfil')
                .upload(nombreArchivo, archivo);

            if (uploadError) {
                console.error("Error subiendo imagen:", uploadError);
                alert("Hubo un error al subir tu foto, pero intentaremos registrarte sin ella.");
            } else {
                // Obtenemos la URL pública para guardarla en la tabla
                const { data: publicUrlData } = _supabase.storage
                    .from('fotos_perfil')
                    .getPublicUrl(nombreArchivo);
                
                fotoUrlFinal = publicUrlData.publicUrl;
            }
        }

        // --- 2. REGISTRO EN LA TABLA USUARIOS ---
        const { data, error } = await _supabase
            .from('usuarios')
            .insert([{ 
                id: id, 
                nombre: nombre, 
                correo: correo, 
                foto_url: fotoUrlFinal, // URL de la imagen en el Storage
                pass: pass 
            }])
            .select();

        if (error) {
            if (error.code === '23505') {
                alert("⚠️ Ese ID ya existe. Intenta con otro nombre de usuario.");
            } else {
                alert("Error: " + error.message);
            }
        } else {
            alert("¡Registrado con éxito! Tu foto se ha guardado en la nube.");
            window.location.href = "login.html"; 
        }
    });
}