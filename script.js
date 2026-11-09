
// =============================================
// AUTO SNACK
// MAQUINA DE MOORE
// Teoria de la Computacion
// =============================================

// 1. ALFABETO DE ENTRADA Y PRODUCTOS

const productos = {
    p1: { nombre: "Coca-Cola", precio: 3 },
    p2: { nombre: "Agua", precio: 6 },
    p3: { nombre: "Chocolate", precio: 9 },
    p4: { nombre: "Galletas", precio: 12 },
    p5: { nombre: "Papas", precio: 15 },
    p6: { nombre: "Jugo", precio: 18 },
    p7: { nombre: "Dulces", precio: 21 },
    p8: { nombre: "Gansito", precio: 24 },
    p9: { nombre: "Palomitas", precio: 27 },
    p10: { nombre: "Pingüinos Marinela", precio: 30 }
};

const monedas = ["1", "2", "5", "10"];

const Sigma = [
    ...Object.keys(productos),
    ...monedas
];

// 2. CONJUNTO DE ESTADOS Q Y ESTADOS FINALES

const Q = new Set(["q0", "qX"]);
const F = new Set();

// Estados de saldo insuficiente y estados de compra aceptada
for (const codigo in productos) {
    const precio = productos[codigo].precio;

    // Estados con saldo menor al precio
    for (let saldo = 0; saldo < precio; saldo++) {
        Q.add(`q_${codigo}_${saldo}`);
    }

    // Estados de compra aceptada, con cambio de 0 a 9 pesos
    for (let cambio = 0; cambio <= 9; cambio++) {
        const estadoAceptado = `qE_${codigo}_${cambio}`;

        Q.add(estadoAceptado);
        F.add(estadoAceptado);
    }
}

// 3. ESTADO INICIAL Y VARIABLES

const q0 = "q0";

let estadoActual = q0;
let productoActual = null;
let dineroIngresado = 0;
let productoEntregado = false;

// 4. FUNCION DE TRANSICION DELTA

function delta(estado, simbolo) {

    // El estado de error permanece en error
    if (estado === "qX") {
        return "qX";
    }

    // No se permiten simbolos fuera del alfabeto
    if (!Sigma.includes(simbolo)) {
        return "qX";
    }

    // Desde el estado inicial solo se puede seleccionar producto
    if (estado === q0) {
        if (productos[simbolo]) {
            return `q_${simbolo}_0`;
        }

        return "qX";
    }

    // No se permiten entradas despues de aceptar la compra
    if (estado.startsWith("qE_")) {
        return "qX";
    }

    // Identificar producto y saldo del estado actual
    const coincidencia = estado.match(/^q_(p\d+)_(\d+)$/);

    if (!coincidencia) {
        return "qX";
    }

    const codigo = coincidencia[1];
    const saldo = Number(coincidencia[2]);

    // No se puede seleccionar otro producto
    if (productos[simbolo]) {
        return "qX";
    }

    // Solo se aceptan las monedas permitidas
    if (monedas.includes(simbolo)) {

        const nuevoSaldo = saldo + Number(simbolo);
        const precio = productos[codigo].precio;

        // Si alcanza el precio, la compra es aceptada
        if (nuevoSaldo >= precio) {
            const cambio = nuevoSaldo - precio;
            return `qE_${codigo}_${cambio}`;
        }

        // Si no alcanza, permanece en estado de pago
        return `q_${codigo}_${nuevoSaldo}`;
    }

    return "qX";
}

// 5. FUNCION DE SALIDA LAMBDA (MOORE)

function lambda(estado) {

    if (estado === "q0") {
        return "Esperando seleccion de producto.";
    }

    if (estado === "qX") {
        return "Operacion invalida. Se incumplieron las reglas.";
    }

    // Salida de los estados de compra aceptada
    const aceptado = estado.match(/^qE_(p\d+)_(\d+)$/);

    if (aceptado) {
        const codigo = aceptado[1];
        const cambio = Number(aceptado[2]);

        return `Pago aceptado. ${productos[codigo].nombre}. ` +
            `Cambio: $${cambio}. Confirma para entregar.`;
    }

    // Salida de los estados de saldo insuficiente
    const pago = estado.match(/^q_(p\d+)_(\d+)$/);

    if (pago) {
        const codigo = pago[1];
        const saldo = Number(pago[2]);
        const precio = productos[codigo].precio;

        return `Producto seleccionado. Dinero: $${saldo}. ` +
            `Faltan $${precio - saldo}.`;
    }

    return "Estado desconocido.";
}

// 6. PROCESAR UNA ENTRADA EN LA MAQUINA

