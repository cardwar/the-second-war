// ==== Firebase SDK (v10 모듈) ====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 1) 여기에 본인 프로젝트 설정 붙이기 (Firebase 콘솔 > 프로젝트 설정 > 일반 > SDK 코드 복사)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ==== DOM ====
const $ = (id)=>document.getElementById(id);
const startBox  = $('startBox');
const signupBox = $('signupBox');
const loginBox  = $('loginBox');
const welcomeBox= $('welcomeBox');
const who       = $('who');

const goLogin   = $('goLogin');
const goSignup  = $('goSignup');
const suNickname= $('suNickname');
const suPassword= $('suPassword');
const signupBtn = $('signupBtn');
const suCancel  = $('suCancel');
const suHint    = $('suHint');

const liNickname= $('liNickname');
const liPassword= $('liPassword');
const loginBtn  = $('loginBtn');
const liCancel  = $('liCancel');
const liHint    = $('liHint');

const backHome  = $('backHome');
const logoutBtn = $('logoutBtn');

// ==== Helper ====
const NICK_COLLECTION = "nicknames";   // /nicknames/{nicknameLower} -> { uid }
const domain = "nick.local";           // 가짜 이메일 도메인

function normNick(nick) {
  return nick.trim().toLowerCase().replace(/\s+/g, "");
}
function emailFromNick(nick){
  return `${normNick(nick)}@${domain}`;
}
function show(el){ el.classList.remove('hidden'); }
function hide(el){ el.classList.add('hidden'); }
function toHome(){
  hide(signupBox); hide(loginBox); hide(welcomeBox); show(startBox);
}

// ==== 네비 ====
goSignup.addEventListener('click', ()=>{ hide(startBox); show(signupBox); suHint.textContent=""; });
goLogin .addEventListener('click', ()=>{ hide(startBox); show(loginBox);  liHint.textContent=""; });
suCancel.addEventListener('click', toHome);
liCancel.addEventListener('click', toHome);

// ==== 가입 ====
signupBtn.addEventListener('click', async ()=>{
  const rawNick = suNickname.value;
  const pass    = suPassword.value;

  suHint.textContent = "";
  const nick = normNick(rawNick);

  if(!nick){ suHint.textContent = "닉네임을 입력해 주세요."; return; }
  if(pass.length < 8){ suHint.textContent = "패스워드는 8자 이상 입력해 주세요."; return; }

  try{
    // 1) 닉네임 중복 확인 (Firestore)
    const nickRef = doc(db, NICK_COLLECTION, nick);
    const nickSnap= await getDoc(nickRef);
    if(nickSnap.exists()){
      suHint.textContent = "이미 사용 중인 닉네임입니다.";
      return;
    }

    // 2) Auth 계정 생성 (이메일=닉네임@nick.local)
    const email = emailFromNick(nick);
    const cred  = await createUserWithEmailAndPassword(auth, email, pass);

    // 3) 매핑 저장
    await setDoc(nickRef, { uid: cred.user.uid, createdAt: new Date() });

    alert("가입 완료! 이제 로그인해 보세요.");
    toHome();
  }catch(err){
    console.error(err);
    suHint.textContent = "가입 중 오류가 발생했습니다.";
  }
});

// ==== 로그인 ====
loginBtn.addEventListener('click', async ()=>{
  const rawNick = liNickname.value;
  const pass    = liPassword.value;

  liHint.textContent = "";
  const nick = normNick(rawNick);
  if(!nick){ liHint.textContent = "닉네임을 입력해 주세요."; return; }
  if(!pass){ liHint.textContent = "패스워드를 입력해 주세요."; return; }

  try{
    // 1) 닉네임 존재 확인
    const nickRef = doc(db, NICK_COLLECTION, nick);
    const nickSnap= await getDoc(nickRef);
    if(!nickSnap.exists()){
      liHint.textContent = "등록되지 않은 닉네임입니다. 먼저 가입해 주세요.";
      return;
    }

    // 2) Auth 로그인
    const email = emailFromNick(nick);
    await signInWithEmailAndPassword(auth, email, pass);

    // 3) 성공 화면
    hide(loginBox); hide(startBox); show(welcomeBox);
    who.textContent = `닉네임: ${nick}`;
  }catch(err){
    console.error(err);
    liHint.textContent = "로그인 실패: 닉네임 또는 패스워드가 올바르지 않습니다.";
  }
});

// ==== 처음으로 / 로그아웃 ====
backHome.addEventListener('click', toHome);
logoutBtn.addEventListener('click', async ()=>{
  await signOut(auth);
  toHome();
});
