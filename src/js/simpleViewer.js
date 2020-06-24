// 串接 大象雲台 API

// --- DOM ---
const container = document.querySelector('.container')
const containerLeft = container.querySelector('.container-left')

// --- Variables ---
let currentModel = {}

// --- Viewer initialize ---
let viewerIframeWindow = null
window.addEventListener('load', () => {
  let viewerIframe = document.getElementById('viewerIframe')
  viewerIframe.src = VIEWER_SERVER_HOST + '/viewer.html?path=' + MODEL_PATH + '&language=zh-TW'
  viewerIframe.onload = () => viewerIframeWindow = viewerIframe.contentWindow
})

// --- main api ---

// 控制視角位移，物件移動
function onProjected(data) {
  for (let latestData of latestDataList) {
    if (data.point.toString() === latestData.point.toString()) {
      latestData['IFrameLeft'] = data.result[0];
      latestData['IFrameTop'] = data.result[1];
    }
  }
  // 變更標籤位置
  const markersDOM = document.querySelectorAll('.people');
  for (let markerDOM of markersDOM) {
    for (let latestData of latestDataList) {
      if (markerDOM.dataset.userId === latestData.id) {
        markerDOM.style.left = latestData.IFrameLeft + 'px';
        markerDOM.style.top = latestData.IFrameTop + 'px';
        markerDOM.style.display = "block";
      }
    }
  }
}

// 視角變化  ->  MSG_PROJECT_POINT postMessage 回傳 MSG_RETURN_PROJECTED_POINT
function onCameraChange() {
  for (let latestData of latestDataList) {
    let msg = {
      type: 'MSG_PROJECT_POINT',
      data: {
        point: latestData.point
      }
    }
    viewerIframeWindow.postMessage(JSON.stringify(msg), VIEWER_SERVER_HOST)
  }
}

// 設定工具列
function setToolbarItems(items) {
  if (viewerIframeWindow) {
    let msg = {
      type: 'MSG_SET_TOOLBAR_ITEMS',
      data: {
        items
      }
    }
    viewerIframeWindow.postMessage(JSON.stringify(msg), VIEWER_SERVER_HOST)
  }
}

// Message 監聽，並調用其他行為
window.addEventListener('message', (e) => {
  try {
    let dataObj = (typeof e.data === 'object') ? e.data : JSON.parse(e.data)
    switch (dataObj.type) {
      case 'MSG_RETURN_PROJECTED_POINT':
        onProjected(dataObj.data)
        break
      case 'MSG_CAMERA_CHANGE':
        onCameraChange()
        break
      case 'MSG_MODEL_READY':
        setToolbarItems(['']) // 不顯示工具列
        let currModelBBox = dataObj.data.bbox
        currentModel = {
          modelBBox: currModelBBox,
          modelX: currModelBBox[3] - currModelBBox[0],
          modelY: currModelBBox[4] - currModelBBox[1],
          modelZ: currModelBBox[5] - currModelBBox[2]
        }
        break
      case 'MSG_MODEL_TREE_READY':
        startGetDataFromDB()
        break
    }
  } catch (e) {
    console.log(e)
  }
})

