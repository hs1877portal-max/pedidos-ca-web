import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from '../App';
import './FacturaDetalle.css';

const FacturaDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [factura, setFactura] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [abonos, setAbonos] = useState([]);
  const [nuevoAbono, setNuevoAbono] = useState({
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    metodo: 'Efectivo',
    nota: ''
  });
  const [editandoAbono, setEditandoAbono] = useState(null);
  const [mostrarFormAbono, setMostrarFormAbono] = useState(false);

  // Función para convertir números a letras
  const convertirNumeroALetras = (numero) => {
    const unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    if (numero === 0) return 'CERO PESOS';
    if (numero > 999999999) return 'NÚMERO DEMASIADO GRANDE';

    let letras = '';

    // Convertir millones
    if (numero >= 1000000) {
      const millones = Math.floor(numero / 1000000);
      if (millones === 1) {
        letras += 'UN MILLÓN ';
      } else {
        letras += convertirGrupo(millones) + ' MILLONES ';
      }
      numero %= 1000000;
    }

    // Convertir miles
    if (numero >= 1000) {
      const miles = Math.floor(numero / 1000);
      if (miles === 1) {
        letras += 'MIL ';
      } else {
        letras += convertirGrupo(miles) + ' MIL ';
      }
      numero %= 1000;
    }

    // Convertir centenas, decenas y unidades
    if (numero > 0) {
      letras += convertirGrupo(numero);
    }

    return letras.trim() + ' PESOS';

    function convertirGrupo(n) {
      let grupo = '';
      const c = Math.floor(n / 100);
      const d = Math.floor((n % 100) / 10);
      const u = n % 10;

      // Centenas
      if (c > 0) {
        if (n === 100) {
          grupo += 'CIEN';
        } else {
          grupo += centenas[c] + ' ';
        }
      }

      // Decenas y unidades
      if (d > 0) {
        if (d === 1) {
          if (u === 0) {
            grupo += 'DIEZ';
          } else {
            grupo += especiales[u];
          }
          return grupo;
        } else if (d === 2 && u > 0) {
          grupo += 'VEINTI' + unidades[u].toLowerCase();
        } else {
          grupo += decenas[d];
          if (u > 0) {
            grupo += ' Y ' + unidades[u];
          }
        }
      } else if (u > 0) {
        grupo += unidades[u];
      }

      return grupo.trim();
    }
  };

  // Cargar factura y abonos desde Supabase
  useEffect(() => {
    const cargarFacturaYAbonos = async () => {
      try {
        setCargando(true);
        
        // Cargar factura
        const { data: facturaData, error: facturaError } = await supabase
          .from('facturas')
          .select('*')
          .eq('id', id)
          .single();
        
        if (facturaError) throw facturaError;
        setFactura(facturaData);
        
        // Cargar abonos
        const { data: abonosData, error: abonosError } = await supabase
          .from('abonos')
          .select('*')
          .eq('factura_id', id)
          .order('fecha', { ascending: false });
        
        if (abonosError) throw abonosError;
        setAbonos(abonosData || []);
        
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarFacturaYAbonos();
  }, [id]);

  const copiarDatos = () => {
    const datos = `
      Cuenta de Cobro #${factura.id}
      Cliente: ${factura.cliente}
      Fecha: ${new Date(factura.fecha).toLocaleDateString()}
      Total: $${factura.total.toFixed(2)}
      Total en letras: ${convertirNumeroALetras(Math.round(factura.total))}
      Saldo Pendiente: $${(factura.total - calcularTotalAbonado()).toFixed(2)}
      Productos: ${factura.productos.map(p => `\n  - ${p.nombre} (${p.cantidad} x $${p.precio.toFixed(2)})`).join('')}
      Abonos: ${abonos.length > 0 ? abonos.map(a => `\n  - $${a.monto.toFixed(2)} (${new Date(a.fecha).toLocaleDateString()})`).join('') : ' Ninguno'}
    `;
    navigator.clipboard.writeText(datos);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const imprimirFactura = () => {
    // Abrir ventana de impresión en formato ticket térmico (78mm)
    const ventanaImpresion = window.open('', '_blank', 'width=420,height=900');
    const fechaTicket = new Date(factura.fecha || Date.now());
    const fechaTexto = fechaTicket.toLocaleDateString('es-CO');
    const horaTexto = fechaTicket.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const nitCliente = factura.nit || factura.identificacion || '2222222222222';
    const direccionCliente = factura.direccion || 'NO ESPECIFICADO';
    const telefonoCliente = factura.telefono || 'NO ESPECIFICADO';
    const logoTicket = '/logo-ca.png';
    
    const contenidoImpresion = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cuenta de Cobro #${factura.id.toString().padStart(6, '0')}</title>
          <style>
            @page {
              size: 78mm auto;
              margin: 2mm;
            }
            body {
              font-family: "Arial", "Helvetica", sans-serif;
              margin: 0;
              padding: 2mm;
              font-size: 11px;
              line-height: 1.25;
              color: #000;
            }
            .ticket {
              width: 78mm;
              max-width: 78mm;
              margin: 0 auto;
            }
            .header {
              text-align: left;
              margin-bottom: 6px;
            }
            .empresa {
              font-size: 26px;
              font-weight: bold;
              letter-spacing: 0.2px;
              text-transform: uppercase;
            }
            .meta {
              font-size: 12px;
              margin-top: 2px;
            }
            .logo-ticket {
              width: 100%;
              text-align: center;
              margin: 6px 0 8px;
            }
            .logo-ticket img {
              max-width: 60mm;
              width: 100%;
              height: auto;
              object-fit: contain;
              display: inline-block;
            }
            .doc-title {
              font-size: 15px;
              font-weight: 800;
              margin: 8px 0 4px;
              text-transform: uppercase;
            }
            .separator {
              border-top: 1px dashed #000;
              margin: 6px 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
              gap: 8px;
              align-items: baseline;
            }
            .row div:first-child {
              font-weight: 700;
            }
            .row div:last-child {
              text-align: right;
            }
            .subtle {
              font-weight: 400 !important;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 6px;
            }
            th,
            td {
              font-size: 11px;
              padding: 2px 0;
              vertical-align: top;
            }
            th {
              font-size: 12px;
              font-weight: 800;
              text-transform: uppercase;
              border-bottom: 1px solid #000;
            }
            .col-art {
              width: 52%;
              text-align: left;
            }
            .col-und {
              width: 18%;
              text-align: right;
            }
            .col-valor {
              width: 30%;
              text-align: right;
            }
            .producto-nombre {
              text-transform: uppercase;
              font-weight: 700;
            }
            .resumen {
              margin-top: 8px;
            }
            .resumen .linea {
              display: flex;
              justify-content: space-between;
              margin: 1px 0;
            }
            .resumen .total {
              margin-top: 3px;
              padding-top: 3px;
              border-top: 1px dashed #000;
              font-size: 14px;
              font-weight: 900;
            }
            .bloque {
              margin-top: 8px;
            }
            .bloque .titulo {
              font-size: 13px;
              font-weight: 800;
              margin-bottom: 2px;
              text-transform: uppercase;
            }
            .nota {
              margin-top: 8px;
              font-size: 10px;
              text-transform: uppercase;
            }
            .centrado {
              text-align: center;
            }
            @media print {
              html,
              body {
                width: 78mm;
                max-width: 78mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <div class="empresa"></div>
              <div class="logo-ticket">
                <img src="${logoTicket}" alt="Logo Comercializadora Alexandra" onerror="this.style.display='none'" />
              </div>
              <div class="meta">NIT: 80.057.616-3</div>
              <div class="meta">REG: RESPONSABLE DE IVA</div>
              <div class="meta">Dir: CRA 18 # 12-47 LOC 613</div>
              <div class="meta">Tel: 3115793179</div>
              <div class="doc-title">SOPORTE REMISION .</div>
              <div class="meta">No: RM-${factura.id.toString().padStart(6, '0')}</div>
              <div class="meta">FECHA: ${fechaTexto} ${horaTexto}</div>
            </div>

            <div class="separator"></div>

            <table>
              <thead>
                <tr>
                  <th class="col-art">ARTICULO</th>
                  <th class="col-und">UND.</th>
                  <th class="col-valor">VALOR</th>
                </tr>
              </thead>
              <tbody>
                ${factura.productos.map(producto => `
                  <tr>
                    <td class="col-art">
                      <div class="producto-nombre">${producto.nombre}</div>
                      <div class="subtle">${formatearMonedaImpresion(producto.precio)} x ${producto.cantidad}</div>
                    </td>
                    <td class="col-und">${producto.cantidad}</td>
                    <td class="col-valor">${formatearMonedaImpresion(producto.cantidad * producto.precio)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="separator"></div>

            <div class="bloque">
              <div class="titulo">Detalle del IVA</div>
              <div class="resumen">
                <div class="linea"><span>PARCIAL:</span><span>${formatearMonedaImpresion(factura.total)}</span></div>
                <div class="linea"><span>IVA:</span><span>$ 0</span></div>
                <div class="linea"><span>INC-BOLSAS:</span><span>$ 0</span></div>
                <div class="linea total"><span>TOTAL VENTA</span><span>${formatearMonedaImpresion(factura.total)}</span></div>
              </div>
            </div>

            <div class="separator"></div>

            <div class="bloque">
              <div class="row"><div>CAJA NUMERO:</div><div class="subtle">01</div></div>
              <div class="row"><div>VEND:</div><div class="subtle">${(factura.vendedor || 'VENDEDOR UNO').toUpperCase()}</div></div>
            </div>

            <div class="bloque">
              <div class="titulo">CLIENTE:</div>
              <div class="row"><div>Nit:</div><div class="subtle">${nitCliente}</div></div>
              <div class="row"><div>Nom:</div><div class="subtle">${(factura.cliente || 'CONSUMIDOR FINAL').toUpperCase()}</div></div>
              <div class="row"><div>Dir:</div><div class="subtle">${direccionCliente.toUpperCase()}</div></div>
              <div class="row"><div>Tel:</div><div class="subtle">${telefonoCliente}</div></div>
            </div>

            <div class="separator"></div>

            <div class="nota centrado">*** ESTA NO ES FRA. ELECT. ES UN SOPORTE DE REMISION</div>
            <div class="nota centrado">*** INFORMADO</div>
            <div class="nota centrado">*** BY: SOFTWARE M.A.R</div>
          </div>
        </body>
      </html>
    `;
    
    ventanaImpresion.document.write(contenidoImpresion);
    ventanaImpresion.document.close();
    
    // Esperar a que se cargue el contenido antes de imprimir
    ventanaImpresion.onload = function() {
      setTimeout(() => {
        ventanaImpresion.print();
        // Opcional: cerrar la ventana después de imprimir
        // ventanaImpresion.close();
      }, 500);
    };
  };

  const calcularTotalAbonado = () => {
    return abonos.reduce((total, abono) => total + abono.monto, 0);
  };

  const calcularSaldoPendiente = () => {
    return factura ? factura.total - calcularTotalAbonado() : 0;
  };

  const estaPagada = () => {
    return Math.abs(calcularSaldoPendiente()) < 0.01;
  };

  const handleInputAbonoChange = (e) => {
    const { name, value } = e.target;
    setNuevoAbono(prev => ({
      ...prev,
      [name]: name === 'monto' ? parseFloat(value) || 0 : value
    }));
  };

  const validarAbono = () => {
    if (nuevoAbono.monto <= 0) {
      alert('El monto debe ser positivo');
      return false;
    }
    
    if (nuevoAbono.monto > calcularSaldoPendiente()) {
      alert('El monto no puede ser mayor al saldo pendiente');
      return false;
    }
    
    return true;
  };

  const agregarAbono = async () => {
    if (!validarAbono()) return;

    try {
      setCargando(true);
      
      const abonoData = {
        factura_id: Number(id),
        monto: nuevoAbono.monto,
        fecha: nuevoAbono.fecha || new Date().toISOString().split('T')[0],
        metodo: nuevoAbono.metodo,
        nota: nuevoAbono.nota || null
      };

      const { data, error } = await supabase
        .from('abonos')
        .insert([abonoData])
        .select();
      
      if (error) throw error;

      // Actualizar estado local primero
      const nuevosAbonos = [data[0], ...abonos];
      setAbonos(nuevosAbonos);
      
      // 🔔 Enviar notificación por WhatsApp con el cálculo correcto
      const totalAbonado = nuevosAbonos.reduce((sum, a) => sum + (a.monto || 0), 0);
      const saldoPendiente = factura.total - totalAbonado;
      
      const numerosWhatsApp = ['573002945085', '573004583117'];

      let mensaje = `NUEVO ABONO REGISTRADO\n\n`;
      mensaje += `Factura: #${factura.id}\n`;
      mensaje += `Cliente: ${factura.cliente}\n`;
      mensaje += `Total Factura: ${formatearMoneda(factura.total)}\n\n`;
      mensaje += `Abono Agregado: ${formatearMoneda(data[0].monto)}\n`;
      mensaje += `Fecha Abono: ${new Date(data[0].fecha).toLocaleDateString('es-CO')}\n`;
      mensaje += `Método: ${data[0].metodo}\n`;
      if (data[0].nota) {
        mensaje += `Nota: ${data[0].nota}\n`;
      }
      mensaje += `\nTotal Abonado: ${formatearMoneda(totalAbonado)}\n`;
      mensaje += `Saldo Pendiente: ${formatearMoneda(saldoPendiente)}\n\n`;

      if (saldoPendiente <= 0) {
        mensaje += `¡FACTURA PAGADA COMPLETAMENTE!\n\n`;
      }

      mensaje += `Notificación automática del sistema`;

      const mensajeCodificado = encodeURIComponent(mensaje);

      // Enviar a los números de WhatsApp
      numerosWhatsApp.forEach((numero, index) => {
        const url = `https://wa.me/${numero}?text=${mensajeCodificado}`;
        setTimeout(() => {
          window.open(url, '_blank');
        }, index * 500);
      });
      
      // Resetear formulario
      setNuevoAbono({
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        metodo: 'Efectivo',
        nota: ''
      });
      setMostrarFormAbono(false);
      
    } catch (error) {
      console.error("Error agregando abono:", error);
      alert('Error al agregar el abono');
    } finally {
      setCargando(false);
    }
  };

  const editarAbono = async () => {
    if (!validarAbono()) return;

    // Solicitar contraseña para editar
    const password = prompt('Ingrese la contraseña para editar el abono:');
    const validPasswords = ['adrian2026', 'hector2026', 'superadmin123', 'inventario2026*', 'conta*', 'vendedor*'];
    if (!validPasswords.includes(password || '')) {
      alert('❌ Contraseña incorrecta. No se puede editar el abono.');
      return;
    }

    try {
      setCargando(true);
      
      const abonoData = {
        monto: nuevoAbono.monto,
        fecha: nuevoAbono.fecha,
        metodo: nuevoAbono.metodo,
        nota: nuevoAbono.nota || null
      };

      const { data, error } = await supabase
        .from('abonos')
        .update(abonoData)
        .eq('id', editandoAbono.id)
        .select();
      
      if (error) throw error;

      // Actualizar estado local
      setAbonos(abonos.map(abono => 
        abono.id === editandoAbono.id ? data[0] : abono
      ));
      
      // Resetear formulario
      setEditandoAbono(null);
      setNuevoAbono({
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        metodo: 'Efectivo',
        nota: ''
      });
      setMostrarFormAbono(false);
      
    } catch (error) {
      console.error("Error editando abono:", error);
      alert('Error al editar el abono');
    } finally {
      setCargando(false);
    }
  };

  const eliminarAbono = async (idAbono) => {
    if (!window.confirm('¿Estás seguro de eliminar este abono?')) return;

    // Solicitar contraseña para eliminar
    const password = prompt('Ingrese la contraseña para eliminar el abono:');
    const validPasswords = ['adrian2026', 'hector2026', 'superadmin123', 'inventario2026*', 'conta*', 'vendedor*'];
    if (!validPasswords.includes(password || '')) {
      alert('❌ Contraseña incorrecta. No se puede eliminar el abono.');
      return;
    }

    try {
      setCargando(true);
      
      const { error } = await supabase
        .from('abonos')
        .delete()
        .eq('id', idAbono);
      
      if (error) throw error;

      // Actualizar estado local
      setAbonos(abonos.filter(abono => abono.id !== idAbono));
      
    } catch (error) {
      console.error("Error eliminando abono:", error);
      alert('Error al eliminar el abono');
    } finally {
      setCargando(false);
    }
  };

  const iniciarEdicionAbono = (abono) => {
    setEditandoAbono(abono);
    setNuevoAbono({
      monto: abono.monto,
      fecha: abono.fecha,
      metodo: abono.metodo || 'Efectivo',
      nota: abono.nota || ''
    });
    setMostrarFormAbono(true);
  };

  const cancelarEdicion = () => {
    setEditandoAbono(null);
    setNuevoAbono({
      monto: '',
      fecha: new Date().toISOString().split('T')[0],
      metodo: 'Efectivo',
      nota: ''
    });
    setMostrarFormAbono(false);
  };

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(monto);
  };

  const formatearMonedaImpresion = (monto) => {
    return `$ ${new Intl.NumberFormat('es-CO', { 
      minimumFractionDigits: 0
    }).format(monto)}`;
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const metodosPago = ['Efectivo', 'Transferencia', 'Tarjeta', 'Cheque', 'Otro'];

  if (cargando) {
    return (
      <div className="cargando-detalle">
        <div className="spinner"></div>
        <p>Cargando cuenta de cobro...</p>
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="factura-no-encontrada">
        <h2>Cuenta de cobro no encontrada</h2>
        <button 
          className="button primary-button"
          onClick={() => navigate('/facturas')}
        >
          Volver al listado
        </button>
      </div>
    );
  }

  const totalAbonado = calcularTotalAbonado();
  const saldoPendiente = calcularSaldoPendiente();

  return (
    <div className="factura-detalle-container">
      <div className="factura-actions-bar">
        <button 
          className="button secondary-button"
          onClick={() => navigate('/facturas')}
        >
          &larr; Volver
        </button>
        
        <div className="action-buttons">
          <button 
            className="button icon-button"
            onClick={copiarDatos}
            title="Copiar datos"
          >
            {copiado ? '✓ Copiado' : '⎘ Copiar'}
          </button>
          <button 
            className="button icon-button"
            onClick={imprimirFactura}
            title="Imprimir"
          >
            ⎙ Imprimir
          </button>
        </div>
      </div>

      <div className="factura-header">
        <div className="header-info">
          <h1>Cuenta de Cobro #{factura.id.toString().padStart(6, '0')}</h1>
          <p className="fecha-emision">
            Emitida el {new Date(factura.fecha).toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="header-total">
          <span>Total Cuenta de Cobro</span>
          <h2>{formatearMoneda(factura.total)}</h2>
        </div>
      </div>

      {/* Mostrar total en letras en la vista normal también */}
      <div className="total-letras-container">
        <div className="total-letras">
          <strong>SON: {convertirNumeroALetras(Math.round(factura.total))}</strong>
        </div>
      </div>

      <div className="factura-info-grid">
        <div className="info-card cliente-info">
          <h3>Cliente</h3>
          <p>{factura.cliente}</p>
          {factura.telefono && <p>Tel: {factura.telefono}</p>}
          {factura.correo && <p>Email: {factura.correo}</p>}
        </div>
        
        <div className="info-card vendedor-info">
          <h3>Vendedor</h3>
          <p>{factura.vendedor}</p>
          {factura.direccion && (
            <div className="direccion-info">
              <h4>Dirección</h4>
              <p>{factura.direccion}</p>
            </div>
          )}
        </div>
      </div>

      <div className="productos-table-container">
        <h3>Productos</h3>
        <table className="productos-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {factura.productos.map((producto, index) => (
              <tr key={index}>
                <td>{producto.nombre}</td>
                <td>{producto.cantidad}</td>
                <td>{formatearMoneda(producto.precio)}</td>
                <td>{formatearMoneda(producto.cantidad * producto.precio)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" className="total-label">Total</td>
              <td className="total-value">{formatearMoneda(factura.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Sección de Abonos */}
      <div className="abonos-section">
        <div className="abonos-header">
          <h3>Abonos</h3>
          <div className="abonos-summary">
            <div className="summary-item">
              <span>Total Abonado:</span>
              <strong>{formatearMoneda(totalAbonado)}</strong>
            </div>
            <div className="summary-item">
              <span>Saldo Pendiente:</span>
              <strong className={saldoPendiente <= 0 ? 'pagado' : 'pendiente'}>
                {formatearMoneda(saldoPendiente)}
                {estaPagada() && <span className="badge-pagado">PAGADO</span>}
              </strong>
            </div>
          </div>
          {!mostrarFormAbono && user?.role === 'admin' && (
            <button 
              className="button primary-button"
              onClick={() => setMostrarFormAbono(true)}
              disabled={estaPagada()}
            >
              + Agregar Abono
            </button>
          )}
        </div>

        {mostrarFormAbono && user?.role === 'admin' && (
          <div className="abono-form">
            <h4>{editandoAbono ? 'Editar Abono' : 'Nuevo Abono'}</h4>
            <div className="form-group">
              <label>Monto:</label>
              <input
                type="number"
                name="monto"
                value={nuevoAbono.monto}
                onChange={handleInputAbonoChange}
                min="0.01"
                step="0.01"
                max={saldoPendiente}
              />
            </div>
            <div className="form-group">
              <label>Fecha:</label>
              <input
                type="date"
                name="fecha"
                value={nuevoAbono.fecha}
                onChange={handleInputAbonoChange}
              />
            </div>
            <div className="form-group">
              <label>Método de pago:</label>
              <select
                name="metodo"
                value={nuevoAbono.metodo}
                onChange={handleInputAbonoChange}
              >
                {metodosPago.map(metodo => (
                  <option key={metodo} value={metodo}>{metodo}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Nota (opcional):</label>
              <textarea
                name="nota"
                value={nuevoAbono.nota}
                onChange={handleInputAbonoChange}
                rows="2"
              />
            </div>
            <div className="form-actions">
              <button 
                className="button secondary-button"
                onClick={cancelarEdicion}
                disabled={cargando}
              >
                Cancelar
              </button>
              <button 
                className="button primary-button"
                onClick={editandoAbono ? editarAbono : agregarAbono}
                disabled={cargando}
              >
                {cargando ? 'Procesando...' : (editandoAbono ? 'Guardar Cambios' : 'Agregar Abono')}
              </button>
            </div>
          </div>
        )}

        {abonos.length > 0 ? (
          <div className="abonos-table-container">
            <table className="abonos-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Nota</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {abonos.map((abono) => (
                  <tr key={abono.id}>
                    <td>{formatearFecha(abono.fecha)}</td>
                    <td>{formatearMoneda(abono.monto)}</td>
                    <td>{abono.metodo || 'Efectivo'}</td>
                    <td>{abono.nota || '-'}</td>
                    <td className="acciones-cell">
                      {user?.role === 'admin' && (
                        <>
                          <button 
                            className="button icon-button small"
                            onClick={() => iniciarEdicionAbono(abono)}
                            title="Editar"
                            disabled={cargando}
                          >
                            ✏️
                          </button>
                          <button 
                            className="button icon-button small danger"
                            onClick={() => eliminarAbono(abono.id)}
                            title="Eliminar"
                            disabled={cargando}
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="sin-abonos">
            <p>No se han registrado abonos para esta cuenta de cobro.</p>
          </div>
        )}
      </div>

      <div className="factura-footer">
        <p className="footer-nota">
          Gracias por su preferencia. Para cualquier aclaración, presentar esta cuenta de cobro.
        </p>
        <div className="footer-logo">
          <span>EBS</span>
          <small>Sistema de Ebs-Hermanos Marin</small>
        </div>
      </div>
    </div>
  );
};

export default FacturaDetalle;