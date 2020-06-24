// 會員, firebase 為 cloud firestore
firebase.initializeApp({
  apiKey: "AIzaSyDXcHE4Tmy8sStP4T1Nsnr25_G7iLjt7HI",
  authDomain: "water-c1ecf.firebaseapp.com",
  databaseURL: "https://water-c1ecf.firebaseio.com",
  projectId: "water-c1ecf",
  storageBucket: "water-c1ecf.appspot.com"
})

const db = firebase.firestore()
const users = db.collection('users')

// Selectors
const qs = (selectors) => { return document.querySelector(selectors) }
const qsa = (selectors) => { return document.querySelectorAll(selectors) }

const input = qsa('.input')
const switchBtn = qsa('.switch--button')
const login = qs('.login-page')
const signup = qs('.signup-page')

function createMessage(msg) {
  console.log(msg)
}

function swicher() {
  if (login.classList.contains('is-visible')) {
    login.classList.remove('is-visible')
    signup.classList.add('is-visible')
    input.forEach((item) => item.value = '')
  } else if (signup.classList.contains('is-visible')) {
    signup.classList.remove('is-visible')
    login.classList.add('is-visible')
    input.forEach((item) => item.value = '')
  }
}

switchBtn.forEach((item) => {
  item.addEventListener('click', (e) => {
    swicher()
  })
})

//--------------------------------

// 註冊
const signupButton = qs('.signup--button')
const signupName = qs('#signup--name')
const signupEmail = qs('#signup--email')
const signupPassword = qs('#signup--password')
const signupComfirmPassword = qs('#signup--comfirm-password')

signupButton.addEventListener('click', (e) => {
  if (signupPassword.value !== signupComfirmPassword.value) {
    return console.log('密碼不同')
  }
  let user = {
    email: signupEmail.value,
    password: signupPassword.value
  }
  firebase.auth().createUserWithEmailAndPassword(user.email, user.password)
    .then((UserCredential) => {
      const uid = UserCredential.user.uid
      const createTime = (new Date()).getTime()

      users.doc(uid).set({
        uid,
        createTime,
        name: signupName.value,
        email: signupEmail.value
      })

      swicher();
    }).catch((error) => {
      let errorCode = error.code
      let errorMessgae = error.message
      console.log(errorCode)
      console.log(errorMessgae)
    })
}, false)

// 登入
const loginButton = qs('.login--button')
const loginEmail = qs('#login--email')
const loginPassword = qs('#login--password')
loginButton.addEventListener('click', () => {
  firebase.auth().signInWithEmailAndPassword(loginEmail.value, loginPassword.value)
    .then(() => {
      console.log(firebase.auth().currentUser)

      const loginTime = (new Date()).getTime()
      // window.location.href = '/site.html'
    })
    .catch((error) => {
      let errorCode = error.code
      let errorMessgae = error.message
      console.log(errorCode)
      console.log(errorMessgae)
    })
}, false)


// 驗證狀態
const userState = firebase.auth().currentUser
if (userState) {
  console.log('login', userState)
} else {
  console.log('not login yet')
}

var userLogin;
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    userLogin = user;
    console.log("User is logined", user)
  } else {
    userLogin = null;
    console.log("User is not logined yet.");
  }
});

// 登出
qs('.signOut--button').addEventListener('click', () => {
  firebase.auth().signOut().then(() => {
    console.log('User sign out!')
  }), (error) => {
    console.log('User sign out error', error)
  }
})
