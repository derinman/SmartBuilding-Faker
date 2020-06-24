// 畫面顯示

/* --- DOM --- */
const markerListDOM = document.querySelector('.marker-list');
const peopleCard = document.querySelector('.people-card')
const peopleCardImage = document.querySelector('.people-card-image')
const periodSelect = document.querySelector('#timeSlotSelect')
const modelSelect = document.querySelector('#modelSelect')
const peopleList = document.querySelector('.people-list')
const peopleListItemList = document.querySelector('.people-list__item-list')
const userId = document.querySelector('#userId')
const userTime = document.getElementById('userTime')
const userLongitude = document.getElementById('userLongitude')
const userLatitude = document.getElementById('userLatitude')
const accidentCounts = document.getElementById('accidentCounts')
const portentCounts = document.getElementById('portentCounts')
const userImg = document.getElementById('userImg')
const warning = document.querySelector('.warning')

/* --- Variables --- */
let peopleCardInfo = {} // 單人詳細資訊

/* --- Functions --- */
// 依人員狀態代號定義顏色
const statusColor = (accidentNum) => {
  let color = ''
  switch (accidentNum.toString()) {
    case '0':
      color = 'green';
      break;
    case '1':
      color = 'red';
      break;
    case '2':
      color = 'yellow';
      break;
    case '3':
      color = 'orange';
      break;
  }
  return color
}

// 判斷標誌之間距離，給一危險列表物件資訊，判斷列表中最近的其他人，並回傳ID
const calcMarkerDistance = (data) => {
  let minDistance = Number.POSITIVE_INFINITY;
  let nearestID = null;
  for (let latestData of latestDataList) {
    if (latestData.id === data.id || latestData.accident !== 0) continue;
    if (Math.abs(latestData.timeStamp - data.timeStamp) < NEAREST_SUPPORT_TIME_LIMIT
      && judgeTime(latestData)) {
      let distance = Math.sqrt(Math.pow((data.point[0] - latestData.point[0]), 2)
        + Math.pow((data.point[1] - latestData.point[1]), 2)
        + Math.pow((data.point[2] - latestData.point[2]), 2));
      distance > minDistance ? '' : minDistance = distance, nearestID = latestData.id;
    }
  }
  return nearestID;
}

// 建立模型上的人員標籤, 輸入資料為 latestDataList
const createMarker = (latestDataList) => {
  markerListDOM.innerHTML = '';
  for (let data of latestDataList) {
    if (!judgeTime(data) || !judgeRange(data)) continue;
    let div = document.createElement('div')
    div.dataset.userId = data.id
    div.dataset.timeStamp = getTimeStamp(data)
    div.classList.add('people')
    div.innerHTML = `
      <div class="status unselectable">
        <a>${data.id}</a>
        <div class="statusLight ${statusColor(data.accident)}"></div>
        <div class="line"></div>
      </div>`
    markerListDOM.appendChild(div)
  }
}

// 新資料進入時，清除警示窗項目
const createWarnList = (warnList) => {
  const warning = document.querySelector('.warning');
  document.querySelector('.warning__list').innerHTML = '';
  warning.style.display = "none";

  const detectPeopleInAccident = (id, status) => {
    const blanking = (dom, type) => {
      dom.classList.add(type)
      dom.addEventListener('click', () => {
        dom.classList.remove(type)
      }, false)
    }
    document.querySelectorAll('.people-list__item-list__item').forEach(item => {
      if (item.dataset.userId === id) {
        switch (status) {
          //  墜落
          case 1:
            blanking(item, 'warning--tumble')
            break;
          //  跌倒
          case 2:
            blanking(item, 'warning--fall')
            break;
          //  昏迷
          case 3:
            blanking(item, 'warning--coma')
            break;
          default:
            break;
        }
      }
    })
  }

  for (let warn of warnList) {
    if (!judgeTime(warn) || !judgeRange(warn)) continue;
    warning.style.display = "block";
    let state = '';
    let color = '';
    let alarmText = '';
    let nearestIDText = '';
    const nearestID = calcMarkerDistance(warn);

    detectPeopleInAccident(warn.id, warn.accident);
    nearestID !== null ? nearestIDText = `
    <span class="warn-list__item--nearest">最近人員: ${nearestID}</span>` : '';

    switch (warn.accident) {
      case 1:
        state = '墜落';
        color = '#D0104C';
        break;
      case 2:
        state = '跌倒';
        color = '#DDD23B';
        break;
      case 3:
        state = '昏迷';
        color = '#ff7300';
        break;
    }

    alarmText = `<span class="warn-list__item--name">ID:${warn.id}, </span> 
    <span class="warn-list__item--state" style="color:${color}">狀態:${state}, </span>
    ${nearestIDText}
    `
    let item = document.createElement('p')
    item.className = 'warning__list__item'
    item.innerHTML = alarmText
    item.dataset.userId = warn.id
    item.dataset.latitude = warn.latitude
    item.dataset.longitude = warn.longitude
    item.dataset.accident = warn.accident
    document.querySelector('.warning__list').appendChild(item)
  }
}

