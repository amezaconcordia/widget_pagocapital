import * as alert from './alert.js'

// Variable declarations
const tabla = document.querySelector('.detalle-facturas')
const submit = document.querySelector('#submit-pago')
// document.querySelector('.nombre-cliente').innerText = data[0].customer_name
// document.querySelector('.lote-cliente').innerText = data[0].zcrm_potential_name
let pagadoCapital = 0
const divFacturas = document.querySelector('#facturas-container')
const formatPrice = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

let primerNoPagada,
  record,
  customer_name,
  item_name,
  item_id,
  id_Creator,
  consecutivo,
  plazo,
  invoices = [],
  groups = []

// # On load
ZOHO.embeddedApp.on('PageLoad', async function (data) {
  // # Obtener datos del trato actual
  const zoho_result = await ZOHO.CRM.API.getRecord({
    Entity: 'Deals',
    RecordID: data.EntityId[0],
  })
  const deal = zoho_result.data[0]
  console.log('zoho deal', deal)

  // # Obtener registro de cotizacion
  const requestConfig = {
    method: 'GET',
    url: `https://creator.zoho.com/api/v2/sistemas134/cotizadorgc/report/Presupuesto_Report?Folio=${deal.Numero_de_Cierre}`,
  }

  try {
    const creator_record = await ZOHO.CRM.CONNECTION.invoke(
      'creator',
      requestConfig
    )

    console.log('creator_record', creator_record)
    if (creator_record.details.statusMessage.code !== 3000)
      return alert.show('warning', 'No se encontro registro')

    const recordData = creator_record.details.statusMessage.data[0]
    console.log(recordData)
    alert.show('success', creator_record.message)

    $('.loader-wrapper').fadeOut('slow')
  } catch (error) {
    alert.show('danger', error.message)
  }
})

ZOHO.embeddedApp.init()
