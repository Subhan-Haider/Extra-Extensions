const downloadBtn = document.getElementById("downloadBtn");
const videoURLInput = document.getElementById("videoURL");
const status = document.getElementById("status");

downloadBtn.addEventListener("click", () => {
  const url = videoURLInput.value.trim();

  if (!url) {
    status.textContent = "Please enter a video URL.";
    return;
  }

  // Start the download
  chrome.downloads.download({
    url: url,
    filename: `offline_video_${Date.now()}.mp4`
  }, (downloadId) => {
    if (downloadId) {
      status.textContent = "Download started! You can watch offline.";
    } else {
      status.textContent = "Failed to start download. Check the URL.";
    }
  });
});
