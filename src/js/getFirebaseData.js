/* Firebase 初始化 */
const app = firebase.initializeApp({
  // apiKey: "AIzaSyDXcHE4Tmy8sStP4T1Nsnr25_G7iLjt7HI",
  // authDomain: "water-c1ecf.firebaseapp.com",
  databaseURL: "https://water-c1ecf.firebaseio.com",
  // projectId: "water-c1ecf",
  // storageBucket: "water-c1ecf.appspot.com",
  // messagingSenderId: "185826267369"
})

const db = app.database()

// firebasePath 依專案修改 db.ref('新增的專案目錄')
let siteDB = db.ref(`/${FIREBASE_PATH}`)

/* DOM */
const latestInfoDate = document.getElementById('latestInfoDate')
// 人員資料卡的歷史數據顯示
const historyTableDate = document.getElementById('historyTableDate')
const periodAccidentCounts = document.getElementById('periodAccidentCounts')
const periodPortentCounts = document.getElementById('periodPortentCounts')
const accHeader = document.getElementById('accHeader')
const accidentDetail = document.getElementById('accidentDetail')

/* Variables */
const dateFormat = (dateObj) => dateObj.split(' ')[0].split('/').map(n => n.length === 1 ? '0' + n : n).join('-')

let todayDate = dateFormat(new Date().toLocaleString('zn-TW'))
let idList = [] // 人名列表
let latestDataList = [] // 人員最新詳細資料列表
let allDataList = [] // 人員所有詳細資料
let warnList = [];  //最新 accident 不為 0 的人員資料

/** Functions */
const getTimeStamp = (data) => {
  let ms = Number(data.time.substring(data.time.length - 3))
  return (new Date(data.date.replace(/-/g, '/') + ' ' + data.time.substring(0, data.time.length - 4))).getTime() + ms
}

//每5分鐘檢查一次，若人員標籤過期，則移除
const checkMarkerTimeLimit = () => {
  setInterval(() => {
    createMarker(latestDataList)
    createWarnList(warnList)
    onCameraChange()
  }, CHECK_INTERVAL)
}

// 換算人員經緯度座標 -> 模型座標
const calcPointInModel = sourceData => {
  let site = GPS
  let [pointX, pointY, pointZ] = [
    ((sourceData.longitude - site.minX) / (site.maxX - site.minX)) * currentModel.modelX + currentModel.modelBBox[0],
    ((sourceData.latitude - site.minY) / (site.maxY - site.minY)) * currentModel.modelY + currentModel.modelBBox[1],
    ELEVATION_CALCULATED ? ((sourceData.altitude - site.minZ) / (site.maxZ - site.minZ)) * currentModel.modelZ + currentModel.modelBBox[2] : (site.maxZ - site.minZ)
  ]
  return [pointX, pointY, pointZ]
}

const createDataList = data => {
  return {
    id: data.id,
    idDevice: data.idDevice,
    latitude: data.latitude,
    longitude: data.longitude,
    accident: data.accident,
    portent: data.portent,
    time: data.time,
    date: data.date,
    heartRate: data.heartRate,
    altitude: data.altitude,
    timeStamp: getTimeStamp(data),
    point: calcPointInModel(data),
  }
}

const updateList = (list, data) => {
  for (let i of list) {
    if (i.id === data.id) {
      i.id = data.id
      i.device = data.idDevice
      i.latitude = data.latitude
      i.longitude = data.longitude
      i.accident = data.accident
      i.portent = data.portent
      i.time = data.time
      i.date = data.date
      i.heartRate = data.heartRate
      i.altitude = data.altitude
      i.timeStamp = data.timeStamp
      i.point = data.point
    }
  }
}

