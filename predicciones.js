const { createClient } = supabase;
const supabaseUrl = 'https://nllmhovvzabuefafkgts.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sbG1ob3Z2emFidWVmYWZrZ3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDQwOTgsImV4cCI6MjA5MDA4MDA5OH0.G6KXr1RkzHgFRn7uHC14t5IdazTT3aKaJIbaWiwKU9c';
const _supabase = createClient(supabaseUrl, supabaseKey);

const usuarioId = localStorage.getItem('usuarioID');

document.addEventListener('DOMContentLoaded', () => {
    if (!usuarioId) {
        window.location.href = 'login.html';
        return;
    }
    // Cargamos la Jornada 1 por defecto al iniciar
    cargarPartidos(1);
});

// Función que llaman los botones de las pestañas en el HTML
async function cambiarJornada(numeroJornada, btnPresionado) {
    // 1. Cambiar estado visual de los botones
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    btnPresionado.classList.add('active');

    // 2. Cargar los partidos de esa jornada
    await cargarPartidos(numeroJornada);
}

async function cargarPartidos(numJornada) {
    const contenedor = document.getElementById('contenedor_partidos');
    contenedor.innerHTML = '<p style="text-align:center;">Cargando partidos de la Jornada ' + numJornada + '...</p>';

    try {
        // 1. Traer partidos de la jornada específica
        const { data: partidos, error: errorPartidos } = await _supabase
            .from('partidos')
            .select('*')
            .eq('jornada', numJornada)
            .order('id', { ascending: true });

        // 2. Traer predicciones que el usuario YA HIZO para no dejarlo repetir
        const { data: misVotos, error: errorVotos } = await _supabase
            .from('predicciones')
            .select('id_partido')
            .eq('id_usuario', usuarioId);

        if (errorPartidos || errorVotos) throw errorPartidos || errorVotos;

        contenedor.innerHTML = ''; // Limpiamos el mensaje de carga

        // Creamos una lista de IDs donde el usuario ya votó
        const idsVotados = misVotos.map(v => v.id_partido);

        partidos.forEach(partido => {
            const yaVoto = idsVotados.includes(partido.id);
            
            const card = document.createElement('div');
            card.className = `history-card ${yaVoto ? 'voto-realizado' : ''}`;
            card.style.flexDirection = "column"; // Para acomodar banderas arriba y botones abajo

            card.innerHTML = `
                <div style="display: flex; justify-content: space-around; align-items: center; width: 100%; margin-bottom: 15px;">
                    <div style="text-align: center; flex: 1;">
                        <img src="${partido.bandera_l}" style="width: 50px; border-radius: 4px;">
                        <p style="margin: 5px 0; font-weight: bold;">${partido.local}</p>
                    </div>
                    <div style="font-weight: bold; color: #00e676;">VS</div>
                    <div style="text-align: center; flex: 1;">
                        <img src="${partido.bandera_v}" style="width: 50px; border-radius: 4px;">
                        <p style="margin: 5px 0; font-weight: bold;">${partido.visitante}</p>
                    </div>
                </div>
                
                ${yaVoto 
                    ? `<div class="voto-confirmado">✅ Predicción Guardada</div>` 
                    : `<div class="botones-voto" style="display: flex; gap: 10px; width: 100%;">
                        <button onclick="votar(${partido.id}, '${partido.local}')">Local</button>
                        <button onclick="votar(${partido.id}, 'Empate')" style="background: #444; color: white;">Empate</button>
                        <button onclick="votar(${partido.id}, '${partido.visitante}')">Visita</button>
                       </div>`
                }
            `;
            contenedor.appendChild(card);
        });

    } catch (err) {
        console.error("Error cargando partidos:", err);
        contenedor.innerHTML = '<p>Error al cargar los datos.</p>';
    }
}

async function votar(idPartido, eleccion) {
    const confirmar = confirm(`¿Confirmas tu voto por ${eleccion}?`);
    if (!confirmar) return;

    const { error } = await _supabase
        .from('predicciones')
        .insert([
            { 
                id_usuario: usuarioId, 
                id_partido: idPartido, 
                voto: eleccion,
                puntos_ganados: 0 // Inicia en 0 hasta que el admin califique
            }
        ]);

    if (error) {
        alert("Error al guardar el voto: " + error.message);
    } else {
        alert("¡Voto registrado con éxito!");
        // Recargamos la jornada actual para que se bloquee el partido votado
        const jornadaActiva = document.querySelector('.tab-btn.active').innerText.replace('Jornada ', '');
        cargarPartidos(parseInt(jornadaActiva));
    }
}
async function asignarPuntosYNotificar(idUsuario, puntosRecibidos) {
    // 1. (Tu lógica actual para subir los puntos a la tabla predicciones)
    // ...

    // 2. Insertar la notificación para ese usuario
    await _supabase
        .from('notificaciones')
        .insert([
            { 
                id_usuario: idUsuario, 
                mensaje: `✅ Se te han asignado +${puntosRecibidos} puntos. ¡Revisa el ranking!` 
            }
        ]);
    
    console.log("Usuario notificado");
}