// 警告示窗關閉鈕
document.querySelector('.warning__title__close').addEventListener('click', (e) => {
  warning.style.display = 'none';
  peopleListItemList.querySelectorAll('p').forEach(item => {
    item.classList.remove('danger')
  })
})

// 更新時間
const updateLatestInfoDate = source => {
  let date = source.date.replace(/-/g, '/') // yyyy/MM/dd
  let time = source.time.slice(0, 8) // HH:mm:ss
  latestInfoDate.textContent = `${date} - ${time}`
}

// 判斷是否為時間內的資料
const judgeTime = (data) => {
  if (((new Date()).getTime() - data.timeStamp) <= DATA_TIME_LIMIT) {
    return true
  }
  return false
}

// 依範圍判斷人員是否於模型附近  
const judgeRange = (data) => {
  if (data.longitude < GPS.maxX + MODEL_RANGE || data.longitude > GPS.minX - MODEL_RANGE ||
    data.latitude < GPS.maxY + MODEL_RANGE || data.latitude > GPS.minY - MODEL_RANGE) {
    return true
  }
  return false
}

// 更新人員資料卡內容
function updatedPeopleCard(source) {
  let date = source.date.split('-').slice(1).join('/')
  let time = source.time.slice(0, 8)

  userId.textContent = source.id
  userTime.textContent = `${date} - ${time}`
  userLongitude.textContent = (Number(source.longitude) === 0) ? 0 : Number(source.longitude).toFixed(6) // 取小數點後六位
  userLatitude.textContent = (Number(source.latitude) === 0) ? 0 : Number(source.latitude).toFixed(6) // 取小數點後六位
  peopleCard.style.opacity = 1
  userId.className = 'people-card-title'
  let color = statusColor(source.accident)
  peopleCardImage.src = 'src/img/user-icon-' + color + '.png'
  userId.classList.add(color)
  switchHistoryTable()
}

// 移除被選取高亮狀態
function removeHighlight() {
  const peopleList = document.querySelectorAll('.people')
  for (let item of peopleList) {
    const nameText = item.querySelector('a')
    nameText.classList.remove('selected')
  }
}

// 高亮左側人員標籤, 更新右側人員狀態面板
const selectedPeople = id => {
  const peopleList = document.querySelectorAll('.people')
  peopleCard.style.display = 'block'
  peopleList.forEach((dom) => {
    if (id === dom.dataset.userId) {
      dom.querySelector('a').classList.add('selected')
    }
  })
}

// 人員列表建立人員
const createPeopleList = cData => {
  peopleListItemList.innerHTML = ''
  for (let data of cData) {
    let person = document.createElement('p')
    person.className = 'people-list__item-list__item'
    person.dataset.userId = data.id
    person.textContent = data.id
    peopleListItemList.appendChild(person)
  }
}

/**
 * 依選擇的日期區間得到歷史資料
 * @param {variable} past - 周期開始(只有開始日表示當天)
 * @param {variable} curr - 周期結束(通常為今日)
 * @param {string} userId - 選擇的人員名稱
 *@param {string} model - 選擇的呈現模式
 */