function procesarEntrada(simbolo) {

    const estadoAnterior = estadoActual;

    estadoActual = delta(estadoActual, String(simbolo));

    // Guardar el producto cuando se selecciona desde q0
    if (estadoAnterior === q0 && productos[simbolo]) {
        productoActual = productos[simbolo];
    }

    // Actualizar el saldo segun el nuevo estado
    const pago = estadoActual.match(/^q_(p\d+)_(\d+)$/);
    const aceptado = estadoActual.match(/^qE_(p\d+)_(\d+)$/);

    if (pago) {
        dineroIngresado = Number(pago[2]);
    } else if (aceptado) {
        const codigo = aceptado[1];
        const cambio = Number(aceptado[2]);

        dineroIngresado = productos[codigo].precio + cambio;
    }

    console.log("Entrada:", simbolo);
    console.log("Estado anterior:", estadoAnterior);
    console.log("Estado actual:", estadoActual);
    console.log("Salida Moore:", lambda(estadoActual));

    actualizarInterfaz();
}

// 7. ACTUALIZAR LA INTERFAZ

function actualizarInterfaz() {

    const elementoEstado = document.getElementById("estadoSistema");
    const elementoMensaje = document.getElementById("mensajeSistema");
    const elementoProducto = document.getElementById("productoSeleccionado");
    const elementoPrecio = document.getElementById("precioProducto");

    if (elementoEstado) {
        elementoEstado.textContent = estadoActual;
    }

    if (elementoMensaje) {
        elementoMensaje.textContent = lambda(estadoActual);
    }

    if (elementoProducto) {
        elementoProducto.value = productoActual
            ? productoActual.nombre
            : "";
    }

    if (elementoPrecio) {
        elementoPrecio.textContent = productoActual
            ? "$" + productoActual.precio.toFixed(2)
            : "$0.00";
    }

    actualizarDinero();
}

// 8. SELECCIONAR PRODUCTO

function seleccionarProducto(codigo) {

    if (productoEntregado) {
        alert("Cancela la operacion anterior para comenzar otra.");
        return;
    }

    procesarEntrada(codigo);

    if (estadoActual === "qX") {
        alert("Seleccion invalida. Revisa el estado de la maquina.");
    }
}

// 9. INSERTAR MONEDAS

function insertarMoneda(moneda) {

    if (productoEntregado) {
        alert("La compra ya fue entregada. Cancela para comenzar otra.");
        return;
    }

    procesarEntrada(String(moneda));

    if (estadoActual === "qX") {
        alert("No puedes introducir esa moneda en este estado.");
    }
}

// 10. ACTUALIZAR DINERO EN PANTALLA

function actualizarDinero() {

    const elementoDinero = document.getElementById("dineroIngresado");

    if (elementoDinero) {
        elementoDinero.textContent =
            "$" + dineroIngresado.toFixed(2);
    }
}

// 11. CONFIRMAR Y ENTREGAR PRODUCTO

function confirmarCompra() {

    if (!F.has(estadoActual)) {
        alert("Todavia no has ingresado suficiente dinero.");
        return;
    }

    if (productoEntregado) {
        alert("El producto ya fue entregado.");
        return;
    }

    const aceptado = estadoActual.match(/^qE_(p\d+)_(\d+)$/);

    if (!aceptado) {
        return;
    }

    const codigo = aceptado[1];
    const cambio = Number(aceptado[2]);

    productoEntregado = true;

    document.getElementById("estadoSistema").textContent =
        estadoActual;

    document.getElementById("mensajeSistema").textContent =
        "Compra realizada. ¡Gracias por tu compra!";

    document.querySelector(".delivery-area").innerHTML = `
        <i class="bi bi-check-circle-fill fs-1 text-success"></i>
        <h5 class="mt-2">¡Producto entregado!</h5>
        <p>${productos[codigo].nombre}</p>
        <p>Cambio: $${cambio.toFixed(2)}</p>
    `;

    console.log("Salida final:", lambda(estadoActual));
    console.log("Producto entregado:", productos[codigo].nombre);
    console.log("Cambio devuelto:", cambio);
}

// 12. CANCELAR Y REINICIAR LA MAQUINA

function cancelarOperacion() {

    estadoActual = q0;
    productoActual = null;
    dineroIngresado = 0;
    productoEntregado = false;

    const entrega = document.querySelector(".delivery-area");

    if (entrega) {
        entrega.innerHTML = `
            <i class="bi bi-box-seam fs-1"></i>
            <h5 class="mt-2">Área de entrega</h5>
            <p>Tu producto aparecerá aquí.</p>
        `;
    }

    actualizarInterfaz();

    console.log("Maquina reiniciada. Estado:", estadoActual);
}

// 13. INFORMACION DE LA MAQUINA

console.log("================================");
console.log("AUTO SNACK - MAQUINA DE MOORE");
console.log("Alfabeto Sigma:", Sigma);
console.log("Cantidad de estados Q:", Q.size);
console.log("Cantidad de estados de aceptacion F:", F.size);
console.log("Estado inicial:", q0);
console.log("================================");

actualizarInterfaz();
