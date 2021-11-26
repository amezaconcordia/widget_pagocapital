// @ZOHO BOOKS
// # Get Invoices
export async function getInvoices(customer_name, item_name) {
  const connection = 'invoicebooks'

  const requestConfig = {
    method: 'GET',
    // url: `https://books.zoho.com/api/v3/invoices?customer_name=${customer_name}&item_name=${item_name}&page=1&sort_column=created_time&sort_order=A&organization_id=651425182`,
    url: `https://books.zoho.com/api/v3/invoices?customer_name=${encodeURI(
      customer_name
    )}&item_name=${encodeURI(
      item_name
    )}&page=1&sort_column=created_time&sort_order=A&organization_id=651425182`,
  }

  try {
    const request = await ZOHO.CRM.CONNECTION.invoke(connection, requestConfig)
    const data = request.details.statusMessage

    /* if (data.page_context.has_more_page) {
      console.log('Tiene mas de 200 facturas')
      const requestConfig2 = {
        method: 'GET',
        url: `https://books.zoho.com/api/v3/invoices?customer_name=${encodeURI(
          customer_name
        )}&item_name=${encodeURI(
          item_name
        )}&page=2&sort_column=created_time&sort_order=A&organization_id=651425182`,
      }

      const request2 = await ZOHO.CRM.CONNECTION.invoke(
        connection,
        requestConfig2
      )
      const data2 = request2.details.statusMessage

      const allInvoices = [...data.invoices, ...data2.invoices]
      console.log(allInvoices)
      return allInvoices
    } else {
      return data.invoices
    } */

    if (!data.page_context.has_more_page) return data.invoices

    console.log('Tiene mas de 200 facturas')
    // Tiene mas de 200 invoices, procede a realizar segunda peticion
    console.log(
      '%c Realizando segunda peticion ',
      'background: #222; color: #bada55'
    )
    const requestConfig2 = {
      method: 'GET',
      url: `https://books.zoho.com/api/v3/invoices?customer_name=${encodeURI(
        customer_name
      )}&item_name=${encodeURI(
        item_name
      )}&page=2&sort_column=created_time&sort_order=A&organization_id=651425182`,
    }

    const request2 = await ZOHO.CRM.CONNECTION.invoke(
      connection,
      requestConfig2
    )
    const data2 = request2.details.statusMessage
    const allInvoices = [...data.invoices, ...data2.invoices]

    return allInvoices
  } catch (error) {
    return {
      status: 'failed',
      error,
    }
  }
}

// # Get invoice by ID
export async function getInvoiceById(invoice_id) {
  console.log('getting invoice...')
  const connection = 'invoicebooks'

  const requestConfig = {
    method: 'GET',
    url: `https://books.zoho.com/api/v3/invoices/${invoice_id}?organization_id=651425182`,
  }

  try {
    const request = await ZOHO.CRM.CONNECTION.invoke(connection, requestConfig)

    return request.details.statusMessage
  } catch (error) {
    return {
      status: 'failed',
      error,
    }
  }
}

export async function createInvoice(invoice_data) {
  const connection = 'invoicebooks'

  try {
    //Crear Factura
    //Request Config Crear
    let req_data = {
      method: 'POST',
      parameters: invoice_data,
      url: 'https://books.zoho.com/api/v3/invoices?organization_id=651425182',
      headers: { 'Content-Type': 'application/json' },
    }
    const zoho_promise = await ZOHO.CRM.CONNECTION.invoke(connection, req_data)

    let invoice_id = zoho_promise.details.statusMessage.invoice.invoice_id

    //Enviar Factura
    //Request Config Enviar
    let req_send = {
      method: 'POST',
      url: `https://books.zoho.com/api/v3/invoices/${invoice_id}/status/sent?organization_id=651425182`,
      headers: { 'Content-Type': 'application/json' },
    }
    const zoho_promise_send = await ZOHO.CRM.CONNECTION.invoke(
      connection,
      req_send
    )
    if (zoho_promise.details.statusMessage.code !== 0) {
      return { status: 'danger', message: 'La factura no fue creada' }
    }

    return { status: 'success', message: 'La factura fue creada' }
  } catch (error) {
    return {
      status: 'failed',
      error,
    }
  }
}

