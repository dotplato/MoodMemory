const statusEl = document.getElementById("status")!
const connectButton = document.getElementById("connect") as HTMLButtonElement

async function refreshStatus() {
  const storage = await chrome.storage.local.get(["token", "apiUrl"])
  const apiUrl = (storage.apiUrl as string | undefined) ?? "http://localhost:3000"

  if (storage.token) {
    statusEl.textContent = "Connected"
    statusEl.dataset.state = "connected"
    connectButton.textContent = "Open library"
    connectButton.onclick = () => chrome.tabs.create({ url: `${apiUrl}/dashboard` })
    return
  }

  statusEl.textContent = "Not connected"
  statusEl.dataset.state = "disconnected"
  connectButton.textContent = "Connect account"
  connectButton.onclick = () =>
    chrome.tabs.create({ url: `${apiUrl}/extension/connect` })
}

void refreshStatus()

chrome.storage.onChanged.addListener(() => {
  void refreshStatus()
})
