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

let PRIMER_NO_PAGADA, RECORD, CUSTOMER_NAME, ITEM_NAME, CONSECUTIVO, PLAZO

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
      if (factura.status == 'paid' || factura.status == 'partially_paid') {
        divEstatus.classList.add('paid')
      }
      divFactura.append(spanEstado)
      spanEstado.append(divEstatus)
    }
  })
}

const createNewTable = (json_amortizacion) => {
  const rows = Array.from(tabla.getElementsByTagName('tr'))
  // console.log(rows)
  const filterFact = rows.filter((row) => row.cells[5].textContent == 'sent')
  // console.log(filterFact)
  filterFact.forEach((row) => {
    let cells = row.cells
    // console.log(cells)
    const consecutivo = row.dataset.consecutivo
    const factura = json_amortizacion.find((e) => e.Consecutivo == consecutivo)
    // Actualizar Mensualidad
    cells[2].textContent = formatPrice.format(factura.Mensualidad)
    cells[2].style.color = '#5494f7'
    // Actualizar Interes
    cells[3].textContent = formatPrice.format(factura.Interes)
    cells[3].style.color = '#5494f7'
    // Actualizar Capital
    cells[4].textContent = formatPrice.format(factura.Capital)
    cells[4].style.color = '#5494f7'
  })
}

