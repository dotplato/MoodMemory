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
    throw new Error(data.error ?? "Failed to save image");
  }
}
function showToast(message, type = "success") {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (!tabId) return;
    chrome.tabs.sendMessage(tabId, {
      type: "MOODMEMORY_TOAST",
      message,
      toastType: type
    });
  });
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
  try {
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
    await saveToMoodMemory({
      imageUrl: info.srcUrl,
      pageUrl: tab.url ?? info.srcUrl,
      pageTitle: tab.title ?? "Untitled",
      imageDataBase64: captured.imageDataBase64,
      mimeType: captured.mimeType
    });
    showToast("Saved to MoodMemory");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save image";
    showToast(message, "error");
  }
});
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "MOODMEMORY_SAVE") {
    void saveToMoodMemory(message.payload).then(() => {
      showToast("Saved to MoodMemory");
      sendResponse({ success: true });
    }).catch((error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to save image";
      showToast(errorMessage, "error");
      sendResponse({ success: false, error: errorMessage });
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
