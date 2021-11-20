import * as alert from './alert.js'
import * as zohoFn from './zoho.js'

// Variable declarations
const tabla = document.querySelector('.detalle-facturas')
const submit = document.querySelector('#submit-pago')
const pagoCapital = document.querySelector('#pago')
// let pagadoCapital = 0
const formatPrice = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

let primerNoPagada,
  RECORD,
  CUSTOMER_NAME,
  ITEM_NAME,
  item_id,
  id_Creator,
  consecutivo,
  plazo,
  invoices = [],
  groups = []

// # Function declarations
const createTable = (invoices) => {
  invoices.forEach((factura) => {
    // console.log(invoice.reference_number)

    if (!factura.reference_number.includes('GC')) {
      const capital = factura.custom_fields.find((cf) => cf.label === 'Capital')
      const interes = factura.custom_fields.find((cf) => cf.label === 'Interes')
      const divFactura = document.createElement('tr')
      tabla.appendChild(divFactura)
      //Fecha
      const spanFecha = document.createElement('td')
      spanFecha.textContent = factura.date
      divFactura.append(spanFecha)
      //Descripcion
      const spanDesc = document.createElement('td')
      spanDesc.textContent = factura.reference_number
      divFactura.classList.add('factura')
      divFactura.setAttribute('data-invoiceid', factura.invoice_id)
      // Consecutivo de Factura
      let consecutivoFactura = parseInt(factura.reference_number.split(' ')[0])
      divFactura.setAttribute('data-consecutivo', consecutivoFactura)
      divFactura.append(spanDesc)
      //Cantidad
      const spanPrecio = document.createElement('td')
      spanPrecio.textContent = formatPrice.format(factura.total)
      divFactura.append(spanPrecio)
      //Interes
      const spanInteres = document.createElement('td')
      spanInteres.textContent = factura.total
      spanInteres.textContent = formatPrice.format(parseFloat(interes.value))
      divFactura.append(spanInteres)
      //Capital
      const spanCapital = document.createElement('td')
      spanCapital.textContent = factura.total
      spanCapital.textContent = formatPrice.format(parseFloat(capital.value))
      divFactura.append(spanCapital)
      //Estado
      const spanEstado = document.createElement('td')
      const divEstatus = document.createElement('div')
      divEstatus.textContent = factura.status
      divFactura.append(spanEstado)
      spanEstado.append(divEstatus)
    }
  })
}

const findPrimerNoPagada = (invoices) => {
  const find = invoices.find(
    (fact) => fact.status == 'sent' && !fact.reference_number.includes('GC')
  )
  return find
}

const createPagoCapital = (monto) => {
  let today = new Date()
  today = convertirFecha(today)
  let fecha_vencimiento = new Date(new Date().setDate(new Date().getDate() + 7))
  fecha_vencimiento = convertirFecha(fecha_vencimiento)

  let invoice_data = {
    customer_id: RECORD.IDContactoBooks,
    reference_number: 'Pago Prueba Widget',
    date: today,
    due_date: fecha_vencimiento,
    custom_fields: [
      {
        label: 'TipoProducto',
        value: 'Casa',
      },
      {
        label: 'Pago a Capital',
        value: true,
      },
      {
        label: 'Capital',
        value: document.querySelector('#pago').value,
      },
      {
        label: 'Interes',
        value: 0,
      },
    ],
    line_items: [
      {
        item_id: RECORD.IDProductoBooks,
        description: 'Pago a Capital de Consecutivo',
        quantity: 1,
        rate: parseFloat(monto),
      },
    ],
  }

  return invoice_data
}

const convertirFecha = (fecha) => {
  let dd = String(fecha.getDate()).padStart(2, '0')
  let mm = String(fecha.getMonth() + 1).padStart(2, '0')
  let yyyy = fecha.getFullYear()
  fecha = yyyy + '-' + mm + '-' + dd
  return fecha
}

const realizarPagoCapital = async (e) => {
  e.preventDefault()

  // # Crear factura de pago de capital
  const monto = pagoCapital.value
  const invoice = createPagoCapital(monto)

  /*
   * # OPERACIONES
   */

  // # Crear factura en books
  const crearPagoResp = await zohoFn.createInvoice(invoice)
  console.log(crearPagoResp)

  // # Eliminar invoices
  /* const deleteResp = await zohoFn.deleteInvoices(CUSTOMER_NAME, ITEM_NAME)
  console.log(deleteResp) */
}

// # ZOHO CRM SDK On load
ZOHO.embeddedApp.on('PageLoad', async function (data) {
  // # Obtener datos del trato actual
  const zoho_result = await ZOHO.CRM.API.getRecord({
    Entity: 'Deals',
    RecordID: data.EntityId[0],
  })
  const deal = zoho_result.data[0]
  console.log('zoho deal', deal)

  // Asignacion a variables
  CUSTOMER_NAME = deal.Contact_Name.name
  ITEM_NAME = deal.Nombre_de_Producto.name

  try {
    // # Obtener registro de cotizacion
    RECORD = await zohoFn.getRecordByFolio(deal.Numero_de_Cierre)

    // # Obtener invoices
    const invoices = await zohoFn.getInvoices(CUSTOMER_NAME, ITEM_NAME)
    console.log('All Invoices:', invoices)

    // # Crear tabla de amortizacion
    createTable(invoices)

    // # Buscar primer no pagada
    findPrimerNoPagada(invoices)

    $('.loader-wrapper').fadeOut('slow')
  } catch (error) {
    alert.show('danger', error.message)
  }
})

ZOHO.embeddedApp.init()

// # Event Listeners
submit.addEventListener('click', realizarPagoCapital)
