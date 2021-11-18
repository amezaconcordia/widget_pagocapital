export function closeAlert(e) {
  e.target.parentNode.classList.toggle('closed')
  setTimeout(function () {
    e.target.parentNode.remove()
  }, 650)
}

export function show(status, msg) {
  const alert = document.createElement('div')
  alert.style.display = 'block'
  alert.className = `alert ${status}`

  const container = document.querySelector('body')
  const message = document.createElement('div')
  message.className = 'message'
  message.innerText = msg
  alert.appendChild(message)
  const close = document.createElement('span')
  close.className = 'alert-close'
  close.innerHTML = `&#10006;`
  close.addEventListener('click', closeAlert)
  alert.appendChild(close)
  container.appendChild(alert)

  setTimeout(function () {
    alert.classList.toggle('show')
  }, 100)
  setTimeout(function () {
    alert.style.transition = 'opacity 500ms'
  }, 800)
}
