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

    console.log(request)
  } catch (error) {
    return {
      status: 'failed',
      error,
    }
  }
}
