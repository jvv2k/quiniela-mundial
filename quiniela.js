const { createClient } = supabase;
const supabaseUrl = 'https://nllmhovvzabuefafkgts.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sbG1ob3Z2emFidWVmYWZrZ3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDQwOTgsImV4cCI6MjA5MDA4MDA5OH0.G6KXr1RkzHgFRn7uHC14t5IdazTT3aKaJIbaWiwKU9c';
const _supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    // 1. GESTIÓN DE SESIÓN Y PERFIL
    const nombreUsuario = localStorage.getItem('usuarioNombre');
    const usuarioId = localStorage.getItem('usuarioID');
    
    // --- NUEVO ID DE ADMIN (UUID OFICIAL) ---
    const idAdminAutorizado = "1f9570ae-38de-4e31-8ecd-9a372a4b20f8"; 
    
    if (!nombreUsuario || !usuarioId) {
        window.location.href = "login.html";
        return;
    }

    const welcomeText = document.getElementById('welcome_user');
    const navImg = document.getElementById('nav_profile_img');

    if (welcomeText) welcomeText.innerText = `Hola, ${nombreUsuario}`;

    // Cargar foto de perfil desde la DB
    const { data: userDB, error } = await _supabase
        .from('usuarios')
        .select('nombre, foto_url')
        .eq('id', usuarioId)
        .single();

    if (!error && userDB && navImg) {
        navImg.src = userDB.foto_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    }

    // --- LÓGICA PARA MOSTRAR EL BOTÓN DE ADMIN ---
    if (usuarioId === idAdminAutorizado) {
        const container = document.querySelector('.main-container');
        if (container) {
            const btnAdmin = document.createElement('button');
            btnAdmin.innerHTML = "⚙️ Panel de Control Admin";
            btnAdmin.className = "btn-admin-special"; 
            btnAdmin.style.marginBottom = "15px"; 
            btnAdmin.style.cursor = "pointer"; // Para que se note que es clicable
            btnAdmin.onclick = () => window.location.href = 'admin.html';
            
            // Insertamos el botón al inicio del contenedor principal
            container.insertBefore(btnAdmin, container.firstChild);
        }
    }

    // 2. LÓGICA DE NOTIFICACIONES (LA CAMPANITA)
    const btnNoti = document.getElementById('btn_notificaciones');
    const panelNoti = document.getElementById('noti_panel');

    if (btnNoti && panelNoti) {
        btnNoti.onclick = (e) => {
            e.stopPropagation();
            panelNoti.style.display = panelNoti.style.display === 'none' ? 'block' : 'none';
            if (panelNoti.style.display === 'block') marcarComoLeidas(usuarioId);
        };

        document.addEventListener('click', () => {
            panelNoti.style.display = 'none';
        });
        
        cargarNotificaciones(usuarioId);
        
        // REALTIME PARA NOTIFICACIONES
        _supabase
            .channel('notificaciones-live')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'notificaciones',
                filter: `id_usuario=eq.${usuarioId}` 
            }, (payload) => {
                cargarNotificaciones(usuarioId); 
            })
            .subscribe();
    }

    // Cerrar sesión
    const btnLogout = document.getElementById('btnCerrarSesion');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
                localStorage.clear();
                window.location.href = "login.html";
            }
        });
    }
});

// --- FUNCIONES DE APOYO ---

async function cargarNotificaciones(idUsuario) {
    const { data: notis, error } = await _supabase
        .from('notificaciones')
        .select('*')
        .eq('id_usuario', idUsuario)
        .order('created_at', { ascending: false });

    if (error) return;

    const badge = document.getElementById('noti_badge');
    const lista = document.getElementById('lista_notificaciones');

    if (!badge || !lista) return;

    const noLeidas = notis.filter(n => !n.leido).length;

    if (noLeidas > 0) {
        badge.innerText = noLeidas;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }

    if (notis.length > 0) {
        lista.innerHTML = notis.map(n => `
            <div style="padding: 10px; border-bottom: 1px solid #252525; font-size: 0.8rem; background: ${n.leido ? 'transparent' : 'rgba(0,230,118,0.05)'}; border-radius: 6px; margin-bottom: 5px;">
                <p style="margin: 0; color: ${n.leido ? '#bbb' : '#fff'};">${n.mensaje}</p>
                <small style="color: #555; font-size: 0.7rem;">${new Date(n.created_at).toLocaleDateString()}</small>
            </div>
        `).join('');
    } else {
        lista.innerHTML = '<p style="font-size: 0.8rem; color: #666; text-align: center;">No tienes notificaciones.</p>';
    }
}

async function marcarComoLeidas(idUsuario) {
    await _supabase
        .from('notificaciones')
        .update({ leido: true })
        .eq('id_usuario', idUsuario)
        .eq('leido', false);
    
    setTimeout(() => {
        const badge = document.getElementById('noti_badge');
        if (badge) badge.style.display = 'none';
    }, 2000);
}