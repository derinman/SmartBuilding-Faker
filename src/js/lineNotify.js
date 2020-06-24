const lineNotify = (id, status, date) => {
  const config = {
    ACCESS_TOKEN: 'gut4C9qhzG7E5gb4ink63d0RjeXMwM57rVNig0H8VVT',
    EVENT_NAME: '協勤大樓'
  }

  const url = 'https://notify-api.line.me/api/notify'
  fetch(url, {
    method: 'POST',
    body: encodeURI(JSON.stringify({
      msg: `${id} 於 ${date} 偵測狀態為 ${status}`
    })),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Authorization': `Bearer ${config.ACCESS_TOKEN}`
    }
  }).then(res => {
    return res.json();
  })
}

lineNotify()
