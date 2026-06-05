document.addEventListener('DOMContentLoaded', function () {
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.setAttribute('min', new Date().toISOString().split('T')[0]);
    }

    const alertas = document.querySelectorAll('.alerta');
    alertas.forEach(function (alerta) {
        setTimeout(function () {
            alerta.style.transition = 'opacity 0.5s';
            alerta.style.opacity = '0';
            setTimeout(function () {
                alerta.remove();
            }, 500);
        }, 5000);
    });
});
