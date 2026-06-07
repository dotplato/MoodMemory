// extension/src/shared.ts
var DEFAULT_API_URL = "http://localhost:3000";
async function getStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["token", "apiUrl"], (result) => {
      resolve({
        token: result.token,
        apiUrl: result.apiUrl ?? DEFAULT_API_URL
      });
    });
  });
}
async function saveToMoodMemory(payload) {
  const { token, apiUrl } = await getStorage();
  if (!token) {
    throw new Error("Not connected. Open the MoodMemory popup to sign in.");
  }
  const response = await fetch(`${apiUrl}/api/extension/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = response.status === 401 ? data.error ?? "Extension session expired. Reconnect from MoodMemory settings." : data.error ?? "Failed to save image";
    throw new Error(message);
  }
}
function sendProgressToTab(tabId, payload) {
  if (!tabId) return;
  chrome.tabs.sendMessage(tabId, {
    type: "MOODMEMORY_PROGRESS",
    ...payload
  });
}
async function sendProgressToApp(payload) {
  const { apiUrl } = await getStorage();
  if (!apiUrl) return;
  let origin;
  try {
    origin = new URL(apiUrl).origin;
  } catch {
    return;
  }
  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs.filter((tab) => tab.id && tab.url?.startsWith(origin)).map(
      (tab) => chrome.tabs.sendMessage(tab.id, {
        type: "MOODMEMORY_PROGRESS",
        ...payload
      }).catch(() => void 0)
    )
  );
}
function notifySaveProgress(tabId, payload) {
  sendProgressToTab(tabId, payload);
  void sendProgressToApp(payload);
}
async function saveToMoodMemoryWithProgress(payload, onProgress) {
  const hasImageData = Boolean(payload.imageDataBase64);
  onProgress({
    state: hasImageData ? "update" : "start",
    progress: hasImageData ? 48 : 8,
    message: hasImageData ? "Uploading to MoodMemory..." : "Saving to MoodMemory..."
  });
  let fakeProgress = hasImageData ? 48 : 8;
  const interval = setInterval(() => {
    fakeProgress = Math.min(fakeProgress + Math.random() * 9 + 3, 92);
    onProgress({
      state: "update",
      progress: Math.round(fakeProgress),
      message: "Uploading to MoodMemory..."
    });
  }, 220);
  try {
    await saveToMoodMemory(payload);
    clearInterval(interval);
    onProgress({
      state: "complete",
      progress: 100,
      message: "Saved to MoodMemory"
    });
  } catch (error) {
    clearInterval(interval);
    onProgress({
      state: "error",
      message: error instanceof Error ? error.message : "Failed to save image"
    });
    throw error;
  }
}

// extension/src/background.ts
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-moodmemory",
    title: "Save to MoodMemory",
    contexts: ["image"]
  });
});
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "save-to-moodmemory" || !info.srcUrl || !tab?.id) {
    return;
  }
  notifySaveProgress(tab.id, {
    state: "start",
    progress: 6,
    message: "Saving to MoodMemory..."
  });
  try {
    notifySaveProgress(tab.id, {
      state: "update",
      progress: 18,
      message: "Reading image..."
    });
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async (imageUrl) => {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to read image (${response.status})`);
        }
        const blob = await response.blob();
        const mimeType = blob.type || "image/jpeg";
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let index = 0; index < bytes.length; index += 8192) {
          binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
        }
        return {
          imageDataBase64: btoa(binary),
          mimeType
        };
      },
      args: [info.srcUrl]
    });
    const captured = result?.result;
    if (!captured?.imageDataBase64) {
      throw new Error("Could not read image data from the page");
    }
    await saveToMoodMemoryWithProgress(
      {
        imageUrl: info.srcUrl,
        pageUrl: tab.url ?? info.srcUrl,
        pageTitle: tab.title ?? "Untitled",
        imageDataBase64: captured.imageDataBase64,
        mimeType: captured.mimeType
      },
      (payload) => notifySaveProgress(tab.id, payload)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save image";
    notifySaveProgress(tab.id, { state: "error", message });
  }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "MOODMEMORY_SAVE") {
    const tabId = sender.tab?.id;
    void saveToMoodMemoryWithProgress(message.payload, (payload) => {
      notifySaveProgress(tabId, payload);
    }).then(() => sendResponse({ success: true })).catch((error) => {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : "Failed to save image"
      });
    });
    return true;
  }
  if (message.type === "MOODMEMORY_SET_TOKEN") {
    chrome.storage.local.set(
      {
        token: message.token,
        apiUrl: message.apiUrl
      },
      () => sendResponse({ success: true })
    );
    return true;
  }
});
