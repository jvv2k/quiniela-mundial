const { createClient } = supabase;
const supabaseUrl = 'https://nllmhovvzabuefafkgts.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sbG1ob3Z2emFidWVmYWZrZ3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDQwOTgsImV4cCI6MjA5MDA4MDA5OH0.G6KXr1RkzHgFRn7uHC14t5IdazTT3aKaJIbaWiwKU9c';

const _supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    cargarRanking();
    
    // Escuchar el buscador
    document.getElementById('search_input').addEventListener('input', (e) => {
        buscarAmigos(e.target.value);
    });
});

async function cargarRanking() {
    const { data: usuarios, error } = await _supabase
        .from('usuarios')
        .select(`
            id,
            nombre,
            foto_url,
            predicciones ( puntos_ganados )
        `);

    if (error) {
        console.error("Error cargando ranking:", error);
        return;
    }

    let ranking = usuarios.map(u => {
        const total = u.predicciones ? u.predicciones.reduce((acc, p) => acc + (p.puntos_ganados || 0), 0) : 0;
        return { 
            id: u.id, 
            nombre: u.nombre, 
            puntos: total, 
            foto: u.foto_url 
        };
    });

    ranking.sort((a, b) => b.puntos - a.puntos);

    const contenedorTop = document.getElementById('top_tres');
    contenedorTop.innerHTML = '';

    const clases = ['rank-2', 'rank-1', 'rank-3'];
    const ordenPodio = [ranking[1], ranking[0], ranking[2]];

    ordenPodio.forEach((user, index) => {
        if (!user) return;
        
        const div = document.createElement('div');
        div.className = `podium-item ${clases[index]}`;
        const fotoFinal = user.foto || 'https://via.placeholder.com/100?text=👤';
        const posicion = index === 1 ? '1' : (index === 0 ? '2' : '3');

        div.innerHTML = `
            <div class="circle" onclick="verPrediccionesAmigo('${user.id}', '${user.nombre}')" 
                 style="cursor:pointer; position: relative; border: 4px solid #fbc02d;">
                <img src="${fotoFinal}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                <div style="position: absolute; bottom: 0; background: rgba(0,0,0,0.6); width: 100%; text-align: center; color: white; font-size: 0.8rem; font-weight: bold;">
                    #${posicion}
                </div>
            </div>
            <span class="podium-name" style="margin-top: 8px;">${user.nombre.split(' ')[0]}</span>
            <span class="podium-points">${user.puntos} pts</span>
        `;
        contenedorTop.appendChild(div);
    });
}

async function buscarAmigos(termino) {
    const contenedor = document.getElementById('resultados_busqueda');
    
    if (termino.length < 2) {
        contenedor.innerHTML = '';
        return;
    }

    const { data: amigos, error } = await _supabase
        .from('usuarios')
        .select('nombre, id, foto_url')
        .ilike('nombre', `%${termino}%`);

    if (error || !amigos || amigos.length === 0) {
        contenedor.innerHTML = '<p style="font-size:0.8rem; color:#666;">No se encontraron amigos.</p>';
        return;
    }

    contenedor.innerHTML = amigos.map(a => {
        const foto = a.foto_url || 'https://via.placeholder.com/40?text=👤';
        return `
            <div class="history-card" onclick="verPrediccionesAmigo('${a.id}', '${a.nombre}')" 
                 style="cursor:pointer; border-left: 5px solid #00e676; margin-bottom:10px; display: flex; align-items: center; gap: 15px; background: #fff; padding: 10px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <img src="${foto}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                <div class="history-info">
                    <strong>${a.nombre}</strong>
                    <br><span style="color:#888; font-size:0.7rem">Haz clic para ver sus aciertos</span>
                </div>
            </div>
        `;
    }).join('');
}

async function verPrediccionesAmigo(idAmigo, nombreAmigo) {
    const contenedor = document.getElementById('resultados_busqueda');
    contenedor.innerHTML = `<p style="text-align:center; color: #00e676;">Consultando historial de ${nombreAmigo}...</p>`;

    // Traemos el voto y los puntos de 'predicciones'
    // Y los nombres/banderas de 'partidos'
    const { data: votos, error } = await _supabase
        .from('predicciones')
        .select(`
            voto,
            puntos_ganados,
            partidos ( 
                local, 
                visitante, 
                bandera_l,
                bandera_v
            )
        `)
        .eq('id_usuario', idAmigo);

    if (error) {
        console.error("Error:", error);
        contenedor.innerHTML = `<p style="color:red;">Error al cargar datos.</p>`;
        return;
    }

    if (!votos || votos.length === 0) {
        contenedor.innerHTML = `<p>${nombreAmigo} no tiene votos aún.</p>`;
        return;
    }

    let html = `<h4 style="margin: 15px 0; color: #00e676;">Predicciones de ${nombreAmigo}</h4>`;

    votos.forEach(v => {
        const p = v.partidos;
        if (!p) return;

        // LÓGICA BASADA EN TU IMAGEN:
        // Si puntos_ganados es 3 (o mayor a 0), es acierto.
        // Si es 0, es fallo.
        const esAcierto = v.puntos_ganados > 0;
        
        const claseColor = esAcierto ? 'res-correct' : 'res-incorrect';
        const icono = esAcierto ? '✅' : '❌';
        const bg = esAcierto ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 82, 82, 0.1)';
        const borde = esAcierto ? '5px solid #00e676' : '5px solid #ff5252';

        html += `
            <div style="background: ${bg}; border-left: ${borde}; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${p.bandera_l}" width="20">
                        <span>${p.local} vs ${p.visitante}</span>
                        <img src="${p.bandera_v}" width="20">
                    </div>
                    <span>${icono}</span>
                </div>
                <div style="margin-top: 8px; font-size: 0.8rem; color: #bbb; display: flex; justify-content: space-between;">
                    <span>Votó por: <b>${v.voto}</b></span>
                    <span>Puntos: <b style="color:${esAcierto ? '#00e676' : '#ff5252'};">${v.puntos_ganados} pts</b></span>
                </div>
            </div>
        `;
    });

    html += `<button onclick="location.reload()" class="btn-secondary" style="width:100%; margin-top:10px;">Volver</button>`;
    contenedor.innerHTML = html;
}