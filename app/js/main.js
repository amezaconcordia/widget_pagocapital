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

const crearPagoCapital = (e) => {
  e.preventDefault()
  const monto = pagoCapital.value
  console.log(monto)
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
    const recordData = zohoFn.getRecordByFolio(deal.Numero_de_Cierre)
    RECORD = recordData

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
submit.addEventListener('click', crearPagoCapital)