const insertPagoToTable = (invoice) => {
  try {
    const rows = Array.from(tabla.getElementsByTagName('tr'))

    const split = invoice.reference_number.split(' ')
    const consecutivo = split[1]
    const find = rows.find((row) => row.dataset.consecutivo == consecutivo)

    console.log('Tr consecutivo', find)
    let adjacentHtml = `<tr class="factura" style="color: #059400;">
  <td>${invoice.date}</td>
  <td>${invoice.reference_number}</td>
  <td>${formatPrice.format(pagoCapital.value)}</td>
  <td>$0.00</td>
  <td>${formatPrice.format(pagoCapital.value)}</td>
  <td>sent</td>
  </tr>`

    find.insertAdjacentHTML('beforebegin', adjacentHtml)
  } catch (error) {
    console.error(error)
  }
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
  let fecha_vencimiento = new Date(new Date().setDate(new Date().getDate() + 1))
  fecha_vencimiento = convertirFecha(fecha_vencimiento)

  const refSplit = PRIMER_NO_PAGADA.reference_number.split(' ')
  const desc = `Pago a Capital de Consecutivo ${refSplit[0]} de ${refSplit[4]} ${refSplit[5]} ${refSplit[6]}`

  let invoice_data = {
    customer_id: RECORD.IDContactoBooks,
    zcrm_potential_id: PRIMER_NO_PAGADA.zcrm_potential_id,
    reference_number: `Capital ${refSplit[0]} de ${refSplit[4]} ${refSplit[5]} ${refSplit[6]}`,
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
        value: pagoCapital.value,
      },
      {
        label: 'Interes',
        value: 0,
      },
    ],
    line_items: [
      {
        item_id: RECORD.IDProductoBooks,
        description: desc,
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

const getSaldoInicial = () => {
  const amortizacion = JSON.parse(`[${RECORD.JSON_Amortizacion}]`)

  const pagoActual = amortizacion.find((f) => f.Consecutivo == CONSECUTIVO)
  return pagoActual.SaldoInicial
}

const realizarPagoCapital = async (e) => {
  e.preventDefault()
  submit.style.display = 'none'

  // # Crear factura de pago de capital
  const monto = pagoCapital.value
  const invoice = createPagoCapital(monto)
  console.log(invoice)

  /*
   * # OPERACIONES
   */

  // # Calcular nuevo saldo
  const saldo = getSaldoInicial()
  console.log('Saldo Inicial:', saldo)

  const saldoDeducido = saldo - monto
  console.log('Nuevo saldo deducido:', saldoDeducido)

  // # Calcular amortizacion y actualizar registro de cotizacion
  const calcularAmortizacion = await zohoFn.updateAmortizacion(
    RECORD.ID,
    saldoDeducido,
    CONSECUTIVO,
    PLAZO,
    monto
  )

  console.log(RECORD.ID, saldoDeducido, CONSECUTIVO, PLAZO, monto)

  const amortizacionResp = JSON.parse(calcularAmortizacion.details.output)
  console.log(amortizacionResp)
  const jsonAmortizacion = amortizacionResp.data.JSON_Amortizacion
  console.log(jsonAmortizacion)

  // Revisar si calculo amortizacion para proceder a crear las nuevas facturas
  if (amortizacionResp.code == 0) {
    // # Crear nueva tabla
    createNewTable(jsonAmortizacion)
    insertPagoToTable(invoice)

    // # Update productos con nuevo Monto de Interes
    const updateProdBooks = await zohoFn.updateProducBooks(
      RECORD.IDProductoBooks,
      // 230000
      amortizacionResp.data.NewMonto.toFixed(2)
    )

    const updateProdCRM = await zohoFn.updateProductCRM(
      RECORD.IDProducto,
      amortizacionResp.data.NewMonto.toFixed(2)
    )

    console.log(updateProdBooks, updateProdCRM)

    // # Eliminar invoices
    const deleteResp = await zohoFn.deleteInvoices(CUSTOMER_NAME, ITEM_NAME)
    if (deleteResp.code == 'success') {
      alert.show(
        'success',
        'Facturas eliminadas. Creando facturas con nueva mensualidad'
      )
    } else {
      alert.show(
        'danger',
        'Las facturas no fueron eliminadas. Contactar a Sistemas'
      )
    }

    // # Crear factura en books
    const crearPagoResp = await zohoFn.createInvoice(invoice)
    alert.show(crearPagoResp.status, crearPagoResp.message)

    // # Creacion masiva de facturas
    const sizeMap = amortizacionResp.data.sizemap
    let contador = 0

    // const sizeMap = 10
    for (let i = 0; i < sizeMap; i++) {
      const creacionMasiva = await zohoFn.createInvoices(
        RECORD.IDOportunidad,
        RECORD.IDContactoBooks,
        RECORD.IDProductoBooks,
        RECORD.ID,
        i
      )

      const creacionResp = JSON.parse(creacionMasiva.details.output)
      console.log('Creacion Resp', creacionResp)
      if (creacionResp.code == 0) {
        contador = contador + 1
        alert.show(
          'success',
          `Facturas creadas con nueva mensualidad. [${contador}] de [${sizeMap}]`
        )
      } else {
        alert.show('danger', `Error al crear facturas de lista ${i}`)
      }
    }

    alert.show('success', 'Proceso completado.')
  } else {
    alert.show(
      'warning',
      'No se pudo actualizar tabla de amortizacion. Favor de intentar de nuevo o contactar a Sistemas.'
    )
  }
}

const validationScript = async (deal, record) => {
  // # Validar si es Casa
  const product = await zohoFn.isCasa(deal.Nombre_de_Producto.id)
  console.log('Product', product)

  const esCasa = product.data[0].Uso_Habitacional
  if (esCasa != 'Casa') {
    return {
      passed: false,
      message: 'El producto asociado no aplica para esta operacion',
    }
  }

  // # Validar si trato tiene Numero de Cierre
  if (deal.Numero_de_Cierre == null)
    return {
      passed: false,
      message: 'No se encontro un Numero de Cierre en el Trato',
    }

  // # Validar registro de cotizacion
  if (
    record.IDOportunidad == '' ||
    record.IDContacto == '' ||
    record.IDContactoBooks == '' ||
    record.IDProducto == '' ||
    record.IDProductoBooks == ''
  ) {
    return {
      passed: false,
      message: 'Revisar la cotizacion para agregar datos faltantes',
    }
  }

  console.log('Validation passed...')
  return { passed: true }
}

// Input validation script
function setInputFilter(textbox, inputFilter) {
  ;[
    'input',
    'keydown',
    'keyup',
    'mousedown',
    'mouseup',
    'select',
    'contextmenu',
    'drop',
  ].forEach(function (event) {
    textbox.addEventListener(event, function () {
      if (inputFilter(this.value)) {
        this.oldValue = this.value
        this.oldSelectionStart = this.selectionStart
        this.oldSelectionEnd = this.selectionEnd
      } else if (this.hasOwnProperty('oldValue')) {
        this.value = this.oldValue
        this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd)
      } else {
        this.value = ''
      }
    })
  })
}

// # ZOHO CRM SDK On load
ZOHO.embeddedApp.on('PageLoad', async function (data) {
  // Widget rezise
  ZOHO.CRM.UI.Resize({ height: '800', width: '1000' }).then(function (data) {
    console.log(data)
  })

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
    console.log('Record', RECORD)

    // # Run validation
    const checkValidation = await validationScript(deal, RECORD)

    if (!checkValidation.passed) {
      alert.show('warning', checkValidation.message)
    } else {
      // Validation passed
      // # Obtener invoices
      const invoices = await zohoFn.getInvoices(CUSTOMER_NAME, ITEM_NAME)
      console.log('All Invoices:', invoices)

      // # Crear tabla de amortizacion
      createTable(invoices)

      // # Buscar primer no pagada
      PRIMER_NO_PAGADA = findPrimerNoPagada(invoices)
      CONSECUTIVO = parseInt(PRIMER_NO_PAGADA.reference_number.split(' ')[0])
      PLAZO = parseInt(PRIMER_NO_PAGADA.reference_number.split(' ')[2])

      $('.loader-wrapper').fadeOut('slow')
    }
  } catch (error) {
    alert.show('danger', error.message)
  }
})

ZOHO.embeddedApp.init()

// # Event Listeners
submit.addEventListener('click', realizarPagoCapital)

setInputFilter(pagoCapital, function (value) {
  return /^-?\d*[.,]?\d{0,2}$/.test(value)
})
