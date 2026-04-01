const { createClient } = supabase;
const supabaseUrl = 'https://nllmhovvzabuefafkgts.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sbG1ob3Z2emFidWVmYWZrZ3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDQwOTgsImV4cCI6MjA5MDA4MDA5OH0.G6KXr1RkzHgFRn7uHC14t5IdazTT3aKaJIbaWiwKU9c';
const _supabase = createClient(supabaseUrl, supabaseKey);

const idAdminAutorizado = "Jvv2k";
const usuarioId = localStorage.getItem('usuarioID');

document.addEventListener('DOMContentLoaded', () => {
    if (usuarioId !== idAdminAutorizado) {
        alert("Acceso denegado.");
        window.location.href = 'quiniela.html';
        return;
    }
    cargarPartidosAdmin(1);
});

async function cargarPartidosAdmin(jornada) {
    const contenedor = document.getElementById('lista_partidos_admin');
    contenedor.innerHTML = '<p style="text-align:center;">Cargando partidos...</p>';

    const { data: partidos, error } = await _supabase
        .from('partidos')
        .select('*')
        .eq('jornada', jornada)
        .order('id', { ascending: true });

    if (error) return;

    contenedor.innerHTML = '';
    partidos.forEach(partido => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.style.flexDirection = 'column';
        card.style.padding = '20px';
        
        card.innerHTML = `
            <div style="display:flex; justify-content: space-between; width:100%; align-items:center; margin-bottom: 10px;">
                <span style="font-size: 1.1rem;"><strong>${partido.local}</strong> vs <strong>${partido.visitante}</strong></span>
                <span style="background: #333; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; color: #888;">ID: ${partido.id}</span>
            </div>
            <div style="display:flex; gap:10px; width:100%;">
                <button onclick="definirResultado(${partido.id}, '${partido.local}')" class="btn-admin-action">Ganó ${partido.local}</button>
                <button onclick="definirResultado(${partido.id}, 'Empate')" class="btn-admin-action" style="background:#444;">Empate</button>
                <button onclick="definirResultado(${partido.id}, '${partido.visitante}')" class="btn-admin-action">Ganó ${partido.visitante}</button>
            </div>
        `;
        contenedor.appendChild(card);
    });
}

// --- FUNCIÓN PRINCIPAL DE PUNTOS Y NOTIFICACIONES ---
async function definirResultado(idPartido, resultadoReal) {
    const confirmacion = confirm(`¿Confirmas resultado: ${resultadoReal}?`);
    if (!confirmacion) return;

    try {
        // 0. Tomar "foto" del ranking antes de actualizar
        const rankingAnterior = await obtenerRankingCalculado();

        // 1. Buscamos a los que acertaron (traemos id_usuario para notificar)
        const { data: acertados, error: errorBusqueda } = await _supabase
            .from('predicciones')
            .select('llave, id_usuario') 
            .eq('id_partido', idPartido)
            .eq('voto', resultadoReal);

        if (errorBusqueda) throw errorBusqueda;

        if (acertados && acertados.length > 0) {
            const llavesParaPuntos = acertados.map(p => p.llave);
            
            // 2. Repartir puntos
            const { error: errorUpdate } = await _supabase
                .from('predicciones')
                .update({ puntos_ganados: 3 }) 
                .in('llave', llavesParaPuntos);

            if (errorUpdate) throw errorUpdate;

            // 3. Notificar a cada ganador individualmente
            for (const ganador of acertados) {
                await _supabase.from('notificaciones').insert([
                    { 
                        id_usuario: ganador.id_usuario, 
                        mensaje: `✅ ¡Felicidades! Ganaste +3 puntos en el partido ID: ${idPartido}.`,
                        leido: false
                    }
                ]);
            }

            // 4. Procesar cambios de posición (Subidas/Bajadas)
            const rankingNuevo = await obtenerRankingCalculado();
            await compararYNotificarRanking(rankingAnterior, rankingNuevo);

            alert(`✅ Éxito: Puntos repartidos y usuarios notificados.`);
        } else {
            alert("Nadie acertó.");
        }
        
    } catch (err) {
        console.error(err);
        alert("Error: " + err.message);
    }
}

// --- LÓGICA DE RANKING ---

async function obtenerRankingCalculado() {
    const { data: usuarios, error } = await _supabase
        .from('usuarios')
        .select(`id, nombre, predicciones ( puntos_ganados )`);

    if (error) return [];

    let ranking = usuarios.map(u => {
        const total = u.predicciones.reduce((acc, p) => acc + (p.puntos_ganados || 0), 0);
        return { id: u.id, nombre: u.nombre, puntos: total };
    });

    return ranking.sort((a, b) => b.puntos - a.puntos);
}

async function compararYNotificarRanking(anterior, nuevo) {
    nuevo.forEach(async (usuario, nuevoIndice) => {
        const puestoNuevo = nuevoIndice + 1;
        const indexAnterior = anterior.findIndex(u => u.id === usuario.id);
        
        if (indexAnterior === -1) return; // Usuario nuevo
        
        const puestoAnterior = indexAnterior + 1;
        let mensaje = "";

        if (puestoNuevo < puestoAnterior) {
            mensaje = `🚀 ¡Subiste en el ranking! Ahora estás en el puesto #${puestoNuevo}.`;
        } else if (puestoNuevo > puestoAnterior) {
            mensaje = `⚠️ Has bajado al puesto #${puestoNuevo}. ¡No te dejes ganar!`;
        }

        if (mensaje !== "") {
            await _supabase.from('notificaciones').insert([
                { id_usuario: usuario.id, mensaje: mensaje, leido: false }
            ]);
        }
    });
}