export async function updateProducBooks(productId, montoConInteres) {
  const connection = 'productobooks'

  const objItem = {
    custom_fields: [{ label: 'Precio con Interes', value: montoConInteres }],
  }

  try {
    const req_update = {
      method: 'PUT',
      url: `https://books.zoho.com/api/v3/items/${productId}?organization_id=651425182`,
      parameters: objItem,
    }
    const zoho_promise = await ZOHO.CRM.CONNECTION.invoke(
      connection,
      req_update
    )

    return zoho_promise
  } catch (error) {
    return { status: 'failed', error }
  }
}

// @ZOHO CREATOR
// # Get record by criteria
export async function getRecordByFolio(folio) {
  const connection = 'creator'

  const requestConfig = {
    method: 'GET',
    url: `https://creator.zoho.com/api/v2/sistemas134/cotizadorgc/report/Presupuesto_Report?Folio=${folio}`,
  }

  try {
    const creator_record = await ZOHO.CRM.CONNECTION.invoke(
      connection,
      requestConfig
    )

    if (creator_record.details.statusMessage.code !== 3000)
      return alert.show('warning', 'No se encontro registro')

    const recordData = creator_record.details.statusMessage.data[0]
    return recordData
  } catch (error) {
    return {
      status: 'failed',
      error,
    }
  }
}

// @ZOHO CRM
// # Calcular amortizacion y Actualizar registro de cotizacion de Presupuesto Report
export async function updateAmortizacion(
  registro,
  montoInicial,
  facturaInicial,
  facturaFinal,
  pagoCapital
) {
  const functionName = 'calcularcapital'

  try {
    const zoho_promise = await ZOHO.CRM.FUNCTIONS.execute(functionName, {
      arguments: JSON.stringify({
        IDPresupuesto: registro,
        Monto_Inicial: montoInicial,
        factura_Inicial: facturaInicial,
        factura_Final: facturaFinal,
        Pago_capital: pagoCapital,
      }),
    })

    return zoho_promise
  } catch (error) {
    return {
      status: 'failed',
      error,
    }
  }
}

// # Eliminar facturas de un cliente en Books
export async function deleteInvoices(customer_name, item_name) {
  const functionName = 'testAPI'

  try {
    const zoho_promise = await ZOHO.CRM.FUNCTIONS.execute(functionName, {
      arguments: JSON.stringify({
        customer_name: customer_name,
        item_name: item_name,
        masFacturas: true,
      }),
    })

    return zoho_promise
  } catch (error) {
    return {
      status: 'failed',
      error,
    }
  }
}

// # Creacion masiva de invoices
export async function createInvoices(
  oportunidad,
  cliente,
  producto,
  registro,
  posicion
) {
  const functionName = 'creacionFacturasCapital'

  try {
    const zoho_promise = await ZOHO.CRM.FUNCTIONS.execute(functionName, {
      arguments: JSON.stringify({
        IDOportunidad: oportunidad,
        IDClienteBooks: cliente,
        IDProductoBooks: producto,
        IDPresupuesto: registro,
        Position: posicion,
      }),
    })

    return zoho_promise
  } catch (error) {
    return {
      status: 'failed',
      error,
    }
  }
}

export async function updateProductCRM(productId, montoConInteres) {
  const req_updateCRM = {
    Entity: 'Products',
    APIData: {
      id: productId,
      Precio_con_Interes: montoConInteres,
    },
    Trigger: [],
  }

  try {
    const zoho_promise = await ZOHO.CRM.API.updateRecord(req_updateCRM)

    return zoho_promise
  } catch (error) {
    return { status: 'failed', error }
  }
}