function getHistoryByOption(past, curr, userId) {
  let historyList = []
  let accidentList = []
  let totalAcc = 0
  let totalPor = 0
  let accCount = 0
  let porCount = 0
  let pastDate = null
  let currDate = null
  accidentDetail.innerHTML = '' // 清空

  pastDate = Date.parse(past).valueOf()
  currDate = curr ? Date.parse(curr).valueOf() : null

  // 異常歷程
  const accidentDetails = (source) => {
    source.forEach((item) => {
      let color = ''
      let acc = item.accident
      let por = item.portent
      let date = item.date.slice(5, 10).replace(/-/g, '/')
      let time = item.time
      item.accident !== 0 ? accCount++ : ''
      item.portent !== 0 ? porCount++ : ''
      if (acc !== 0) {
        switch (acc) {
          case 1:
            acc = '墜落'
            color = '#D0104C'
            break
          case 2:
            acc = '跌倒'
            color = '#DDD23B'
            break
          case 3:
            acc = '昏迷'
            color = '#ff7300'
            break
        }
      }
      if (por !== 0) {
        switch (por) {
          case 1:
            por = '不穩或失衡'
            break;
          case 2:
            por = '重踩'
            break;
          case 3:
            por = '晃動'
            break;
        }
      }
      accidentDetail.innerHTML += `<p style="color:${color}">${date} [${time}] ${acc ? acc : por}</p>`
    })
  }

  // 圓餅 
  const createChart = (source) => {
    document.querySelector('#chart-container').innerHTML = '&nbsp';
    document.querySelector('#chart-container').innerHTML = `
      <canvas id="visualize-por-pie"></canvas>
      <canvas id="visualize-acc-pie"></canvas>
      <canvas id="visualize-bar"></canvas>`;
    const canvasPorPie = document.querySelector('#visualize-por-pie')
    const contextPorPie = canvasPorPie.getContext('2d')
    contextPorPie.clearRect(0, 0, contextPorPie.width, contextPorPie.height)

    const canvasAccPie = document.querySelector('#visualize-acc-pie')
    const contextAccPie = canvasAccPie.getContext('2d')
    contextAccPie.clearRect(0, 0, contextAccPie.width, contextAccPie.height)

    const canvasBar = document.querySelector('#visualize-bar')
    const contextBar = canvasBar.getContext('2d')
    contextBar.clearRect(0, 0, contextBar.width, contextBar.height)

    accCount = 0
    porCount = 0
    let x_labels = []
    let y_portent_labels = []
    let y_accident_labels = []
    let y_accident_bgc = []
    for (let i = 0; i < source.length; i++) {
      source[i].accident !== 0 ? accCount++ : ''
      source[i].portent !== 0 ? porCount++ : ''
      x_labels[i] = source[i].timeStamp
      y_portent_labels[i] = source[i].portentAcc
      y_accident_labels[i] = source[i].accidentAcc
      switch (source[i].accident) {
        case 0:
          y_accident_bgc[i] = 'green'
          break;
        case 1: //  紅  墜落
          y_accident_bgc[i] = '#D0104C'
          break;
        case 2: //  黃 跌倒
          y_accident_bgc[i] = '#DDD23B'
          break;
        case 3: //  橘  昏迷
          y_accident_bgc[i] = '#ff7300'
          break;
        default:
          y_accident_bgc[i] = 'green'
          break;
      }
    }

    let barConfig = {
      type: 'bar',
      data: {
        labels: x_labels,
        datasets: [
          {
            type: 'line',
            data: y_portent_labels,
            lineTension: false,
            fill: false,
            borderColor: '#ccc',
          },
          {
            type: 'bar',
            barThickness: 10,
            data: y_accident_labels,
            backgroundColor: y_accident_bgc,
          },
        ],
      },
      options: {
        title: {
          display: true,
          text: '折線圖為前兆次數，長條圖為警告次數'
        },
        legend: { display: false },
        scales: {
          xAxes: [{
            type: 'time',
            gridLines: { display: false },
            time: {
              parser: 'x',
              unitStepSize: 15,
              unit: 'minute',
              displayFormat: {
                'millisecond': 'HH:mm:ss.SSS',
                'second': 'HH:mm:ss',
                'minute': 'HH:mm',
                'hour': 'HH',
              }
            }
          }],
          yAxes: [{
            ticks: {
              suggestedMin: 0,
              precision: 0
            }
          }]
        }
      }
    }

    let accDetail = { '安全': 0, '跌倒': 0, '昏迷': 0, '墜落': 0, '未知': 0 };
    let porDetail = { '正常': 0, '不穩或失衡': 0, '突然重踩': 0, '突然晃動': 0, '未知': 0 };
    for (let i = 0; i < source.length; i++) {
      switch (source[i].portent) {
        case 0:
          porDetail['正常']++
          break;
        case 1:
          porDetail['不穩或失衡']++
          break;
        case 2:
          porDetail['突然重踩']++
          break;
        case 3:
          porDetail['突然晃動']++
          break;
        case 5:
          porDetail['未知']++
          break;
        default:
          break;
      }
      switch (source[i].accident) {
        case 0:
          accDetail['安全']++
          break;
        case 1:
          accDetail['墜落']++
          break;
        case 2:
          accDetail['跌倒']++
          break;
        case 3:
          accDetail['昏迷']++
          break;
        case 4:
          accDetail['未知']++
          break;
        default:
          break;
      }
    }

    let accConfig = {
      type: 'pie',
      data: {
        labels: ['跌倒', '昏迷', '墜落', '未知'],
        datasets: [{
          data: [accDetail['跌倒'], accDetail['昏迷'], accDetail['墜落'], accDetail['未知']],
          backgroundColor: ["#ffff00", "#ff7300", "#ff0000"],
        }],
      }, options: {
        title: {
          display: true,
          text: '區間警告次數',
          position: 'top'
        },
        animation: {
          animateScale: true,
          animateRotate: true
        },
      },
    }

    let porConfig = {
      type: 'pie',
      data: {
        labels: ['不穩或失衡', '突然重踩', '突然晃動', '未知'],
        datasets: [{
          data: [porDetail['不穩或失衡'], porDetail['突然重踩'], porDetail['突然晃動'], porDetail['未知']],
          backgroundColor: [],
        }],
      },
      options: {
        title: {
          display: true,
          text: '區間前兆次數',
          position: 'top'
        },
        animation: {
          animateScale: true,
          animateRotate: true
        },
      },
    }
    porCount === 0 ? canvasPorPie.style.width = 0 : new Chart(contextPorPie, porConfig)
    accCount === 0 ? canvasAccPie.style.width = 0 : new Chart(contextAccPie, accConfig)
    porCount === 0 && accCount === 0 ? canvasBar.style.width = 0 : new Chart(contextBar, barConfig)
  }


  allDataList.forEach(item => {
    if (userId === item.id) {
      if (item.accident !== 0) totalAcc++;
      if (item.portent !== 0) totalPor++;
      let dataDate = Date.parse(item.date).valueOf();
      if (curr && past) {
        // 3days, 7days
        if (dataDate >= pastDate && dataDate <= currDate) {
          if (!(item.accident === 0 && item.portent === 0)) accidentList.push(item)
          historyList.push(item)
        }
      } else if (!curr && past) {
        // today, yesterday
        if (dataDate === pastDate) {
          if (!(item.accident === 0 && item.portent === 0)) accidentList.push(item)
          historyList.push(item)
        }
      }
    }
  })
  accidentDetails(accidentList)

  //
  if (historyList.length !== 0) {
    let portentAcc = 0;
    let accidentAcc = 0;
    for (let i = 0; i < historyList.length; i++) {
      if (historyList[i].accident !== 0) {
        accidentAcc++;
        portentAcc = 0;
        (historyList[i])['portentAcc'] = portentAcc;
        (historyList[i])['accidentAcc'] = accidentAcc;
      }
      if (historyList[i].portent !== 0) {
        portentAcc++;
        accidentAcc = 0;
        (historyList[i])['portentAcc'] = portentAcc;
        (historyList[i])['accidentAcc'] = accidentAcc;
      }
      if (historyList[i].portent === 0 && historyList[i].accident === 0) {
        (historyList[i])['portentAcc'] = 0;
        (historyList[i])['accidentAcc'] = 0;
      }
    }
    createChart(historyList)
  } else {
    document.querySelector('#chart-container').innerHTML = '&nbsp'
  }
  // 周期異常、前兆次數
  periodAccidentCounts.textContent = accCount
  periodPortentCounts.textContent = porCount
  // 總異常、前兆次數
  accidentCounts.textContent = totalAcc
  portentCounts.textContent = totalPor
}