function startGetDataFromDB() {
  let newItems = false
  // 載入時先把DB讀一遍
  siteDB.once('value').then(snapshot => {
    newItems = true
    snapshot.forEach(data => {
      let val = data.val()
      let personData = JSON.parse(JSON.stringify(createDataList(val)))
      if (!idList.includes(val.id)) {
        idList.push(val.id)
        latestDataList.push(personData)
      } else {
        updateList(latestDataList, personData)
      }
      allDataList.push(JSON.parse(JSON.stringify(personData)))
    })

    allDataList.sort(function (a, b) {
      return Number(a.timeStamp) - Number(b.timeStamp);
    })

    for (let latestData of latestDataList) {
      latestData.accident !== 0 ? warnList.push(latestData) : '';
    }

    createPeopleList(latestDataList)
    createMarker(latestDataList)
    createWarnList(warnList)
    updateLatestInfoDate(allDataList[allDataList.length - 1])
    onCameraChange()
    checkMarkerTimeLimit()
  })

  // 監聽DB有無新資料
  // PS: 對on()來說，已存在DB的每一筆都是新資料，所以用 newItems 來控管
  siteDB.on('child_added', snapshot => {
    if (!newItems) return
    let data = createDataList(snapshot.val())
    // 不在list中，create新人員
    if (!idList.includes(data.id)) {
      idList.push(data.id)
      latestDataList.push(data)
    } else {
      updateList(latestDataList, data)
    }
    allDataList.push(data)

    warnList = [];
    for (let latestData of latestDataList) {
      latestData.accident !== 0 ? warnList.push(latestData) : '';
    }

    createPeopleList(latestDataList)
    createMarker(latestDataList)
    createWarnList(warnList)
    updateLatestInfoDate(data)
    onCameraChange()
    if (userId.textContent === data.id) {
      updatedPeopleCard(data)
      switchHistoryTable()
    }
  })
}

// 氣球大小變化
// 得到1小時前的時間點
// function getPastTime(presentTime, pastTime) {
//   let temp = Array.from(presentTime)
//   // console.log(temp)
//   if (temp[0] !== '0') {
//     if (temp[1] !== '0') {
//       temp.splice(1, 1, `${temp[1] - 1}`)
//       pastTime = parseInt(temp.join(''))
//     } else {
//       temp.splice(0, 2, `${temp[0] - 1}9`)
//       pastTime = parseInt(temp.join(''))
//     }
//   } else {
//     if (temp[1] !== '0') {
//       temp.splice(1, 1, `${temp[1] - 1}`)
//       pastTime = parseInt(temp.join(''))
//     } else {
//       temp.splice(0, 2, '23')
//       pastTime = parseInt(temp.join(''))
//     }
//   }
//   return pastTime
// }

// function formatTimeToPureArr(sourceTime) {
//   sourceTime.replace(/-/g, '/')
//   return sourceTime.split('')
// }

// // 將 時間arr > str > num 才能比大小
// function timeArrToStrToNum(time) {
//   time[0] === '0' ? time.unshift('1') : ''
//   return parseInt(time.join(''))
// }

// // 氣球大小隨前兆次數變化
// function balloonSizeChangedByPortent(porCountLimited) {
//   const people = document.querySelectorAll('.people')
//   people.forEach((item) => {
//     let presentTime = formatTimeToPureArr(item.dataset.time)
//     let pastTime
//     pastTime = getPastTime(presentTime, pastTime)
//     presentTime = timeArrToStrToNum(presentTime)

//     let porCount = 0
//     siteDB.once('value').then((snapshot) => {
//       snapshot.forEach((data) => {
//         if (item.dataset.userId === data.val().id) {
//           let dataTime = formatTimeToPureArr(data.val().time)
//           dataTime = timeArrToStrToNum(dataTime)
//           if (dataTime >= pastTime && dataTime <= presentTime) data.val().portent !== 0 ? porCount++ : ''
//         }
//       })
//       porCount = (porCount > porCountLimited) ? porCountLimited : 0
//       let statusLight = item.querySelector('.statusLight')
//       statusLight.style.width = `${15 + (porCount / porCountLimited) * 30}px`
//       statusLight.style.height = `${15 + (porCount / porCountLimited) * 30}px`
//     })
//   })
// }

// balloonSizeChangedByPortent(50)
// setInterval(() => { balloonSizeChangedByPortent(50) }, 600000) // 每10分鐘(600000)變化一次