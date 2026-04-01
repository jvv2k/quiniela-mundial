const { createClient } = supabase;
const supabaseUrl = 'https://nllmhovvzabuefafkgts.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sbG1ob3Z2emFidWVmYWZrZ3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDQwOTgsImV4cCI6MjA5MDA4MDA5OH0.G6KXr1RkzHgFRn7uHC14t5IdazTT3aKaJIbaWiwKU9c';

const _supabase = createClient(supabaseUrl, supabaseKey);
const usuarioId = localStorage.getItem('usuarioID');

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Perfil JS cargado correctamente"); // Verás esto en la consola

    if (!usuarioId) {
        window.location.href = 'login.html';
        return;
    }

    await cargarDatosPerfil();
    await cargarHistorial();
});

async function cargarDatosPerfil() {
    const { data: usuario, error } = await _supabase
        .from('usuarios')
        .select('nombre, foto_url')
        .eq('id', usuarioId)
        .single();

    if (error) {
        console.error("Error perfil:", error);
        return;
    }

    // Usando los IDs exactos de tu HTML
    document.getElementById('user_name').innerText = `Perfil de ${usuario.nombre}`;
    const img = document.getElementById('profile_img');
    if (img) img.src = usuario.foto_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
}

async function cargarHistorial() {
    const contenedor = document.getElementById('lista_historial'); // ID corregido
    const puntosDisplay = document.getElementById('total_puntos'); // ID corregido

    if (!contenedor) return;

    const { data: predicciones, error } = await _supabase
        .from('predicciones')
        .select(`
            voto,
            puntos_ganados,
            partidos ( local, visitante )
        `)
        .eq('id_usuario', usuarioId);

    if (error) {
        console.error("Error historial:", error);
        contenedor.innerHTML = "<p>Error al cargar datos.</p>";
        return;
    }

    if (!predicciones || predicciones.length === 0) {
        contenedor.innerHTML = "<p>No tienes predicciones aún.</p>";
        return;
    }

    contenedor.innerHTML = '';
    let sumaPuntos = 0;

    predicciones.forEach(p => {
        const partido = p.partidos;
        if (!partido) return;

        const pts = p.puntos_ganados || 0;
        sumaPuntos += pts;

        // Definir color verde/rojo/gris
        let claseColor = 'voto-pendiente'; 
        if (p.puntos_ganados > 0) {
            claseColor = 'voto-acertado'; // Verde
        } else if (p.puntos_ganados === 0) {
            claseColor = 'voto-fallado'; // Rojo
        }

        const card = document.createElement('div');
        card.className = `history-card ${claseColor}`;
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                <span>
                    <strong>${partido.local} vs ${partido.visitante}</strong>
                    <br><small>Tu voto: ${p.voto}</small>
                </span>
                <span class="puntos-badge">+${pts} pts</span>
            </div>
        `;
        contenedor.appendChild(card);
    });

    if (puntosDisplay) puntosDisplay.innerText = sumaPuntos;
}