// 切換異常事件顯示周期
function switchHistoryTable() {
  const id = userId.textContent
  const time = document.querySelector('#timeSlotSelect').options[document.querySelector('#timeSlotSelect').selectedIndex].value
  Date.prototype.subDays = function (days) {
    this.setDate(this.getDate() - days);
    return this;
  }
  switch (time) {
    case '今日':
      historyTableDate.textContent = todayDate
      getHistoryByOption(todayDate, null, id)
      break
    case '昨日':
      let yesterday = (new Date()).subDays(1)
      yesterday = dateFormat(yesterday.toLocaleString('zn-TW'))
      historyTableDate.textContent = yesterday
      getHistoryByOption(yesterday, null, id)
      break
    case '近三日':
      let threeDaysBefore = (new Date()).subDays(3)
      threeDaysBefore = dateFormat(threeDaysBefore.toLocaleString('zn-TW'))
      historyTableDate.textContent = `${threeDaysBefore} ~ ${todayDate}`
      getHistoryByOption(threeDaysBefore, todayDate, id)
      break
    case '一周':
      let sevenDaysBefore = (new Date()).subDays(7)
      sevenDaysBefore = dateFormat(sevenDaysBefore.toLocaleString('zn-TW'))
      historyTableDate.textContent = `${sevenDaysBefore} ~ ${todayDate}`
      getHistoryByOption(sevenDaysBefore, todayDate, id)
      break
  }
}

// 人員狀態欄初始化
const initPeopleCard = (id) => {
  removeHighlight()
  for (let data of latestDataList) {
    if (data.id === id) {
      selectedPeople(data.id)
      updatedPeopleCard(data)
      switchHistoryTable()
      // 設定資訊欄位人員資訊
      peopleCardInfo = {
        id: data.id,
        device: data.device,
        lat: data.lat,
        lng: data.lng,
        accident: data.accident,
        time: data.time,
        date: data.date,
        hr: data.hr,
        timeStamp: data.timeStamp
      }
    }
  }
  // 異常歷程 option 初始化
  periodSelect.value = '今日'
  modelSelect.value = '列表'
}

// Container-right, 點選畫面右側人員列表觸發事件
peopleList.addEventListener('click', function (e) {
  const searchInput = document.querySelector('.people-list__header__search__input')
  let searchStatus = false

  // 人員搜尋
  if (e.target.classList.contains('people-list__header__search__btn')) {
    for (const item of document.querySelectorAll('.people-list__item-list__item')) {
      if (item.dataset.userId === searchInput.value) {
        removeHighlight()
        selectedPeople(searchInput.value)
        searchStatus = true
        for (let data of latestDataList) {
          if (item.dataset.userId === data.id) updatedPeopleCard(data)
        }
        break
      }
    }
    if (!searchStatus) {
      document.querySelector('.popFrame').classList.add('active')
      document.querySelector('.popFrame__info').innerHTML = `<p>無法找到 ${searchInput.value}</p>`
    }
  }
  // 點選人員列點人員 
  if (e.target.tagName.toLowerCase() === 'p') {
    initPeopleCard(e.target.innerHTML)
  }
})


// 點選畫面左側模型點時，改變狀態、字體變化
containerLeft.addEventListener('click', function (e) {
  if (e.target.parentNode.className.indexOf('status') >= 0) {
    initPeopleCard(e.target.parentNode.children[0].innerHTML)
  }
})

// 彈出頁面, 點選非中央字幕框則關閉
document.querySelector('.popFrame').addEventListener('click', (e) => {
  if (e.target.className.indexOf('popFrame__info') < 0) {
    document.querySelector('.popFrame').className = 'popFrame'
  }
})

// 切換異常歷程
document.querySelector('#historyTable').addEventListener('change', (e) => {
  switchHistoryTable()
})